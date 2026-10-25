import { expect, test } from "@playwright/test";

const valid = { prompt: "snowy mountain at sunset", model: "fomi-studio", aspectRatio: "16:9", count: 2, collection: "studio" };

test.describe("POST /api/generate", () => {
  test.skip(({ isMobile }) => isMobile, "API checks run once");

  test("returns a completed generation for valid input", async ({ request }) => {
    const res = await request.post("/api/generate", { data: { ...valid, seed: 42 } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ status: "completed", type: "image", aspectRatio: "16:9", seed: 42, parentGenerationId: null });
    expect(body.images).toHaveLength(2);
    // Keyword-aware mock: a mountain prompt should surface the mountain still first.
    expect(body.images[0].sourceId).toBe("history-02");
  });

  test("is deterministic for the same prompt and seed", async ({ request }) => {
    const a = await (await request.post("/api/generate", { data: { ...valid, seed: 7 } })).json();
    const b = await (await request.post("/api/generate", { data: { ...valid, seed: 7 } })).json();
    expect(a.images.map((i) => i.sourceId)).toEqual(b.images.map((i) => i.sourceId));
  });

  test("rejects invalid input with field errors", async ({ request }) => {
    const res = await request.post("/api/generate", { data: { prompt: "x", model: "nope", aspectRatio: "5:1", count: 9 } });
    expect(res.status()).toBe(422);
    const { error } = await res.json();
    expect(Object.keys(error.fields)).toEqual(expect.arrayContaining(["prompt", "model", "aspectRatio", "count"]));
  });

  test("rejects malformed JSON", async ({ request }) => {
    const res = await request.post("/api/generate", { headers: { "content-type": "application/json" }, data: Buffer.from("{not json") });
    expect(res.status()).toBe(400);
  });

  test("supports error and empty scenarios", async ({ request }) => {
    const failed = await request.post("/api/generate", { data: { ...valid, scenario: "error" } });
    expect(failed.status()).toBe(503);
    expect((await failed.json()).error.retryable).toBe(true);

    const empty = await (await request.post("/api/generate", { data: { ...valid, scenario: "empty" } })).json();
    expect(empty.images).toEqual([]);
  });
});
