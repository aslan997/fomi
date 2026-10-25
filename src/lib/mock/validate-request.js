import {
  ASPECT_RATIOS,
  IMAGE_COUNTS,
  MODES,
  NEGATIVE_PROMPT_MAX_LENGTH,
  PROMPT_MAX_LENGTH,
  STYLES,
  findModel,
} from "@/lib/generation-options";
import { COLLECTIONS } from "./catalog";

const SCENARIOS = ["success", "error", "empty"];
const ID_PATTERN = /^[a-z0-9_]{1,64}$/i;

/**
 * Validates and normalizes a generation request body.
 * Returns { value } on success or { errors: { field: message } } on failure.
 */
export function validateGenerateRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: { body: "Expected a JSON object." } };
  }

  const errors = {};
  const mode = body.mode ?? "image";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (!MODES.includes(mode)) errors.mode = `Must be one of: ${MODES.join(", ")}.`;

  if (prompt.length < 3) errors.prompt = "Prompt must be at least 3 characters.";
  else if (prompt.length > PROMPT_MAX_LENGTH) errors.prompt = `Prompt must be at most ${PROMPT_MAX_LENGTH} characters.`;

  const collection = body.collection ?? "studio";
  if (!COLLECTIONS.includes(collection)) errors.collection = `Must be one of: ${COLLECTIONS.join(", ")}.`;

  if (!errors.mode) {
    if (!findModel(mode, body.model)) errors.model = `Unknown model for ${mode}.`;
    if (!ASPECT_RATIOS[mode].includes(body.aspectRatio)) {
      errors.aspectRatio = `Must be one of: ${ASPECT_RATIOS[mode].join(", ")}.`;
    }
  }

  const count = body.count ?? 4;
  if (!IMAGE_COUNTS.includes(count)) errors.count = `Must be one of: ${IMAGE_COUNTS.join(", ")}.`;

  const style = body.style ?? "none";
  if (!STYLES.some((s) => s.id === style)) errors.style = "Unknown style.";

  const guidance = body.guidance ?? 7;
  if (typeof guidance !== "number" || guidance < 1 || guidance > 20) errors.guidance = "Must be a number from 1 to 20.";

  const seed = body.seed ?? null;
  if (seed !== null && !(Number.isInteger(seed) && seed >= 0 && seed <= 999_999)) {
    errors.seed = "Must be an integer from 0 to 999999, or null for random.";
  }

  const negativePrompt = typeof body.negativePrompt === "string" ? body.negativePrompt.trim() : "";
  if (negativePrompt.length > NEGATIVE_PROMPT_MAX_LENGTH) {
    errors.negativePrompt = `Must be at most ${NEGATIVE_PROMPT_MAX_LENGTH} characters.`;
  }

  for (const key of ["parentGenerationId", "parentImageId"]) {
    if (body[key] != null && !(typeof body[key] === "string" && ID_PATTERN.test(body[key]))) {
      errors[key] = "Must be a generation id string or null.";
    }
  }

  const scenario = body.scenario ?? "success";
  if (!SCENARIOS.includes(scenario)) errors.scenario = `Must be one of: ${SCENARIOS.join(", ")}.`;

  if (Object.keys(errors).length > 0) return { errors };

  return {
    value: {
      mode,
      prompt,
      collection,
      model: body.model,
      aspectRatio: body.aspectRatio,
      count,
      style,
      guidance,
      seed,
      negativePrompt,
      parentGenerationId: body.parentGenerationId ?? null,
      parentImageId: body.parentImageId ?? null,
      scenario,
    },
  };
}
