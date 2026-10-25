// Offline asset tool (not part of the app). Rasterizes src/app/icon.svg into
// src/app/favicon.ico (16 + 32 px, PNG-encoded) and src/app/apple-icon.png (180 px).
// Usage (from repo root): node scripts/render-icons.cjs
const { createRequire } = require("node:module");
const fs = require("node:fs");
const path = require("node:path");
const r = createRequire(path.join(process.cwd(), "package.json"));
const { chromium } = r("playwright-core");

const appDir = path.join(process.cwd(), "src/app");
const svg = fs.readFileSync(path.join(appDir, "icon.svg"), "utf8");

/** ICO container holding PNG images (supported by all current browsers). */
function toIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + pngs.length * 16;
  const entries = pngs.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4); // color planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

(async () => {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? "chrome" });
  const page = await browser.newPage();
  const render = async (size, { inset = 0, background = "transparent" } = {}) => {
    await page.setViewportSize({ width: size, height: size });
    const inner = size - inset * 2;
    await page.setContent(
      `<style>html,body{margin:0;background:${background}}div{padding:${inset}px}svg{display:block;width:${inner}px;height:${inner}px}</style><div>${svg}</div>`
    );
    return page.screenshot({ omitBackground: background === "transparent", clip: { x: 0, y: 0, width: size, height: size } });
  };

  const ico = toIco([
    { size: 16, data: await render(16) },
    { size: 32, data: await render(32) },
  ]);
  fs.writeFileSync(path.join(appDir, "favicon.ico"), ico);

  // iOS applies its own rounding, so the apple icon is full-bleed graphite.
  fs.writeFileSync(path.join(appDir, "apple-icon.png"), await render(180, { background: "#0b0c0e" }));

  await browser.close();
  console.log("Wrote favicon.ico (16, 32) and apple-icon.png (180)");
})();
