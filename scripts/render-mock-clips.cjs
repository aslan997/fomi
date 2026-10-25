// Offline asset tool (not part of the app). Renders the 4-second mock video
// clips used by Part A from local stills (canvas + MediaRecorder in Chrome).
// Usage (from repo root): node scripts/render-mock-clips.cjs
const { createRequire } = require("node:module");
const fs = require("node:fs");
const path = require("node:path");
const r = createRequire(process.cwd() + "/package.json");
const { chromium } = r("playwright-core");

const CLIPS = [
  // [out, source still, motion: zoomFrom, zoomTo, panX, panY]
  ["clip-01", "history-02", [1.0, 1.18, -0.04, 0.03]],
  ["clip-02", "history-13", [1.22, 1.0, 0.0, -0.05]],
  ["clip-03", "portrait-03", [1.0, 1.12, 0.03, -0.02]],
  ["clip-04", "history-09", [1.15, 1.0, -0.03, 0.04]],
];

(async () => {
  const outDir = path.join(process.cwd(), "public/mock/video");
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage();
  await page.setContent("<canvas id=c width=540 height=960></canvas>");
  for (const [name, still, motion] of CLIPS) {
    const dataUrl = "data:image/webp;base64," + fs.readFileSync(path.join(process.cwd(), `public/images/studio/${still}.webp`)).toString("base64");
    const b64 = await page.evaluate(
      async ({ dataUrl, motion }) => {
        const img = new Image();
        img.src = dataUrl;
        await img.decode();
        const c = document.getElementById("c");
        const g = c.getContext("2d");
        const [z0, z1, px, py] = motion;
        const duration = 4000;
        const stream = c.captureStream(30);
        const rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9", videoBitsPerSecond: 2_200_000 });
        const chunks = [];
        rec.ondataavailable = (e) => chunks.push(e.data);
        const done = new Promise((res) => (rec.onstop = res));
        const ease = (t) => 0.5 - Math.cos(Math.PI * t) / 2;
        const draw = (t) => {
          const k = ease(t);
          const z = z0 + (z1 - z0) * k;
          // cover-fit the still into 9:16, then zoom + pan
          const scale = Math.max(c.width / img.width, c.height / img.height) * z;
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (c.width - w) / 2 + px * c.width * k;
          const y = (c.height - h) / 2 + py * c.height * k;
          g.drawImage(img, x, y, w, h);
        };
        draw(0);
        rec.start();
        const start = performance.now();
        await new Promise((res) => {
          const tick = () => {
            const t = Math.min(1, (performance.now() - start) / duration);
            draw(t);
            if (t < 1) requestAnimationFrame(tick);
            else res();
          };
          requestAnimationFrame(tick);
        });
        rec.stop();
        await done;
        const blob = new Blob(chunks, { type: "video/webm" });
        const buf = new Uint8Array(await blob.arrayBuffer());
        let s = "";
        for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        return btoa(s);
      },
      { dataUrl, motion }
    );
    const file = path.join(outDir, `${name}.webm`);
    fs.writeFileSync(file, Buffer.from(b64, "base64"));
    console.log(name, (fs.statSync(file).size / 1024).toFixed(0) + "KB");
  }
  await browser.close();
})();
