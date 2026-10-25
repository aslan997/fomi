import { FRAMINGS, GRADES } from "@/lib/workspace/options";

// Pre-rendered variants for the Part B mock: every base photo exists in each
// color grade × framing, so a "variation" can genuinely keep part of its
// parent's look (same subject, new light; same light, new subject; …).
// Photos: Unsplash License — see docs/CREDITS.md.

export const BASES = [
  { id: "street", alt: "woman in a long burgundy coat walking down a stone city street", tags: ["street", "city", "urban", "woman", "coat", "walking", "editorial", "sidewalk"] },
  { id: "highland", alt: "man in a navy jacket standing in a golden field facing the mountains", tags: ["highland", "field", "mountains", "man", "jacket", "landscape", "outdoor", "nature"] },
  { id: "forest", alt: "man in a dark green jacket walking past misty pines", tags: ["forest", "pines", "trees", "mist", "fog", "man", "jacket", "snow", "winter"] },
  { id: "studio", alt: "model in a beige trench coat against a warm studio backdrop", tags: ["studio", "trench", "coat", "model", "product", "detail", "beige", "fashion"] },
  { id: "desert", alt: "woman in a blue coat among desert rocks and mountains", tags: ["desert", "rocks", "woman", "coat", "mountains", "arid", "travel"] },
  { id: "concrete", alt: "lone figure beside a white concrete building", tags: ["concrete", "architecture", "brutalist", "building", "minimal", "figure", "white"] },
];

export const GRADE_KEYWORDS = {
  golden: ["golden", "sunset", "sunrise", "warm", "glow", "amber", "dusk"],
  blue: ["blue", "night", "cold", "cool", "twilight", "moody", "evening"],
  noir: ["noir", "monochrome", "black", "bw", "grayscale", "dramatic"],
  film: ["film", "analog", "35mm", "vintage", "faded", "grain", "retro"],
};

export const FRAMING_KEYWORDS = {
  close: ["close", "closeup", "portrait", "detail", "tight"],
  wide: ["wide", "establishing", "landscape", "panoramic", "full"],
  offset: ["offset", "thirds", "asymmetric", "negative", "space"],
};

export const WIDTH = 800;
export const HEIGHT = 1000;

export const GRADE_IDS = Object.keys(GRADES);
export const FRAMING_IDS = Object.keys(FRAMINGS);
export const BASE_IDS = BASES.map((b) => b.id);

export function lookUrl({ base, grade, framing }) {
  return `/images/workspace/${base}-${grade}-${framing}.webp`;
}

export function lookAlt({ base, grade, framing }) {
  const b = BASES.find((x) => x.id === base);
  return `${b?.alt ?? base}, ${GRADES[grade].toLowerCase()} light, ${FRAMINGS[framing].toLowerCase()} framing`;
}

export function isValidLook(look) {
  return (
    look &&
    typeof look === "object" &&
    BASE_IDS.includes(look.base) &&
    GRADE_IDS.includes(look.grade) &&
    FRAMING_IDS.includes(look.framing)
  );
}
