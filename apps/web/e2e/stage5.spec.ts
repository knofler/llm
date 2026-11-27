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

const num = async (page: Page, id: string) => Number((await page.getByTestId(id).textContent())!.match(/\d+\.\d+/)![0]);

test("adults: letters learn whom to listen to and beat the tally, names unlock last", async ({ page }, info) => {
  await fresh(page, "adults");
  await page.goto("/learn/5");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("choose which earlier letters to listen to");
  for (const word of ["attention", "transformer"]) await expect(page.locator("main")).not.toContainText(word);

  const start = await num(page, "a-score");
  const tally = await num(page, "a-tally");
  expect(start).toBeGreaterThan(tally);
  await expect(page.getByTestId("a-listen")).toContainText("listens most to");

  await page.getByRole("button", { name: "Train 50" }).click();
  await expect(page.getByTestId("a-steps")).toHaveText("50 handfuls so far");
  expect(await num(page, "a-score")).toBeLessThan(start);
  await page.getByRole("button", { name: "Train 50" }).click();
  await expect(page.getByTestId("a-steps")).toHaveText("100 handfuls so far");
  expect(await num(page, "a-score")).toBeLessThan(tally);

  await page.getByLabel("letter doing the guessing").fill("30");
  await expect(page.getByTestId("a-listen")).toContainText("listens most to");
  await page.getByRole("button", { name: "Write 60 letters" }).click();
  await expect(page.getByTestId("a-write")).toHaveText(/^[pisawctdog. ]{62}$/);

  await page.getByRole("button", { name: "Start over" }).click();
  await expect(page.getByTestId("a-steps")).toHaveText("0 handfuls so far");
  expect(await num(page, "a-score")).toBe(start);
  await noSideScroll(page);
  await page.screenshot({ path: info.outputPath("adults.png"), fullPage: true });

  await page.getByRole("button", { name: "I rebuilt it, unlock the names" }).click();
  await expect(page.getByTestId("a-word")).toHaveText("attention · head · transformer");

  await page.goto("/words");
  await expect(page.getByTestId("words-list")).toContainText("attention");
  await expect(page.getByTestId("words-list")).toContainText("transformer");
});

test("kids: tap who each glowing word listens to, the puzzle earns the sticker", async ({ page }, info) => {
  await fresh(page, "kids");
  await page.goto("/learn/5");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Who's listening?");
  await expect(page.locator("main")).not.toContainText("attention");

  const word = (w: string) => page.getByRole("button", { name: w, exact: true });
  await expect(page.getByTestId("k-feel")).toContainText("Who is “it” listening to?");
  await word("ate").click();
  await expect(page.getByTestId("k-feel")).toHaveText("Hmm, not that one. Try again!");
  await word("dog").click();
  await expect(page.getByTestId("k-feel")).toHaveText("Yes! “it” listens to “dog”.");
  await page.getByRole("button", { name: "Next sentence" }).click();

  await word("apple").click();
  await expect(page.getByTestId("k-feel")).toHaveText("Yes! “red” listens to “apple”.");
  await page.getByRole("button", { name: "Next sentence" }).click();

  await word("cake").click();
  await page.getByRole("button", { name: "Finish!" }).click();
  await expect(page.getByTestId("k-feel")).toHaveText("All found!");
  await noSideScroll(page);
  await page.screenshot({ path: info.outputPath("kids.png"), fullPage: true });

  await page.getByLabel("I think:").fill("sun");
  await expect(page.getByTestId("k-sticker")).toContainText("You found who's listening!");
});

test("home lists stage 5 as open", async ({ page }) => {
  await fresh(page, "adults");
  await page.goto("/");
  await page.getByRole("link", { name: /Stage 5/ }).click();
  await expect(page).toHaveURL(/\/learn\/5$/);
});
