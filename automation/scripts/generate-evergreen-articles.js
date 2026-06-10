import { access, mkdir, readFile, writeFile } from "node:fs/promises";
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
const MAX_ATTEMPTS = Number(process.env.MAX_ARTICLE_ATTEMPTS || 3);

async function fileExists(fileUrl) {
  try {
    await access(fileUrl);
    return true;
  } catch {
    return false;
  }
}

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

function buildPrompt(template, topic, attempt) {
  const retryInstruction = attempt > 1
    ? `\n\nPrevious attempt was too short or invalid. This is attempt ${attempt}. Expand every section. The article must exceed ${MIN_WORDS} words and should ideally exceed 1000 words.`
    : "";

  return template
    .replace("{{EVERGREEN_TOPIC}}", topic.titleSeed)
    .replace("{{PRIMARY_KEYWORD}}", topic.primaryKeyword)
    .replace("{{SEARCH_INTENT}}", topic.searchIntent)
    .replace("{{REQUIRED_SECTIONS}}", topic.requiredSections.map((item) => `- ${item}`).join("\n"))
    .replace("{{CONTEXT_DATA}}", JSON.stringify({
      competition: "World Cup 2026",
      hostCountries: ["United States", "Canada", "Mexico"],
      safetyNote: "Use general informational guidance only. Do not invent ticket prices, official ticket availability, broadcasters, hotels, teams, injuries, or private details."
    }, null, 2))
    + retryInstruction;
}

async function generateValidEvergreenArticle(template, topic, match) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const prompt = buildPrompt(template, topic, attempt);
      const text = await generateArticleText(prompt);
      const parsed = parseJsonObject(text);

      return validateArticle(parsed, match, topic, {
        minWords: MIN_WORDS,
        maxWords: Number(process.env.MAX_ARTICLE_WORDS || 1800)
      });
    } catch (error) {
      lastError = error;

      logger.warn("evergreen_article_attempt_failed", {
        slug: topic.slugSuffix,
        attempt,
        error: error.message
      });
    }
  }

  throw lastError || new Error("Evergreen article generation failed");
}

async function main() {
  const supabase = createSupabaseAdminClient();
  const siteBaseUrl = requireEnv("SITE_BASE_URL").replace(/\/$/, "");
  const template = await readFile(new URL("../prompts/evergreen-article.md", import.meta.url), "utf8");

  logger.info("evergreen_articles_started", {
    maxTopics: MAX_TOPICS,
    minWords: MIN_WORDS,
    maxAttempts: MAX_ATTEMPTS
  });

  await mkdir(new URL("../../site/articles/", import.meta.url), { recursive: true });

  const topics = buildEvergreenTopics().slice(0, MAX_TOPICS);
  let created = 0;
  let skipped = 0;

  for (const topic of topics) {
    const slug = slugify(topic.slugSuffix);
    const articleUrl = new URL(`../../site/articles/${slug}.html`, import.meta.url);

    if (await fileExists(articleUrl)) {
      logger.info("evergreen_article_skipped_existing", { slug });
      skipped += 1;
      continue;
    }

    try {
      const match = buildEvergreenMatch(topic);
      const article = await generateValidEvergreenArticle(template, topic, match);
      const html = renderArticlePage({ article, match, topic, slug, siteBaseUrl });

      await writeFile(articleUrl, html, "utf8");

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

      created += 1;

      logger.info("evergreen_article_created", {
        slug,
        type: topic.type,
        wordCount: article.wordCount
      });
    } catch (error) {
      skipped += 1;

      logger.warn("evergreen_article_skipped_failed", {
        slug,
        type: topic.type,
        error: error.message
      });
    }
  }

  logger.info("evergreen_articles_success", {
    created,
    skipped
  });
}

main().catch((error) => {
  logger.error("evergreen_articles_failed", { error: error.message });
  process.exitCode = 1;
});