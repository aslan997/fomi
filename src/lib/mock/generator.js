import { CATALOG } from "./catalog";

// Deterministic mock generation: the same input always produces the same
// result, so demos and screenshots are reproducible. Nothing here is AI.

/** FNV-1a 32-bit hash -> unsigned int. */
export function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function tokenize(text) {
  return new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
}

/**
 * Ranks catalog items by how many prompt words match their tags, breaking ties
 * with a seeded hash so different seeds explore different results.
 */
function pickItems(pool, prompt, seed, count) {
  const words = tokenize(prompt);
  return pool
    .map((item) => ({
      item,
      score: item.tags.reduce((n, tag) => n + (words.has(tag) ? 1 : 0), 0),
      tiebreak: hash(`${seed}:${item.id}`),
    }))
    .sort((a, b) => b.score - a.score || a.tiebreak - b.tiebreak)
    .slice(0, count)
    .map(({ item }) => item);
}

/** Simulated latency so loading states are visible; deterministic per request. */
export function simulatedDelayMs(input) {
  const base = input.mode === "video" ? 2200 : 1300;
  return base + (hash(input.prompt) % 700) + input.count * 120;
}

export function createGeneration(input, { now = new Date() } = {}) {
  const seed = input.seed ?? hash(`${input.prompt}|${now.getTime()}`) % 1_000_000;
  const generationId = `gen_${hash(`${input.prompt}|${seed}|${now.getTime()}`).toString(36)}`;
  const pool = CATALOG[input.collection][input.mode];
  const items = input.scenario === "empty" ? [] : pickItems(pool, input.prompt, seed, input.count);

  return {
    generationId,
    status: "completed",
    type: input.mode,
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    model: input.model,
    aspectRatio: input.aspectRatio,
    style: input.style,
    guidance: input.guidance,
    seed,
    parentGenerationId: input.parentGenerationId,
    parentImageId: input.parentImageId,
    createdAt: now.toISOString(),
    images: items.map((item, i) => ({
      id: `${generationId}_${i}`,
      sourceId: item.id,
      url: item.url,
      videoUrl: item.videoUrl ?? null,
      durationSeconds: item.durationSeconds ?? null,
      width: item.width,
      height: item.height,
      alt: item.alt,
    })),
  };
}
