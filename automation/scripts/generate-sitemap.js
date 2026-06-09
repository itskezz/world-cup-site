// automation/scripts/generate-sitemap.js
import { readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { requireEnv } from "../lib/env.js";
import { logger } from "../lib/logger.js";

const siteDir = new URL("../../site/", import.meta.url);
const siteBaseUrl = requireEnv("SITE_BASE_URL").replace(/\/$/, "");

async function findHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await findHtmlFiles(fullPath));
    }

    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

function toUrl(filePath) {
  const rel = relative(siteDir.pathname, filePath).replaceAll("\\", "/");
  return `${siteBaseUrl}/${rel}`;
}

async function main() {
  const htmlFiles = await findHtmlFiles(siteDir.pathname);
  const now = new Date().toISOString();

  const urls = htmlFiles.map((file) => `
  <url>
    <loc>${toUrl(file)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${file.endsWith("index.html") ? "1.0" : "0.7"}</priority>
  </url>`).join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>
`;

  await writeFile(new URL("../../site/sitemap.xml", import.meta.url), sitemap, "utf8");

  logger.info("sitemap_generated", { count: htmlFiles.length });
}

main().catch((error) => {
  logger.error("sitemap_failed", { error: error.message });
  process.exitCode = 1;
});