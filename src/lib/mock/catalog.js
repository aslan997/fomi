// Local image library the mock generator draws from. Tags let the mock return
// results that loosely match the prompt instead of arbitrary images.
// All photos: Unsplash License (see docs/CREDITS.md).

const PORTRAIT = { width: 720, height: 1030 };

const studio = [
  ["portrait-01", "smiling woman with red hair and freckles", ["portrait", "woman", "redhead", "red", "hair", "smiling", "auburn", "freckles", "warm"]],
  ["portrait-02", "laughing woman with red hair in a bun", ["portrait", "woman", "redhead", "red", "hair", "smiling", "freckles", "warm"]],
  ["portrait-03", "woman with auburn hair in a cream knit sweater", ["portrait", "woman", "redhead", "auburn", "sweater", "cream", "cashmere", "soft"]],
  ["portrait-04", "woman with long auburn hair, soft green background", ["portrait", "woman", "redhead", "auburn", "hair", "soft", "natural"]],
  ["portrait-05", "joyful redhead woman with hands on cheeks", ["portrait", "woman", "redhead", "red", "smiling", "expression", "joyful"]],
  ["portrait-06", "woman with copper hair and bangs in warm light", ["portrait", "woman", "redhead", "copper", "warm", "light", "golden"]],
  ["portrait-07", "woman with a copper bob in a beige sweater", ["portrait", "woman", "redhead", "sweater", "beige", "studio", "dark"]],
  ["portrait-08", "woman with red hair and glasses, grey background", ["portrait", "woman", "redhead", "red", "glasses", "grey", "gray"]],
  ["history-01", "woman reading by a warm lamp", ["woman", "reading", "lamp", "warm", "interior", "cozy", "book", "night"]],
  ["history-02", "snow-capped mountain glowing at sunset", ["mountain", "mountains", "snow", "sunset", "landscape", "alpine", "pink", "nature"]],
  ["history-03", "deep green pine forest", ["forest", "trees", "green", "dark", "woods", "nature", "moody"]],
  ["history-04", "woman reflected in an ornate white mirror", ["woman", "mirror", "reflection", "portrait", "white", "ornate"]],
  ["history-05", "abstract violet figure", ["abstract", "purple", "violet", "neon", "figure", "surreal", "3d"]],
  ["history-06", "face behind rain-covered glass", ["portrait", "face", "water", "rain", "glass", "moody", "drops"]],
  ["history-07", "smiling woman in a skincare portrait", ["portrait", "woman", "skincare", "beauty", "white", "clean", "product"]],
  ["history-08", "woman surrounded by pink flowers", ["portrait", "woman", "flowers", "floral", "pink", "spring", "blossom"]],
  ["history-09", "Eiffel Tower against a pink sky", ["paris", "eiffel", "tower", "pink", "sky", "city", "travel", "architecture"]],
  ["history-10", "silhouette against a sunlit window", ["silhouette", "window", "sunlight", "light", "shadow", "interior", "man"]],
  ["history-11", "woman holding a lantern at night", ["woman", "candle", "lantern", "night", "dark", "warm", "moody", "portrait"]],
  ["history-12", "fluffy cat holding a handwritten sign", ["cat", "animal", "pet", "sign", "funny", "cute"]],
  ["history-13", "green neon lights in a dark corridor", ["neon", "green", "corridor", "dark", "light", "futuristic", "interior", "cyberpunk"]],
  ["history-14", "figure in a white dress in the mist", ["woman", "dress", "white", "mist", "fog", "ethereal", "dreamy", "fashion"]],
].map(([id, alt, tags]) => ({ id, alt, tags, url: `/images/studio/${id}.webp`, ...PORTRAIT }));

// Short mock clips rendered from the stills above (see docs/ARCHITECTURE.md).
const studioVideos = [
  ["clip-01", "history-02", "slow push-in on a sunset mountain", ["mountain", "snow", "sunset", "landscape", "nature"]],
  ["clip-02", "history-13", "drifting through a green neon corridor", ["neon", "green", "corridor", "futuristic", "cyberpunk"]],
  ["clip-03", "portrait-03", "gentle portrait move, cream sweater", ["portrait", "woman", "redhead", "sweater", "soft"]],
  ["clip-04", "history-09", "Eiffel Tower under a pink sky", ["paris", "eiffel", "pink", "sky", "city"]],
].map(([id, poster, alt, tags]) => ({
  id,
  alt,
  tags,
  url: `/images/studio/${poster}.webp`,
  videoUrl: `/mock/video/${id}.webm`,
  durationSeconds: 4,
  ...PORTRAIT,
}));

export const CATALOG = {
  studio: { image: studio, video: studioVideos },
};

export const COLLECTIONS = Object.keys(CATALOG);
