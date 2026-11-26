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

test("adults: the tally counts pairs, the die writes, names unlock last", async ({ page }, info) => {
  await fresh(page, "adults");
  await page.goto("/learn/2");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Count what follows each letter");
  for (const word of ["bigram", "probability", "sampling"]) await expect(page.locator("main")).not.toContainText(word);

  // "abab": a→b twice, b→a once. Every row has one choice, so writing is fixed.
  await page.getByLabel("text to learn from").fill("abab");
  await expect(page.getByTestId("a-pairs")).toHaveText("3 neighbour pairs counted");
  await expect(page.getByTestId("a-row")).toContainText("2 · 100%");
  await page.getByRole("button", { name: "Write 40" }).click();
  await expect(page.getByTestId("a-out")).toHaveText("ab".repeat(20));
  await page.getByRole("button", { name: "Clear" }).click();
  await page.getByRole("button", { name: "Roll once" }).click();
  await expect(page.getByTestId("a-out")).toHaveText("ab");
  await expect(page.getByTestId("a-last")).toContainText("the die gave");
  await noSideScroll(page);
  await page.screenshot({ path: info.outputPath("adults.png"), fullPage: true });

  await page.getByRole("button", { name: "I rebuilt it, unlock the names" }).click();
  await expect(page.getByTestId("a-word")).toHaveText("bigram · probability · sampling");

  await page.goto("/words");
  await expect(page.getByTestId("words-list")).toContainText("bigram");
  await expect(page.getByTestId("words-list")).toContainText("sampling");
});

test("kids: the tally sheet ticks, the spinner talks, the puzzle earns the sticker", async ({ page }, info) => {
  await fresh(page, "kids");
  await page.goto("/learn/2");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What comes next?");
  await expect(page.locator("main")).not.toContainText("bigram");

  await page.getByLabel("Type a silly word:").fill("Nana");
  // N then A ||, A then N |
  await expect(page.getByTestId("k-tally").locator("li")).toHaveCount(2);
  await expect(page.getByTestId("k-tally")).toContainText("A||");
  await page.getByRole("button", { name: "Spin!" }).click();
  await expect(page.getByTestId("k-said")).toHaveText("NA");
  await noSideScroll(page);
  await page.screenshot({ path: info.outputPath("kids.png"), fullPage: true });

  await page.getByLabel("I think it's:").fill("a");
  await expect(page.getByTestId("k-sticker")).toContainText("You made a what-comes-next tally!");
});

test("home lists stage 2 as open", async ({ page }) => {
  await fresh(page, "adults");
  await page.goto("/");
  await page.getByRole("link", { name: /Stage 2/ }).click();
  await expect(page).toHaveURL(/\/learn\/2$/);
});
