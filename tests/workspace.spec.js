import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/workspace");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText("FW26 Campaign")).toBeVisible();
});

const card = (page, name) => page.getByRole("button", { name: new RegExp(`^${name}:`) });

async function openBranches(page) {
  // Below xl the tree lives in a drawer.
  if (await page.getByRole("tree").isHidden()) await page.getByRole("button", { name: "Branches" }).click();
}

test("opens a populated project on its active generation", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "G4", exact: true })).toBeVisible();
  await expect(page.getByText(/Subject\s+branch of/)).toBeVisible();
  await expect(card(page, "G4·1")).toBeVisible();
});

test("branching keeps the subject and explores light", async ({ page }) => {
  const target = card(page, "G4·2");
  await target.hover();
  await page.getByRole("button", { name: "Branch from G4·2", exact: true }).click();
  await page.getByRole("textbox", { name: /^Direction/ }).fill("colder");
  await page.getByRole("button", { name: /^Lighting/ }).click();

  await expect(page.getByText(/Branching\s+Lighting\s+from/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "G7", exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Lighting\s+branch of\s+G4·2/)).toBeVisible();
  // All four results reuse the parent's scene (desert) with a different grade.
  for (let i = 1; i <= 4; i++) await expect(card(page, `G7·${i}`)).toBeVisible();
  await expect(page.locator('#ws-canvas img[src*="desert-"]')).toHaveCount(5); // 4 results + parent thumbnail
});

test("tree shows lineage and navigates with the keyboard", async ({ page }) => {
  await openBranches(page);
  const tree = page.getByRole("tree");
  await expect(tree.getByRole("treeitem")).toHaveCount(6);
  await expect(tree.getByRole("treeitem", { name: /^G4 / })).toHaveAttribute("aria-selected", "true");

  await tree.getByRole("treeitem", { name: /^G4 / }).focus();
  await page.keyboard.press("ArrowLeft"); // collapse G4
  await expect(tree.getByRole("treeitem", { name: /^G4 / })).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("ArrowLeft"); // to parent G2
  await expect(tree.getByRole("treeitem", { name: /^G2 / })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "G2", exact: true })).toBeVisible();
});

test("compare spans branches and highlights differences", async ({ page }) => {
  await card(page, "G4·1").click();
  await page.getByRole("navigation", { name: "Lineage" }).getByRole("button", { name: "G2", exact: true }).click(); // lineage breadcrumb
  await card(page, "G2·3").click();
  await expect(page.getByRole("region", { name: "Selection" })).toContainText("2/4");

  await page.getByRole("button", { name: "Compare" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: /Compare/ })).toBeVisible();
  await expect(dialog.getByRole("region", { name: "G4·1" })).toBeVisible();
  await expect(dialog.getByRole("region", { name: "G2·3" })).toBeVisible();
  await expect(dialog.getByText("(differs)").first()).toBeAttached();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("remix through the composer shows a prompt diff", async ({ page }) => {
  await card(page, "G4·3").hover();
  await page.getByRole("button", { name: "Branch from G4·3", exact: true }).click();
  await page.getByRole("button", { name: /^Remix/ }).click();
  const prompt = page.getByRole("textbox", { name: "Prompt" });
  await expect(prompt).toBeFocused();
  await prompt.fill("Atlas FW26 hero: model in a waxed jacket in misty pines, close detail");
  await page.getByRole("button", { name: "Generate branch" }).click();

  await expect(page.getByRole("heading", { name: "G7", exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("ins").first()).toBeVisible();
  await expect(page.locator("del").first()).toBeAttached();
});

test("keep persists and appears in Kept assets", async ({ page, isMobile }) => {
  await card(page, "G4·1").hover();
  await page.getByRole("button", { name: "Keep G4·1" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Unkeep G4·1" })).toBeAttached();

  if (isMobile) {
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("button", { name: "Kept assets" }).click();
  } else {
    await page.getByRole("button", { name: "Kept assets" }).click();
  }
  await expect(page.getByRole("heading", { name: "Kept assets" })).toBeVisible();
  await expect(page.getByText("4 kept.")).toBeVisible();
});

test("failed generation keeps context and retries", async ({ page, isMobile }) => {
  if (isMobile) {
    await page.getByRole("button", { name: "Menu" }).click();
  } else {
    await page.getByRole("button", { name: "Settings" }).focus();
    await page.keyboard.press("Enter");
  }
  await page.getByText("Fail", { exact: true }).click();
  await page.keyboard.press("Escape");

  if (isMobile) await page.getByRole("button", { name: "New direction" }).click();
  await page.getByRole("textbox", { name: "Prompt" }).fill("Camel trench coat, studio product detail");
  await page.getByRole("button", { name: /^Generate$/ }).click();
  await expect(page.locator(".ws").getByRole("alert")).toContainText("Generation failed", { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "G4", exact: true })).toBeVisible(); // stayed on previous view

  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("heading", { name: "G7", exact: true })).toBeVisible({ timeout: 15_000 });
});

test("preview dialog opens, navigates and closes", async ({ page }) => {
  await card(page, "G4·1").hover();
  await page.getByRole("button", { name: "Open G4·1 preview" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "G4·1" })).toBeVisible();
  await dialog.getByRole("button", { name: "Next image" }).click();
  await expect(dialog.getByRole("heading", { name: "G4·2" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("no horizontal overflow", async ({ page }) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("empty submit is explained inline and clears on typing", async ({ page, isMobile }) => {
  if (isMobile) await page.getByRole("button", { name: "New direction" }).click();
  const prompt = page.getByRole("textbox", { name: "Prompt" });
  await page.getByRole("button", { name: /^Generate$/ }).click();
  await expect(prompt).toBeFocused();
  await expect(prompt).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator(".ws").getByRole("alert")).toContainText("Add a few words");
  await prompt.fill("Camel coat, rainy street");
  await expect(prompt).not.toHaveAttribute("aria-invalid");
  await expect(page.locator(".ws").getByRole("alert")).toHaveCount(0);
});
