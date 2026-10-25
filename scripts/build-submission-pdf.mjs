// Builds docs/submission.pdf from docs/SUBMISSION.md (+ the product thinking doc).
//
// Usage:
//   VERCEL_URL=https://your-app.vercel.app CANDIDATE_NAME="Your Name" npm run submission:pdf
//
// Placeholders that aren't provided stay visible as "[… — add before submitting]"
// so an unfinished PDF can't be mistaken for a final one.
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { chromium } from "playwright-core";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const url = (process.env.VERCEL_URL ?? "").replace(/\/$/, "");
const name = process.env.CANDIDATE_NAME ?? "";
const product = read("docs/PRODUCT_THINKING.md").replace(/^# .*\n/, "## Product thinking — Part B\n");

const markdown = read("docs/SUBMISSION.md")
  .replaceAll("{{VERCEL_URL}}", url || "[Vercel URL — add before submitting]")
  .replaceAll("{{CANDIDATE_NAME}}", name || "[Name — add before submitting]")
  .replace("{{PRODUCT_THINKING}}", product);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font: 10.5pt/1.55 -apple-system, "Segoe UI", Inter, Helvetica, Arial, sans-serif; color: #1c1b19; }
  h1 { font-size: 20pt; margin: 0 0 10pt; letter-spacing: -0.01em; }
  h2 { font-size: 13pt; margin: 18pt 0 6pt; padding-top: 6pt; border-top: 1px solid #e6e3de; }
  h3 { font-size: 11pt; margin: 12pt 0 4pt; }
  p, li { margin: 4pt 0; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 9.5pt; }
  th, td { border: 1px solid #e6e3de; padding: 4pt 6pt; text-align: left; vertical-align: top; }
  th { background: #f6f4f1; }
  code { font: 9pt ui-monospace, Consolas, monospace; background: #f3f1ee; padding: 0 3px; border-radius: 3px; }
  a { color: #8a5a12; }
  hr { border: 0; border-top: 1px solid #e6e3de; margin: 16pt 0; }
  h2, h3 { break-after: avoid; } table, li { break-inside: avoid; }
</style></head><body>${marked.parse(markdown)}</body></html>`;

const out = process.env.SUBMISSION_OUT ? path.resolve(process.env.SUBMISSION_OUT) : path.join(root, "docs/submission.pdf");
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? "chrome" });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "load" });
await page.pdf({ path: out, format: "A4", printBackground: true });
// `--png <file>`: also save a screenshot of the rendered document for a quick visual check.
const pngArg = process.argv.indexOf("--png");
if (pngArg !== -1) {
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.screenshot({ path: process.argv[pngArg + 1], fullPage: true });
}
await browser.close();
console.log(`Wrote ${path.relative(root, out)}${url ? "" : " (draft: VERCEL_URL not set)"}`);
