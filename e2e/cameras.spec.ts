import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * End-to-end against the real GraphQL server.
 *
 * The backend keeps state in memory for the life of the process, so each test
 * signs in as a different operator to stay independent of the others.
 */

async function signIn(page: Page, displayName: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in" }).waitFor();

  // Fluent's Dropdown is a button-backed combobox, not an <input>, so read its
  // label rather than its value. It defaults to the first operator; only
  // interact with it when a different one is wanted.
  const combobox = page.getByRole("combobox", { name: "Operator" });
  const current = (await combobox.textContent())?.trim();
  if (current !== displayName) {
    await combobox.click();
    await page.getByRole("option", { name: displayName }).click();
  }

  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "My cameras" })).toBeVisible();
}

const assignedCount = (page: Page) =>
  page
    .getByRole("heading", { name: "My cameras" })
    .locator("xpath=following-sibling::*[1]");

test.describe("Axis Camera Manager", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("signs in and shows only that operator's cameras", async ({ page }) => {
    await signIn(page, "Alice Lindqvist");

    await expect(page.getByText("Alice Lindqvist")).toBeVisible();
    await expect(assignedCount(page)).toHaveText("3");
    await expect(
      page.getByRole("button", { name: /View details for A8207-VE MKII/ }),
    ).toBeVisible();
  });

  test("shows the product photo on every camera card", async ({ page }) => {
    await signIn(page, "Alice Lindqvist");

    const images = page.locator("[data-thumb] img");
    await expect(images.first()).toBeVisible();

    // Every rendered image must have actually decoded, not just have a src.
    const broken = await images.evaluateAll(
      (nodes) =>
        nodes.filter((n) => !(n as HTMLImageElement).naturalWidth).length,
    );
    expect(broken).toBe(0);
  });

  test("adds a camera from the fleet and removes it again", async ({
    page,
  }) => {
    await signIn(page, "Alice Lindqvist");
    await expect(assignedCount(page)).toHaveText("3");

    await page.getByRole("button", { name: "Add camera" }).first().click();
    // Fluent mirrors toast text into an aria-live region, so two nodes match.
    await expect(page.getByText(/added to your cameras/).first()).toBeVisible();
    await expect(assignedCount(page)).toHaveText("4");

    await page.getByRole("button", { name: "Remove" }).last().click();
    await expect(
      page.getByText(/removed from your cameras/).first(),
    ).toBeVisible();
    await expect(assignedCount(page)).toHaveText("3");
  });

  test("keeps the session across a reload", async ({ page }) => {
    await signIn(page, "Alice Lindqvist");
    await page.reload();

    await expect(
      page.getByRole("heading", { name: "My cameras" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toHaveCount(0);
  });

  test("shows an empty state for an operator with no cameras", async ({
    page,
  }) => {
    await signIn(page, "Carol Ek");
    await expect(page.getByText("No cameras assigned")).toBeVisible();
  });

  test("filters the fleet and explains when nothing matches", async ({
    page,
  }) => {
    await signIn(page, "Bob Nyström");

    const search = page.getByRole("searchbox", {
      name: "Filter fleet cameras",
    });
    await search.fill("192.168.1.101");
    await expect(page.getByRole("button", { name: "Add camera" })).toHaveCount(
      1,
    );

    await search.fill("nothing-matches-this");
    await expect(page.getByText(/No cameras match/)).toBeVisible();
  });

  test("opens the detail drawer and lists who the camera is shared with", async ({
    page,
  }) => {
    await signIn(page, "Alice Lindqvist");

    await page
      .getByRole("button", { name: /View details for A8207-VE MKII/ })
      .click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toContainText("A8207-VE MKII");
    await expect(drawer).toContainText("192.168.1.101");
    await expect(drawer).toContainText("Alice Lindqvist");
    await expect(drawer).toContainText("You");

    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
  });

  test("switches to the dark theme and remembers it", async ({ page }) => {
    await signIn(page, "Alice Lindqvist");

    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(
      page.getByRole("button", { name: "Switch to light theme" }),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("button", { name: "Switch to light theme" }),
    ).toBeVisible();
  });

  test("has no critical accessibility violations", async ({ page }) => {
    await signIn(page, "Alice Lindqvist");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    // Print what failed rather than just a count, so CI output is actionable.
    expect(
      serious.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s)`),
    ).toEqual([]);
  });
});
