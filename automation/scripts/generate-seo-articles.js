// automation/scripts/generate-seo-articles.js
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
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
const MAX_ATTEMPTS = Number(process.env.MAX_ARTICLE_ATTEMPTS || 3);
const MIN_WORDS = Number(process.env.MIN_ARTICLE_WORDS || 750);

async function fileExists(fileUrl) {
  try {
    await access(fileUrl);
    return true;
  } catch {
    return false;
  }
}

function rotateItems(items) {
  if (!items.length) return items;

  const todayKey = Math.floor(Date.now() / 86_400_000);
  const offset = todayKey % items.length;

  return [...items.slice(offset), ...items.slice(0, offset)];
}

function shuffleTopics(topics, matchId) {
  const seed = Array.from(String(matchId)).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return [...topics].sort((a, b) => {
    const aScore = (seed + a.type.length * 17) % 97;
    const bScore = (seed + b.type.length * 17) % 97;
    return aScore - bScore;
  });
}

async function getTargetMatches(supabase) {
  const { data, error } = await supabase
    .from("matches")
    .select("id,home_team,away_team,kickoff_at,status,venue,competition")
    .in("status", ["scheduled", "live", "finished"])
    .order("kickoff_at", { ascending: true })
    .limit(80);

  if (error) throw error;

  return rotateItems(data || []).slice(0, MAX_MATCHES);
}

function buildPrompt(template, match, topic, attempt) {
  const retryInstruction = attempt > 1
    ? `\n\nPrevious attempt was too short or invalid. This is attempt ${attempt}. Expand every section with more tactical detail and context. Minimum ${MIN_WORDS} words is mandatory.`
    : "";

  return template
    .replace("{{PRIMARY_KEYWORD}}", topic.primaryKeyword)
    .replace("{{SEARCH_INTENT}}", topic.searchIntent)
    .replace("{{REQUIRED_SECTIONS}}", topic.requiredSections.map((item) => `- ${item}`).join("\n"))
    .replace("{{MATCH_JSON}}", JSON.stringify(match, null, 2))
    + retryInstruction;
}

async function generateValidArticle(template, match, topic) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const prompt = buildPrompt(template, match, topic, attempt);
      const text = await generateArticleText(prompt);
      const parsed = parseJsonObject(text);

      return validateArticle(parsed, match, topic, {
        minWords: MIN_WORDS,
        maxWords: Number(process.env.MAX_ARTICLE_WORDS || 1800)
      });
    } catch (error) {
      lastError = error;
      logger.warn("seo_article_attempt_failed", {
        matchId: match.id,
        type: topic.type,
        attempt,
        error: error.message
      });
    }
  }

  throw lastError || new Error("Article generation failed");
}

async function main() {
  const supabase = createSupabaseAdminClient();
  const siteBaseUrl = requireEnv("SITE_BASE_URL").replace(/\/$/, "");
  const template = await readFile(new URL("../prompts/seo-article.md", import.meta.url), "utf8");
  const articles = [];

  logger.info("seo_articles_started", {
    maxMatches: MAX_MATCHES,
    maxTopicsPerMatch: MAX_TOPICS_PER_MATCH,
    minWords: MIN_WORDS
  });

  await mkdir(new URL("../../site/articles/", import.meta.url), { recursive: true });

  const matches = await getTargetMatches(supabase);

  for (const match of matches) {
    const topics = shuffleTopics(buildArticleTopics(match), match.id).slice(0, MAX_TOPICS_PER_MATCH);

    for (const topic of topics) {
      const slug = slugify(`${match.home_team}-vs-${match.away_team}-${topic.slugSuffix}-${match.id}`);
      const articleUrl = new URL(`../../site/articles/${slug}.html`, import.meta.url);

      if (await fileExists(articleUrl)) {
        logger.info("seo_article_skipped_existing", {
          matchId: match.id,
          type: topic.type,
          slug
        });
        continue;
      }

      try {
        const article = await generateValidArticle(template, match, topic);
        const html = renderArticlePage({ article, match, topic, slug, siteBaseUrl });

        await writeFile(articleUrl, html, "utf8");
        const articleRow = {
          match_id: match.id,
          slug,
          url_path: `articles/${slug}.html`,
          title: article.title,
          description: article.description,
          article_type: topic.type,
          primary_keyword: topic.primaryKeyword,
          home_team: match.home_team,
          away_team: match.away_team,
          word_count: article.wordCount,
          status: "published"
        };

        const { error: articleError } = await supabase
          .from("generated_articles")
          .upsert(articleRow, { onConflict: "slug" });

        if (articleError) {
          throw articleError;
        }
        articles.push({
          slug,
          type: topic.type,
          title: article.title,
          description: article.description,
          primaryKeyword: topic.primaryKeyword,
          home_team: match.home_team,
          away_team: match.away_team,
          kickoff_at: match.kickoff_at,
          wordCount: article.wordCount
        });

        logger.info("seo_article_created", {
          matchId: match.id,
          type: topic.type,
          slug,
          wordCount: article.wordCount
        });
      } catch (error) {
        logger.warn("seo_article_skipped_failed", {
          matchId: match.id,
          type: topic.type,
          error: error.message
        });
      }
    }
  }

  await writeFile(
    new URL("../../site/analysis.html", import.meta.url),
    renderAnalysisIndex(articles),
    "utf8"
  );

  await writeFile(
    new URL("../../site/articles/articles.json", import.meta.url),
    JSON.stringify(articles, null, 2),
    "utf8"
  );

  logger.info("seo_articles_success", { count: articles.length });
}

main().catch((error) => {
  logger.error("seo_articles_failed", { error: error.message });
  process.exitCode = 1;
});