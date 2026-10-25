// Single source of truth for generation options. Imported by the UI (to render
// pickers) and by the API route (to validate input), so they can never drift apart.

export const MODES = ["image", "video"];

export const MODELS = {
  image: [
    { id: "fomi-portrait", label: "Portrait", description: "Natural skin, soft studio light" },
    { id: "fomi-real", label: "Realistic", description: "Photographic detail" },
    { id: "fomi-studio", label: "Studio", description: "Balanced, versatile" },
    { id: "fomi-illustrate", label: "Illustrate", description: "Painterly and graphic styles" },
  ],
  video: [
    { id: "fomi-motion", label: "Motion", description: "Short cinematic clips" },
    { id: "fomi-motion-lite", label: "Motion Lite", description: "Faster drafts" },
  ],
};

export const ASPECT_RATIOS = {
  image: ["1:1", "3:4", "4:3", "2:3", "16:9", "9:16"],
  video: ["16:9", "9:16", "1:1"],
};

export const IMAGE_COUNTS = [1, 2, 3, 4];

export const STYLES = [
  { id: "none", label: "None" },
  { id: "cinematic", label: "Cinematic" },
  { id: "editorial", label: "Editorial" },
  { id: "film", label: "35mm Film" },
  { id: "soft-light", label: "Soft Light" },
  { id: "noir", label: "Noir" },
  { id: "pastel", label: "Pastel" },
  { id: "illustration", label: "Illustration" },
];

export const PROMPT_MAX_LENGTH = 2000;
export const NEGATIVE_PROMPT_MAX_LENGTH = 500;

export function findModel(mode, id) {
  return MODELS[mode]?.find((m) => m.id === id) ?? null;
}

/** "3:4" -> 0.75 */
export function ratioToNumber(ratio) {
  const [w, h] = ratio.split(":").map(Number);
  return w / h;
}
