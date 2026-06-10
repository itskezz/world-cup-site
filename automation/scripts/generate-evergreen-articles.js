import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createSupabaseAdminClient } from "../adapters/db/supabaseAdmin.js";
import { generateArticleText } from "../adapters/ai/index.js";
import { parseJsonObject } from "../lib/safeJson.js";
import { slugify } from "../lib/slug.js";
import { buildEvergreenTopics } from "../lib/articleTopics.js";
import { validateArticle } from "../lib/validateArticle.js";
import { renderArticlePage } from "../lib/renderHtml.js";
import { requireEnv } from "../lib/env.js";
import { logger } from "../lib/logger.js";

const MAX_TOPICS = Number(process.env.MAX_TOPICS || 3);
const MIN_WORDS = Number(process.env.MIN_ARTICLE_WORDS || 650);

function buildEvergreenMatch(topic) {
  return {
    id: topic.slugSuffix,
    home_team: "World Cup",
    away_team: "2026",
    kickoff_at: "2026-06-11T00:00:00Z",
    status: "scheduled",
    venue: "United States, Canada, and Mexico",
    competition: "World Cup 2026"
  };
}

function buildPrompt(template, topic, match) {
  return template
    .replace("{{PRIMARY_KEYWORD}}", topic.primaryKeyword)
    .replace("{{SEARCH_INTENT}}", topic.searchIntent)
    .replace("{{REQUIRED_SECTIONS}}", topic.requiredSections.map((item) => `- ${item}`).join("\n"))
    .replace("{{MATCH_JSON}}", JSON.stringify({
      topic: topic.titleSeed,
      competition: "World Cup 2026",
      hostCountries: ["United States", "Canada", "Mexico"],
      note: "Use general guidance only. Do not invent ticket availability, prices, broadcasters, hotels, or official claims."
    }, null, 2));
}

async function main() {
  const supabase = createSupabaseAdminClient();
  const siteBaseUrl = requireEnv("SITE_BASE_URL").replace(/\/$/, "");
  const template = await readFile(new URL("../prompts/seo-article.md", import.meta.url), "utf8");

  logger.info("evergreen_articles_started");

  await mkdir(new URL("../../site/articles/", import.meta.url), { recursive: true });

  const topics = buildEvergreenTopics().slice(0, MAX_TOPICS);

  for (const topic of topics) {
    const slug = slugify(topic.slugSuffix);
    const match = buildEvergreenMatch(topic);

    const prompt = buildPrompt(template, topic, match);
    const text = await generateArticleText(prompt);
    const parsed = parseJsonObject(text);
    const article = validateArticle(parsed, match, topic, { minWords: MIN_WORDS });
    const html = renderArticlePage({ article, match, topic, slug, siteBaseUrl });

    await writeFile(new URL(`../../site/articles/${slug}.html`, import.meta.url), html, "utf8");

    const { error } = await supabase
      .from("generated_articles")
      .upsert({
        match_id: null,
        slug,
        url_path: `articles/${slug}.html`,
        title: article.title,
        description: article.description,
        article_type: topic.type,
        primary_keyword: topic.primaryKeyword,
        home_team: "World Cup",
        away_team: "2026",
        word_count: article.wordCount,
        status: "published"
      }, { onConflict: "slug" });

    if (error) throw error;

    logger.info("evergreen_article_created", {
      slug,
      type: topic.type,
      wordCount: article.wordCount
    });
  }

  logger.info("evergreen_articles_success", { count: topics.length });
}

main().catch((error) => {
  logger.error("evergreen_articles_failed", { error: error.message });
  process.exitCode = 1;
});