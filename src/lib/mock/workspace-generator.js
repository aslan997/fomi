import { hash } from "./generator";
import {
  BASES,
  FRAMING_IDS,
  FRAMING_KEYWORDS,
  GRADE_IDS,
  GRADE_KEYWORDS,
  HEIGHT,
  WIDTH,
  lookAlt,
  lookUrl,
} from "./workspace-library";

// Deterministic mock for Part B. A fresh prompt picks scenes by keyword; a
// variation holds part of the parent's look fixed and explores the rest.

const words = (text) => new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
const keywordScore = (set, keywords) => keywords.reduce((n, k) => n + (set.has(k) ? 1 : 0), 0);

function preferred(map, set, fallback) {
  let best = fallback;
  let bestScore = 0;
  for (const [id, keywords] of Object.entries(map)) {
    const score = keywordScore(set, keywords);
    if (score > bestScore) [best, bestScore] = [id, score];
  }
  return best;
}

/** Ranks candidate looks by a score function, breaking ties with the seed. */
function rank(candidates, seed, score) {
  return candidates
    .map((look) => ({ look, s: score(look), t: hash(`${seed}:${look.base}-${look.grade}-${look.framing}`) }))
    .sort((a, b) => b.s - a.s || a.t - b.t)
    .map(({ look }) => look);
}

function freshLooks(text, seed) {
  const set = words(text);
  const grade = preferred(GRADE_KEYWORDS, set, "neutral");
  const framing = preferred(FRAMING_KEYWORDS, set, "standard");
  const candidates = BASES.map((b) => ({ base: b.id, grade, framing }));
  return rank(candidates, seed, (look) => keywordScore(set, BASES.find((b) => b.id === look.base).tags));
}

function variationLooks(parent, intent, text, seed) {
  const set = words(text);
  const gradeHint = (g) => keywordScore(set, GRADE_KEYWORDS[g] ?? []);
  const framingHint = (f) => keywordScore(set, FRAMING_KEYWORDS[f] ?? []);

  switch (intent) {
    case "lighting":
      return rank(
        GRADE_IDS.filter((g) => g !== parent.grade).map((grade) => ({ ...parent, grade })),
        seed,
        (l) => gradeHint(l.grade)
      );
    case "framing":
      return rank(
        FRAMING_IDS.filter((f) => f !== parent.framing).map((framing) => ({ ...parent, framing })),
        seed,
        (l) => framingHint(l.framing)
      );
    case "subject":
      return rank(
        BASES.filter((b) => b.id !== parent.base).map((b) => ({ ...parent, base: b.id })),
        seed,
        (l) => keywordScore(set, BASES.find((b) => b.id === l.base).tags)
      );
    default: {
      // Remix: same subject, any light/framing the prompt points toward.
      const all = GRADE_IDS.flatMap((grade) => FRAMING_IDS.map((framing) => ({ base: parent.base, grade, framing })));
      return rank(
        all.filter((l) => l.grade !== parent.grade || l.framing !== parent.framing),
        seed,
        (l) => gradeHint(l.grade) * 2 + framingHint(l.framing) * 2
      );
    }
  }
}

export function workspaceDelayMs(input) {
  return 1100 + (hash(input.prompt) % 600) + input.count * 150;
}

export function createWorkspaceGeneration(input, { now = new Date() } = {}) {
  const seed = input.seed ?? hash(`${input.prompt}|${now.getTime()}`) % 1_000_000;
  const generationId = `gen_${hash(`${input.prompt}|${seed}|${now.getTime()}|${input.parentImageId}`).toString(36)}`;
  const text = `${input.prompt} ${input.variation?.note ?? ""}`;

  const looks =
    input.scenario === "empty"
      ? []
      : (input.parentLook ? variationLooks(input.parentLook, input.variation?.intent, text, seed) : freshLooks(text, seed)).slice(
          0,
          input.count
        );

  return {
    generationId,
    status: "completed",
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    model: input.model,
    aspectRatio: input.aspectRatio,
    seed,
    parentGenerationId: input.parentGenerationId,
    parentImageId: input.parentImageId,
    variation: input.variation,
    createdAt: now.toISOString(),
    images: looks.map((look, i) => ({
      id: `${generationId}_${i}`,
      url: lookUrl(look),
      width: WIDTH,
      height: HEIGHT,
      alt: lookAlt(look),
      look,
    })),
  };
}
