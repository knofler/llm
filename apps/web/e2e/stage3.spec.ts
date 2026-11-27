import { expect, test, type Page } from "@playwright/test";

async function fresh(page: Page, track: "adults" | "kids") {
  await page.goto("/");
  await page.evaluate(async (t) => {
    localStorage.setItem("llm-track", t);
    await new Promise((r) => {
      const req = indexedDB.deleteDatabase("llm-wordbook");
      req.onsuccess = req.onerror = req.onblocked = r;
    });
  }, track);
}

async function noSideScroll(page: Page) {
  const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(scroll).toBeLessThanOrEqual(inner);
}

const score = async (page: Page) => Number(await page.getByTestId("a-score").textContent());

test("adults: the score starts even, nudges push it down to the tally, names unlock last", async ({ page }, info) => {
  await fresh(page, "adults");
  await page.goto("/learn/3");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Score how wrong it is");
  for (const word of ["gradient", "backprop"]) await expect(page.locator("main")).not.toContainText(word);

  // "abab": two letters, so a blank model gives each 50% and scores ln 2 ≈ 0.69.
  // The tally is sure (a→b, b→a every time), so the lowest possible score is 0.
  await page.getByLabel("text to learn from").fill("abab");
  await expect(page.getByTestId("a-score")).toHaveText("0.69");
  await expect(page.getByTestId("a-floor")).toContainText("0.00");
  await expect(page.getByTestId("a-row")).toContainText("50%");

  await page.getByRole("button", { name: "Nudge once" }).click();
  await expect(page.getByTestId("a-nudges")).toHaveText("1 nudges so far");
  const once = await score(page);
  expect(once).toBeLessThan(0.69);

  await page.getByRole("button", { name: "Nudge 25" }).click();
  await expect(page.getByTestId("a-nudges")).toHaveText("26 nudges so far");
  expect(await score(page)).toBeLessThan(once);
  await expect(page.getByTestId("a-row")).toContainText("100%");

  await page.getByRole("button", { name: "Start over" }).click();
  await expect(page.getByTestId("a-score")).toHaveText("0.69");
  await noSideScroll(page);
  await page.screenshot({ path: info.outputPath("adults.png"), fullPage: true });

  await page.getByRole("button", { name: "I rebuilt it, unlock the names" }).click();
  await expect(page.getByTestId("a-word")).toHaveText("loss · gradient · gradient descent · backprop");

  await page.goto("/words");
  await expect(page.getByTestId("words-list")).toContainText("gradient descent");
  await expect(page.getByTestId("words-list")).toContainText("backprop");
});

test("kids: Pip steps toward the treasure, the puzzle earns the sticker", async ({ page }, info) => {
  await fresh(page, "kids");
  await page.goto("/learn/3");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The hot-and-cold game");
  await expect(page.locator("main")).not.toContainText("gradient");

  // Pip starts at 10, the treasure at 70: 60 away is freezing. Each good step
  // leaves 0.4 of the gap: 24, 9.6, 3.8, 1.5, 0.6, so five steps find it.
  await expect(page.getByTestId("k-feel")).toHaveText("Freezing!");
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Good step" }).click();
  await expect(page.getByTestId("k-feel")).toHaveText("Found it!");
  await expect(page.getByRole("button", { name: "Good step" })).toBeDisabled();
  await page.getByRole("button", { name: "Start again" }).click();
  await expect(page.getByTestId("k-feel")).toHaveText("Freezing!");
  await noSideScroll(page);
  await page.screenshot({ path: info.outputPath("kids.png"), fullPage: true });

  await page.getByLabel("I think:").fill("right");
  await expect(page.getByTestId("k-sticker")).toContainText("You played the hot-and-cold game!");
});

test("home lists stage 3 as open", async ({ page }) => {
  await fresh(page, "adults");
  await page.goto("/");
  await page.getByRole("link", { name: /Stage 3/ }).click();
  await expect(page).toHaveURL(/\/learn\/3$/);
});
