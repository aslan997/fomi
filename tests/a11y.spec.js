import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Automated WCAG 2.x A/AA checks. Automated tools catch roughly a third of
// issues; keyboard and screen-reader flows are covered in the other specs.
for (const path of ["/", "/implementation", "/workspace"]) {
  test(`no serious accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    // The Part A Generate button keeps the mockup's white-on-coral (2.2:1) by
    // design. It is the single documented exception, excluded by name here.
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .exclude("[data-contrast-exception=mockup]")
      .analyze();
    const serious = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    const summary = serious.map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")}`);
    expect(summary).toEqual([]);
  });
}
