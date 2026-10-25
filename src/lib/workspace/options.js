// Generation options for the Part B workspace. Shared by the UI and the mock API.

export const WS_MODELS = [
  { id: "studio-v3", label: "Studio v3", description: "Balanced, campaign-ready" },
  { id: "photoreal", label: "Photoreal", description: "Maximum photographic detail" },
  { id: "draft", label: "Draft", description: "Fast previews for exploring" },
];

export const WS_RATIOS = ["4:5", "1:1", "2:3", "3:2", "16:9", "9:16"];

export const WS_COUNTS = [1, 2, 3, 4];

/**
 * Ways to branch from an image. Each one keeps part of the parent's look and
 * explores the rest — that's what makes a branch continuous with its parent.
 */
export const VARIATION_INTENTS = [
  { id: "lighting", label: "Lighting", keeps: "subject & framing", explores: "light and color grade" },
  { id: "framing", label: "Framing", keeps: "subject & light", explores: "crop and composition" },
  { id: "subject", label: "Subject", keeps: "light & framing", explores: "scene and subject" },
  { id: "remix", label: "Remix", keeps: "subject", explores: "anything the prompt asks for" },
];

export const GRADES = {
  neutral: "Natural",
  golden: "Golden hour",
  blue: "Blue hour",
  noir: "Noir",
  film: "Film fade",
};

export const FRAMINGS = {
  standard: "Standard",
  close: "Close-up",
  wide: "Wide",
  offset: "Off-center",
};

export function findIntent(id) {
  return VARIATION_INTENTS.find((i) => i.id === id) ?? null;
}

/** Human summary of what an image looks like, e.g. "Golden hour · Close-up". */
export function describeLook(look) {
  if (!look) return "";
  return `${GRADES[look.grade]} · ${FRAMINGS[look.framing]}`;
}
