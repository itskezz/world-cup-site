// automation/scripts/generate-preview.js
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createSupabaseAdminClient } from "../adapters/db/supabaseAdmin.js";
import { generatePredictionText } from "../adapters/ai/index.js";
import { parseJsonObject } from "../lib/safeJson.js";
import { slugify } from "../lib/slug.js";
import { validateArticle } from "../lib/validateArticle.js";
import { renderArticlePage, renderAnalysisIndex } from "../lib/renderHtml.js";
import { requireEnv } from "../lib/env.js";
import { logger } from "../lib/logger.js";

async function getUpcomingMatches(supabase) {
  const { data, error } = await supabase
    .from("matches")
    .select("id,home_team,away_team,kickoff_at,status,venue,competition")
    .eq("status", "scheduled")
    .gte("kickoff_at", new Date().toISOString())
    .order("kickoff_at", { ascending: true })
    .limit(5);

  if (error) throw error;
  return data || [];
}

async function main() {
  const supabase = createSupabaseAdminClient();
  const siteBaseUrl = requireEnv("SITE_BASE_URL").replace(/\/$/, "");
  const template = await readFile(new URL("../prompts/match-preview.md", import.meta.url), "utf8");
  const articles = [];

  logger.info("preview_generation_started");

  await mkdir(new URL("../../site/articles/", import.meta.url), { recursive: true });

  const matches = await getUpcomingMatches(supabase);

  for (const match of matches) {
    const slug = slugify(`${match.home_team}-vs-${match.away_team}-prediction-${match.id}`);
    const prompt = template.replace("{{MATCH_JSON}}", JSON.stringify(match, null, 2));
    const text = await generatePredictionText(prompt);
    const parsed = parseJsonObject(text);
    const article = validateArticle(parsed, match);

    const html = renderArticlePage({ article, match, slug, siteBaseUrl });

    await writeFile(new URL(`../../site/articles/${slug}.html`, import.meta.url), html, "utf8");

    articles.push({
      slug,
      title: article.title,
      description: article.description,
      home_team: match.home_team,
      away_team: match.away_team,
      kickoff_at: match.kickoff_at
    });

    logger.info("preview_article_created", { matchId: match.id, slug });
  }

  await writeFile(
    new URL("../../site/analysis.html", import.meta.url),
    renderAnalysisIndex(articles),
    "utf8"
  );

  logger.info("preview_generation_success", { count: articles.length });
}

main().catch((error) => {
  logger.error("preview_generation_failed", { error: error.message });
  process.exitCode = 1;
});