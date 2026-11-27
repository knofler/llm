/**
 * Brain sheet on a phone — copy into the app's Playwright dir (e.g. e2e/ or tests/e2e/).
 * Not auto-copied by rollout_brain.sh, because not every app has Playwright.
 *
 * Guards the 2026-11-27 phone bug: the "Give it a brain" panel was an
 * `absolute top-full` popover that ran off the bottom (plank, inside a drawer)
 * or off the left edge (llm, connect) on a 390px phone.
 *
 * Adapt BRAIN_PAGE and openBrain() if the button sits behind a menu or drawer.
 */
import { expect, test, type Page } from "@playwright/test";

const BRAIN_PAGE = process.env.BRAIN_PAGE ?? "/learn/1";

async function openBrain(page: Page) {
  // If the app hides the button behind a menu on phones, open the menu first, e.g.:
  // await page.getByRole("button", { name: /menu/i }).click();
  await page.getByTestId("brain-button").first().click();
}

async function inViewport(page: Page, testId: string) {
  const box = await page.getByTestId(testId).boundingBox();
  const vp = page.viewportSize()!;
  expect(box, `${testId} has a box`).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width + 0.5);
  expect(box!.y + box!.height).toBeLessThanOrEqual(vp.height + 0.5);
}

for (const vp of [
  { name: "portrait", width: 390, height: 844 },
  { name: "landscape", width: 844, height: 390 },
]) {
  test.describe(`brain sheet — ${vp.name} ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, hasTouch: true });

    test("opens inside the viewport, Save is reachable, closing restores scroll", async ({ page }) => {
      await page.goto(BRAIN_PAGE);
      const before = await page.evaluate(() => document.body.style.overflow);
      await openBrain(page);

      await expect(page.getByTestId("brain-sheet")).toBeVisible();
      await inViewport(page, "brain-sheet");
      await expect(page.getByTestId("brain-scrim")).toBeVisible();

      const save = page.getByTestId("brain-save");
      await save.scrollIntoViewIfNeeded();
      await expect(save).toBeInViewport();
      await page.getByTestId("brain-key").fill("sk-test");
      await expect(save).toBeEnabled();

      await page.keyboard.press("Escape");
      await expect(page.getByTestId("brain-sheet")).toHaveCount(0);
      expect(await page.evaluate(() => document.body.style.overflow)).toBe(before);

      await openBrain(page);
      await page.getByTestId("brain-close").click();
      await expect(page.getByTestId("brain-sheet")).toHaveCount(0);
      expect(await page.evaluate(() => document.body.style.overflow)).toBe(before);
    });
  });
}
