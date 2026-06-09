// site/assets/js/common.js
import { config } from "./config.js";

const navItems = [
  ["Home", "./index.html"],
  ["Live", "./live.html"],
  ["Groups", "./groups.html"],
  ["Predictor", "./predictor.html"],
  ["Analysis", "./analysis.html"],
  ["Contact", "./contact.html"]
];

const legalItems = [
  ["Privacy", "./privacy.html"],
  ["Affiliate Disclosure", "./affiliate-disclosure.html"],
  ["Responsible Gambling", "./responsible-gambling.html"]
];

function getCurrentPage() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function renderHeader() {
  const target = document.querySelector("[data-site-header]");
  if (!target) return;

  const current = getCurrentPage();

  target.innerHTML = `
    <nav class="nav" aria-label="Main navigation">
      <a class="brand" href="./index.html">
        <strong>${config.siteName}</strong>
        <span>World Cup 2026</span>
      </a>
      <div class="nav-links">
        ${navItems.map(([label, href]) => {
          const file = href.replace("./", "");
          const active = file === current ? ' aria-current="page"' : "";
          return `<a href="${href}"${active}>${label}</a>`;
        }).join("")}
      </div>
    </nav>
  `;
}

function renderFooter() {
  const target = document.querySelector("[data-site-footer]");
  if (!target) return;

  target.innerHTML = `
    <div class="footer-inner">
      <span>&copy; ${new Date().getFullYear()} ${config.siteName}</span>
      <div class="footer-links">
        ${legalItems.map(([label, href]) => `<a href="${href}">${label}</a>`).join("")}
      </div>
    </div>
  `;
}

renderHeader();
renderFooter();