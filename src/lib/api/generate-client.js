export class GenerationError extends Error {
  constructor(message, { code = "unknown", retryable = true, fields = null } = {}) {
    super(message);
    this.name = "GenerationError";
    this.code = code;
    this.retryable = retryable;
    this.fields = fields;
  }
}

/** Calls the mocked generation API. Throws GenerationError on any failure. */
export async function requestGeneration(input, { signal } = {}) {
  let response;
  try {
    response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new GenerationError("Network error — check your connection and try again.", { code: "network" });
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    const error = data?.error ?? {};
    throw new GenerationError(error.message ?? `Request failed (${response.status}).`, {
      code: error.code,
      retryable: error.retryable ?? response.status >= 500,
      fields: error.fields ?? null,
    });
  }
  return data;
}
