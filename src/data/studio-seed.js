import { CATALOG } from "@/lib/mock/catalog";

// Pre-existing history for Part A, so the page opens like the mockup: a
// returning user with past generations. Ordered oldest -> newest.

const PORTRAIT_PROMPT =
  "A professional portrait photograph of a smiling 31-year-old redheaded woman with warm brown eyes and softly tousled auburn hair framing her face. She is turned slightly towards the viewer, offering a genuine and approachable expression. She is wearing a cream-colored cashmere sweater and delicate gold earrings. The background is a softly blurred expanse of muted gray and beige tones, suggesting a modern art gallery. There is subtle directional lighting";

const images = Object.fromEntries(CATALOG.studio.image.map((i) => [i.id, i]));
const videos = Object.fromEntries(CATALOG.studio.video.map((v) => [v.id, v]));

// [sourceIds, prompt, model, ratio, type]
const ENTRIES = [
  [["history-14"], "A figure in a flowing white dress dissolving into morning mist, ethereal fashion editorial", "fomi-real", "2:3"],
  [["clip-02"], "Endless corridor lit by green neon tubes, reflective floor, cyberpunk atmosphere", "fomi-motion", "9:16", "video"],
  [["history-12"], "A fluffy cat holding a small handwritten sign that says hello world, cozy studio photo", "fomi-studio", "2:3"],
  [["history-11"], "Young woman holding a glowing lantern at night, warm candlelight on her face, moody portrait", "fomi-portrait", "2:3"],
  [["history-10"], "Silhouette of a person in front of a sunlit window, dramatic light and shadow", "fomi-real", "2:3"],
  [["history-09"], "The Eiffel Tower against a soft pink pastel sky with cotton candy clouds", "fomi-studio", "2:3"],
  [["history-08"], "Portrait of a woman surrounded by pink spring flowers, soft dreamy light", "fomi-portrait", "2:3"],
  [["history-07"], "Clean skincare campaign portrait, smiling model, white background, product beauty shot", "fomi-portrait", "2:3"],
  [["history-06"], "Close-up face behind rain-covered glass, cold tones, cinematic mood", "fomi-real", "2:3"],
  [["history-05"], "Abstract glowing violet figure, iridescent surreal 3D render", "fomi-illustrate", "2:3"],
  [["history-04"], "Woman looking at her reflection in an ornate white baroque mirror, soft daylight", "fomi-portrait", "2:3"],
  [["history-03"], "Deep green pine forest with a quiet path, moody overcast light", "fomi-real", "2:3"],
  [["clip-01"], "Snow-capped mountain peak glowing pink at sunset, slow cinematic push-in", "fomi-motion", "9:16", "video"],
  [["history-01"], "Woman reading in an armchair by a warm brass lamp, cozy evening interior", "fomi-portrait", "2:3"],
  [["portrait-01", "portrait-02", "portrait-03", "portrait-04"], PORTRAIT_PROMPT, "fomi-portrait", "2:3"],
  [["portrait-05", "portrait-06", "portrait-07", "portrait-08"], PORTRAIT_PROMPT, "fomi-portrait", "2:3"],
];

const START = Date.parse("2026-10-20T09:00:00Z");

export const STUDIO_SEED = ENTRIES.map(([sourceIds, prompt, model, aspectRatio, type = "image"], index) => {
  const generationId = `seed_${String(index + 1).padStart(2, "0")}`;
  return {
    generationId,
    status: "completed",
    type,
    prompt,
    negativePrompt: "",
    model,
    aspectRatio,
    style: "none",
    guidance: 7,
    seed: 1000 + index * 137,
    parentGenerationId: null,
    parentImageId: null,
    createdAt: new Date(START + index * 47 * 60_000).toISOString(),
    images: sourceIds.map((sourceId, i) => {
      const item = type === "video" ? videos[sourceId] : images[sourceId];
      return {
        id: `${generationId}_${i}`,
        sourceId: item.id,
        url: item.url,
        videoUrl: item.videoUrl ?? null,
        durationSeconds: item.durationSeconds ?? null,
        width: item.width,
        height: item.height,
        alt: item.alt,
      };
    }),
  };
});
