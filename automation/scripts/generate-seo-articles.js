// automation/scripts/generate-seo-articles.js
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createSupabaseAdminClient } from "../adapters/db/supabaseAdmin.js";
import { generateArticleText } from "../adapters/ai/index.js";
import { parseJsonObject } from "../lib/safeJson.js";
import { slugify } from "../lib/slug.js";
import { buildArticleTopics } from "../lib/articleTopics.js";
import { validateArticle } from "../lib/validateArticle.js";
import { renderArticlePage, renderAnalysisIndex } from "../lib/renderHtml.js";
import { requireEnv } from "../lib/env.js";
import { logger } from "../lib/logger.js";

const MAX_MATCHES = Number(process.env.MAX_MATCHES || 4);
const MAX_TOPICS_PER_MATCH = Number(process.env.MAX_TOPICS_PER_MATCH || 4);

async function getTargetMatches(supabase) {
  const { data, error } = await supabase
    .from("matches")
    .select("id,home_team,away_team,kickoff_at,status,venue,competition")
    .in("status", ["scheduled", "live", "finished"])
    .order("kickoff_at", { ascending: true })
    .limit(MAX_MATCHES);

  if (error) throw error;
  return data || [];
}

function buildPrompt(template, match, topic) {
  return template
    .replace("{{PRIMARY_KEYWORD}}", topic.primaryKeyword)
    .replace("{{SEARCH_INTENT}}", topic.searchIntent)
    .replace("{{REQUIRED_SECTIONS}}", topic.requiredSections.map((item) => `- ${item}`).join("\n"))
    .replace("{{MATCH_JSON}}", JSON.stringify(match, null, 2));
}

async function main() {
  const supabase = createSupabaseAdminClient();
  const siteBaseUrl = requireEnv("SITE_BASE_URL").replace(/\/$/, "");
  const template = await readFile(new URL("../prompts/seo-article.md", import.meta.url), "utf8");
  const articles = [];

  logger.info("seo_articles_started");

  await mkdir(new URL("../../site/articles/", import.meta.url), { recursive: true });

  const matches = await getTargetMatches(supabase);

  for (const match of matches) {
    const topics = buildArticleTopics(match).slice(0, MAX_TOPICS_PER_MATCH);

    for (const topic of topics) {
      const slug = slugify(`${match.home_team}-vs-${match.away_team}-${topic.slugSuffix}-${match.id}`);
      const prompt = buildPrompt(template, match, topic);
      const text = await generateArticleText(prompt);
      const parsed = parseJsonObject(text);
      const article = validateArticle(parsed, match, topic);
      const html = renderArticlePage({ article, match, topic, slug, siteBaseUrl });

      await writeFile(new URL(`../../site/articles/${slug}.html`, import.meta.url), html, "utf8");

      articles.push({
        slug,
        type: topic.type,
        title: article.title,
        description: article.description,
        home_team: match.home_team,
        away_team: match.away_team
      });

      logger.info("seo_article_created", { matchId: match.id, type: topic.type, slug });
    }
  }

  await writeFile(
    new URL("../../site/analysis.html", import.meta.url),
    renderAnalysisIndex(articles),
    "utf8"
  );

  logger.info("seo_articles_success", { count: articles.length });
}

main().catch((error) => {
  logger.error("seo_articles_failed", { error: error.message });
  process.exitCode = 1;
});