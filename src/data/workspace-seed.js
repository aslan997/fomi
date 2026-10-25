import { HEIGHT, WIDTH, lookAlt, lookUrl } from "@/lib/mock/workspace-library";

// The project a returning user opens: one campaign explored across a few
// branches. Every image is a real pre-rendered variant (see workspace-library).

const HERO_PROMPT =
  "Atlas FW26 hero: model in a long wool coat, editorial campaign photograph, natural overcast light, quiet confidence";

const look = (s) => {
  const [base, grade, framing] = s.split("/");
  return { base, grade, framing };
};

// [id, parent "gN_i" | null, intent, note, prompt, looks]
const ENTRIES = [
  ["g1", null, null, "", HERO_PROMPT, ["street/neutral/standard", "highland/neutral/standard", "desert/neutral/standard", "studio/neutral/standard"]],
  ["g2", "g1_0", "lighting", "warmer, end of day", HERO_PROMPT, ["street/golden/standard", "street/blue/standard", "street/film/standard", "street/noir/standard"]],
  ["g3", "g2_0", "framing", "", HERO_PROMPT, ["street/golden/close", "street/golden/wide", "street/golden/offset"]],
  ["g4", "g2_0", "subject", "keep the golden light across the range", HERO_PROMPT, ["highland/golden/standard", "desert/golden/standard", "forest/golden/standard", "concrete/golden/standard"]],
  ["g5", "g1_1", "lighting", "colder, more austere", HERO_PROMPT, ["highland/blue/standard", "highland/noir/standard", "highland/film/standard"]],
  [
    "g6",
    "g4_2",
    "remix",
    "",
    "Atlas FW26 hero: model in a waxed field jacket walking through misty pines at first light, close detail on the fabric, quiet confidence",
    ["forest/golden/close", "forest/film/close", "forest/blue/close"],
  ],
];

const START = Date.parse("2026-10-23T10:12:00Z");

const generations = ENTRIES.map(([id, parent, intent, note, prompt, looks], index) => {
  const parentGenerationId = parent ? parent.split("_")[0] : null;
  return {
    generationId: id,
    status: "completed",
    prompt,
    negativePrompt: "",
    model: index === 0 ? "studio-v3" : "photoreal",
    aspectRatio: "4:5",
    seed: 4211 + index * 97,
    parentGenerationId,
    parentImageId: parent,
    variation: intent ? { intent, note } : null,
    createdAt: new Date(START + index * 38 * 60_000).toISOString(),
    images: looks.map((s, i) => {
      const l = look(s);
      return { id: `${id}_${i}`, url: lookUrl(l), width: WIDTH, height: HEIGHT, alt: lookAlt(l), look: l };
    }),
  };
});

export const WORKSPACE_SEED = {
  id: "atlas-fw26",
  name: "FW26 Campaign",
  client: "Atlas Outerwear",
  generations,
  kept: { g3_0: true, g4_1: true, g6_0: true },
  activeGenerationId: "g4",
};
