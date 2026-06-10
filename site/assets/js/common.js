// site/assets/js/common.js
import { config } from "./config.js";

const navItems = [
  ["Home", "index.html"],
  ["Live", "live.html"],
  ["Groups", "groups.html"],
  ["Predictor", "predictor.html"],
  ["Analysis", "analysis.html"],
  ["Contact", "contact.html"]
];

const legalItems = [
  ["Privacy", "privacy.html"],
  ["Affiliate Disclosure", "affiliate-disclosure.html"],
  ["Responsible Gambling", "responsible-gambling.html"]
];

function getBasePath() {
  return window.location.pathname.includes("/articles/") ? "../" : "./";
}

function getCurrentPage() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function renderHeader() {
  const target = document.querySelector("[data-site-header]");
  if (!target) return;

  const base = getBasePath();
  const current = getCurrentPage();

  target.innerHTML = `
    <nav class="nav sport-nav" aria-label="Main navigation">
      <a class="brand sport-brand" href="${base}index.html">
        <span class="brand-ball" aria-hidden="true">◆</span>
        <span>
          <strong>${config.siteName}</strong>
          <small>World Cup 2026</small>
        </span>
      </a>
      <div class="nav-links">
        ${navItems.map(([label, href]) => {
          const active = href === current ? ' aria-current="page"' : "";
          return `<a href="${base}${href}"${active}>${label}</a>`;
        }).join("")}
      </div>
    </nav>
  `;
}

function renderFooter() {
  const target = document.querySelector("[data-site-footer]");
  if (!target) return;

  const base = getBasePath();

  target.innerHTML = `
    <div class="footer-inner">
      <span>&copy; ${new Date().getFullYear()} ${config.siteName}</span>
      <div class="footer-links">
        ${legalItems.map(([label, href]) => `<a href="${base}${href}">${label}</a>`).join("")}
      </div>
    </div>
  `;
}

renderHeader();
renderFooter();