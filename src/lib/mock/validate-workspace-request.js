import { NEGATIVE_PROMPT_MAX_LENGTH, PROMPT_MAX_LENGTH } from "@/lib/generation-options";
import { VARIATION_INTENTS, WS_COUNTS, WS_MODELS, WS_RATIOS } from "@/lib/workspace/options";
import { isValidLook } from "./workspace-library";

const SCENARIOS = ["success", "error", "empty"];
const ID_PATTERN = /^[a-z0-9_]{1,64}$/i;
const NOTE_MAX_LENGTH = 200;

/**
 * Validates a Part B ("workspace") generation request.
 * A variation must name its parent generation + image, the parent's look and an intent.
 * Returns { value } or { errors }.
 */
export function validateWorkspaceRequest(body) {
  const errors = {};
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (prompt.length < 3) errors.prompt = "Prompt must be at least 3 characters.";
  else if (prompt.length > PROMPT_MAX_LENGTH) errors.prompt = `Prompt must be at most ${PROMPT_MAX_LENGTH} characters.`;

  if (!WS_MODELS.some((m) => m.id === body.model)) errors.model = "Unknown model.";
  if (!WS_RATIOS.includes(body.aspectRatio)) errors.aspectRatio = `Must be one of: ${WS_RATIOS.join(", ")}.`;

  const count = body.count ?? 4;
  if (!WS_COUNTS.includes(count)) errors.count = `Must be one of: ${WS_COUNTS.join(", ")}.`;

  const seed = body.seed ?? null;
  if (seed !== null && !(Number.isInteger(seed) && seed >= 0 && seed <= 999_999)) {
    errors.seed = "Must be an integer from 0 to 999999, or null for random.";
  }

  const negativePrompt = typeof body.negativePrompt === "string" ? body.negativePrompt.trim() : "";
  if (negativePrompt.length > NEGATIVE_PROMPT_MAX_LENGTH) errors.negativePrompt = "Too long.";

  const isVariation = body.parentImageId != null;
  let variation = null;
  if (isVariation) {
    for (const key of ["parentGenerationId", "parentImageId"]) {
      if (!(typeof body[key] === "string" && ID_PATTERN.test(body[key]))) errors[key] = "Must be an id string.";
    }
    if (!isValidLook(body.parentLook)) errors.parentLook = "Must describe the parent image's look.";
    const intent = body.variation?.intent;
    if (!VARIATION_INTENTS.some((i) => i.id === intent)) {
      errors.variation = `Intent must be one of: ${VARIATION_INTENTS.map((i) => i.id).join(", ")}.`;
    }
    const note = typeof body.variation?.note === "string" ? body.variation.note.trim() : "";
    if (note.length > NOTE_MAX_LENGTH) errors.variation = `Note must be at most ${NOTE_MAX_LENGTH} characters.`;
    variation = { intent, note };
  }

  const scenario = body.scenario ?? "success";
  if (!SCENARIOS.includes(scenario)) errors.scenario = `Must be one of: ${SCENARIOS.join(", ")}.`;

  if (Object.keys(errors).length) return { errors };

  return {
    value: {
      collection: "workspace",
      prompt,
      model: body.model,
      aspectRatio: body.aspectRatio,
      count,
      seed,
      negativePrompt,
      parentGenerationId: isVariation ? body.parentGenerationId : null,
      parentImageId: isVariation ? body.parentImageId : null,
      parentLook: isVariation ? body.parentLook : null,
      variation,
      scenario,
    },
  };
}
