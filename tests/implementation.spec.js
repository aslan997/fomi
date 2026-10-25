import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/implementation");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

const prompt = (page) => page.getByRole("textbox", { name: "Prompt" });

test("generates results and shows them in the feed", async ({ page }) => {
  await prompt(page).fill("A green neon corridor at night");
  await page.getByRole("button", { name: "Generate" }).click();

  await expect(page.getByText("Generating…")).toBeVisible();
  const row = page.locator("article").filter({ hasText: "A green neon corridor at night" }).first();
  await expect(row.getByRole("button", { name: /^Open preview/ })).toHaveCount(4, { timeout: 15_000 });
  await expect(page.getByRole("status")).toContainText("4 images ready");
});

test("explains an empty submit instead of failing silently", async ({ page }) => {
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.locator(".studio").getByRole("alert")).toContainText("Describe what you want to create first");
  await expect(prompt(page)).toBeFocused();
});

test("keyboard: Ctrl+Enter generates", async ({ page }) => {
  await prompt(page).fill("Eiffel tower under a pink sky");
  await prompt(page).press("Control+Enter");
  await expect(page.getByText("Generating…")).toBeVisible();
});

test("failure shows an error with a working retry", async ({ page }) => {
  await page.getByRole("button", { name: "Support and demo controls" }).click();
  await page.getByText("Fail", { exact: true }).click();
  await page.keyboard.press("Escape");

  await prompt(page).fill("A cat holding a sign");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.locator(".studio").getByRole("alert")).toContainText("Generation failed", { timeout: 15_000 });

  await page.getByRole("button", { name: "Retry" }).click();
  const row = page.locator("article").filter({ hasText: "A cat holding a sign" }).first();
  await expect(row.getByRole("button", { name: /^Open preview/ }).first()).toBeVisible({ timeout: 15_000 });
});

test("preview dialog: open, navigate, save, close with Escape", async ({ page }) => {
  const first = page.getByRole("button", { name: /^Open preview/ }).first();
  await first.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: /details/ })).toBeVisible();

  const counter = dialog.getByText(/^\d+ \/ \d+/);
  const before = await counter.textContent();
  await dialog.getByRole("button", { name: "Next" }).click();
  await expect(counter).not.toHaveText(before);

  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Saved", exact: true })).toHaveAttribute("aria-pressed", "true");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("saved filter lists favourites and persists across reloads", async ({ page }) => {
  await page.getByRole("button", { name: /^Open preview/ }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Save", exact: true }).click();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Saved", exact: true }).last().click();
  await expect(page.getByText(/Showing\s+Saved/)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Open preview/ })).toHaveCount(1);

  await page.reload();
  await page.getByRole("button", { name: "Saved", exact: true }).last().click();
  await expect(page.getByRole("button", { name: /^Open preview/ })).toHaveCount(1);
});

test("history strip jumps to a generation; View All opens the gallery", async ({ page }) => {
  await page.getByRole("button", { name: /Show generation: Deep green pine forest/ }).click();
  await expect(page.locator("article").filter({ hasText: "Deep green pine forest" })).toBeInViewport();

  await page.getByRole("button", { name: /History\s*View All/ }).click();
  const gallery = page.getByRole("dialog", { name: "Gallery" });
  await expect(gallery).toBeVisible();
  await gallery.getByRole("button", { name: "Videos" }).click();
  await expect(gallery.getByRole("listitem")).toHaveCount(2);
});

test("video view filters the feed and switches composer mode", async ({ page }) => {
  await page.getByRole("button", { name: "Videos" }).last().click();
  await expect(page.getByText(/Showing\s+Videos/)).toBeVisible();
  await expect(page.getByRole("radio", { name: "video" })).toBeChecked();
});

test("theme toggle switches to dark and persists", async ({ page }) => {
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-studio-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-studio-theme", "dark");
});

test("download produces a file", async ({ page, isMobile }) => {
  test.skip(isMobile, "Download events are covered on desktop");
  await page.getByRole("button", { name: /^Open preview/ }).first().click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("dialog").getByRole("button", { name: "Download" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^fomi-.+\.(webp|webm)$/);
});

test("no horizontal overflow", async ({ page }) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
