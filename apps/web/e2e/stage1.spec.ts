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

test("adults: the book round-trips and the name unlocks last", async ({ page }, info) => {
  await fresh(page, "adults");
  await page.goto("/learn/1");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("give every letter a number");
  await expect(page.locator("main")).not.toContainText("tokenizer");

  const input = page.getByLabel("your text");
  await input.fill("abba cab");
  await expect(page.getByTestId("a-book").locator("> div")).toHaveCount(4); // space a b c
  await expect(page.getByTestId("a-numbers")).toHaveText("1 2 2 1 0 3 1 2");
  await expect(page.getByTestId("a-check")).toHaveText("identical, nothing lost");
  await noSideScroll(page);
  await page.screenshot({ path: info.outputPath("adults.png"), fullPage: true });

  await page.getByRole("button", { name: "I rebuilt it, unlock the name" }).click();
  await expect(page.getByTestId("a-word")).toHaveText("tokenizer");

  await page.goto("/words");
  await expect(page.getByTestId("words-list")).toContainText("tokenizer");
  await expect(page.getByTestId("words-list")).toContainText("vocabulary");
});

test("kids: cards flip, the puzzle earns the sticker", async ({ page }, info) => {
  await fresh(page, "kids");
  await page.goto("/learn/1");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pip's secret number code");
  await expect(page.locator("main")).not.toContainText("tokenizer");

  await page.getByLabel("Type your name:").fill("Bob");
  const cards = page.getByTestId("k-cards").getByRole("button");
  await expect(cards).toHaveCount(3);
  await cards.first().click();
  await expect(cards.first()).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("k-pairs")).toContainText("B→ 2");
  await noSideScroll(page);
  await page.screenshot({ path: info.outputPath("kids.png"), fullPage: true });

  await page.getByLabel("I think it says:").fill("hi pip");
  await expect(page.getByTestId("k-sticker")).toContainText("You made a code book!");
});

test("track switch is remembered", async ({ page }) => {
  await fresh(page, "adults");
  await page.goto("/");
  await page.getByRole("button", { name: "kids" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Teach Pip the robot to talk");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Teach Pip the robot to talk");
  await noSideScroll(page);
});
