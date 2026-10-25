import { createGeneration, simulatedDelayMs } from "@/lib/mock/generator";
import { validateGenerateRequest } from "@/lib/mock/validate-request";
import { createWorkspaceGeneration, workspaceDelayMs } from "@/lib/mock/workspace-generator";
import { validateWorkspaceRequest } from "@/lib/mock/validate-workspace-request";

// Mocked generation endpoint. Validates input, waits a short deterministic
// delay, and returns results from a local image library. No AI is involved.
//
// `collection` selects the library: "studio" (Part A) or "workspace" (Part B,
// which also supports variations of a parent image).

const HANDLERS = {
  studio: { validate: validateGenerateRequest, delay: simulatedDelayMs, create: createGeneration },
  workspace: { validate: validateWorkspaceRequest, delay: workspaceDelayMs, create: createWorkspaceGeneration },
};

const sleep = (ms, signal) =>
  new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    });
  });

const error = (status, code, message, extra = {}) => Response.json({ error: { code, message, ...extra } }, { status });

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, "invalid_json", "Request body must be valid JSON.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return error(422, "validation_failed", "Some fields are invalid.", { fields: { body: "Expected a JSON object." } });
  }

  const handler = HANDLERS[body.collection ?? "studio"];
  if (!handler) {
    return error(422, "validation_failed", "Some fields are invalid.", {
      fields: { collection: `Must be one of: ${Object.keys(HANDLERS).join(", ")}.` },
    });
  }

  const { value, errors } = handler.validate(body);
  if (errors) return error(422, "validation_failed", "Some fields are invalid.", { fields: errors });

  await sleep(handler.delay(value), request.signal);

  if (value.scenario === "error") {
    return error(
      503,
      "generation_unavailable",
      "The generation service is temporarily unavailable. Your prompt and settings were kept — try again.",
      { retryable: true }
    );
  }

  return Response.json(handler.create(value));
}
