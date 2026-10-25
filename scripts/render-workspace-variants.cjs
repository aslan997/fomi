// Offline asset tool (not part of the app). Renders grade × framing variants of
// each Part B base photo with a canvas in headless Chrome.
// Usage (from repo root): node scripts/render-workspace-variants.cjs <dir with base JPGs> [onlyBase]
const { createRequire } = require("node:module");
const fs = require("node:fs");
const path = require("node:path");
const r = createRequire(process.cwd() + "/package.json");
const { chromium } = r("playwright-core");

const FOCAL = {
  concrete: [0.43, 0.76],
  desert: [0.45, 0.36],
  forest: [0.72, 0.42],
  highland: [0.49, 0.34],
  street: [0.55, 0.55],
  studio: [0.5, 0.3],
};
const GRADES = ["neutral", "golden", "blue", "noir", "film"];
const FRAMINGS = ["standard", "close", "wide", "offset"];

(async () => {
  const [basesDir, only] = process.argv.slice(2);
  const outDir = path.join(process.cwd(), "public/images/workspace");
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage();
  await page.setContent("<canvas id=c width=800 height=1000></canvas>");
  let total = 0;
  for (const [base, focal] of Object.entries(FOCAL)) {
    if (only && only !== base) continue;
    const dataUrl = "data:image/jpeg;base64," + fs.readFileSync(path.join(basesDir, `${base}.jpg`)).toString("base64");
    const results = await page.evaluate(
      async ({ dataUrl, focal, GRADES, FRAMINGS }) => {
        const img = new Image();
        img.src = dataUrl;
        await img.decode();
        const c = document.getElementById("c");
        const g = c.getContext("2d");
        const W = c.width;
        const H = c.height;
        const [fx, fy] = focal;

        // Source rect for a framing: zoom 1 = full (4:5) source; focal-aware panning.
        const frame = (framing) => {
          const zoom = { standard: 1.14, close: 1.8, wide: 1.0, offset: 1.38 }[framing];
          const sw = img.width / zoom;
          const sh = img.height / zoom;
          let cx = img.width / 2 + (fx * img.width - img.width / 2) * 0.35;
          let cy = img.height / 2 + (fy * img.height - img.height / 2) * 0.35;
          if (framing === "close") {
            cx = fx * img.width;
            cy = fy * img.height;
          }
          if (framing === "offset") {
            // place the subject on the right third line
            cx = fx * img.width - sw * (2 / 3 - 0.5);
            cy = fy * img.height + sh * 0.08;
          }
          const sx = Math.min(Math.max(cx - sw / 2, 0), img.width - sw);
          const sy = Math.min(Math.max(cy - sh / 2, 0), img.height - sh);
          return [sx, sy, sw, sh];
        };

        const overlay = (color, mode, alpha) => {
          g.save();
          g.globalCompositeOperation = mode;
          g.globalAlpha = alpha;
          g.fillStyle = color;
          g.fillRect(0, 0, W, H);
          g.restore();
        };
        const vignette = (strength) => {
          const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
          v.addColorStop(0, "rgba(0,0,0,0)");
          v.addColorStop(1, `rgba(0,0,0,${strength})`);
          g.fillStyle = v;
          g.fillRect(0, 0, W, H);
        };
        const glow = (x, y, color, alpha) => {
          const gr = g.createRadialGradient(x, y, 0, x, y, H * 0.9);
          gr.addColorStop(0, color);
          gr.addColorStop(1, "rgba(0,0,0,0)");
          g.save();
          g.globalCompositeOperation = "screen";
          g.globalAlpha = alpha;
          g.fillStyle = gr;
          g.fillRect(0, 0, W, H);
          g.restore();
        };
        // Deterministic grain.
        let seed = 7;
        const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        const grain = (amount) => {
          const id = g.getImageData(0, 0, W, H);
          const d = id.data;
          for (let i = 0; i < d.length; i += 4) {
            const n = (rand() - 0.5) * amount;
            d[i] += n;
            d[i + 1] += n;
            d[i + 2] += n;
          }
          g.putImageData(id, 0, 0);
        };

        const FILTER = {
          neutral: "none",
          golden: "saturate(1.15) contrast(1.06) brightness(1.04) sepia(0.28)",
          blue: "saturate(0.8) contrast(1.1) brightness(0.86) hue-rotate(-6deg)",
          noir: "grayscale(1) contrast(1.4) brightness(0.92)",
          film: "saturate(0.78) contrast(0.86) brightness(1.06) sepia(0.14)",
        };

        const out = {};
        for (const framing of FRAMINGS) {
          const [sx, sy, sw, sh] = frame(framing);
          for (const grade of GRADES) {
            g.save();
            g.filter = FILTER[grade];
            g.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
            g.restore();
            if (grade === "golden") {
              overlay("#ff9a3c", "soft-light", 0.38);
              glow(W * 0.85, H * 0.08, "rgba(255,190,110,0.9)", 0.35);
              vignette(0.35);
            } else if (grade === "blue") {
              overlay("#2c4f86", "soft-light", 0.55);
              overlay("#0d1830", "multiply", 0.18);
              vignette(0.45);
            } else if (grade === "noir") {
              vignette(0.55);
              grain(14);
            } else if (grade === "film") {
              overlay("#3a2e25", "screen", 0.22);
              overlay("#e9c9a0", "soft-light", 0.2);
              grain(18);
              vignette(0.2);
            }
            out[`${grade}-${framing}`] = c.toDataURL("image/webp", 0.74);
          }
        }
        return out;
      },
      { dataUrl, focal, GRADES, FRAMINGS }
    );
    for (const [key, url] of Object.entries(results)) {
      fs.writeFileSync(path.join(outDir, `${base}-${key}.webp`), Buffer.from(url.split(",")[1], "base64"));
      total++;
    }
    console.log(base, Object.keys(results).length);
  }
  await browser.close();
  console.log("total", total);
})();
