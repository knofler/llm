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

test("adults: the map learns two letters back and beats the tally, names unlock last", async ({ page }, info) => {
  await fresh(page, "adults");
  await page.goto("/learn/4");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Give every letter a spot on a map");
  for (const word of ["embedding", "MLP"]) await expect(page.locator("main")).not.toContainText(word);

  // After "a" the next letter could be b, c or d, so the one-back tally is
  // unsure. Two letters back it is always the same, so the map can do better.
  await page.getByLabel("text to learn from").fill("abacadabacadabacadabacad");
  const start = await num(page, "a-score");
  const tally = await num(page, "a-tally");
  expect(start).toBeGreaterThan(tally);
  await expect(page.getByTestId("a-size")).toContainText("4³ = 64");

  await page.getByRole("button", { name: "Train 50" }).click();
  await expect(page.getByTestId("a-steps")).toHaveText("50 handfuls so far");
  expect(await num(page, "a-score")).toBeLessThan(tally);

  await page.getByRole("button", { name: "Letter c" }).click();
  await expect(page.getByTestId("a-near")).toContainText("nearest to “c”");
  await page.getByRole("button", { name: "Write 60 letters" }).click();
  await expect(page.getByTestId("a-write")).toHaveText(/^[abcd]{62}$/);

  await page.getByRole("button", { name: "Start over" }).click();
  await expect(page.getByTestId("a-steps")).toHaveText("0 handfuls so far");
  expect(await num(page, "a-score")).toBe(start);
  await noSideScroll(page);
  await page.screenshot({ path: info.outputPath("adults.png"), fullPage: true });

  await page.getByRole("button", { name: "I rebuilt it, unlock the names" }).click();
  await expect(page.getByTestId("a-word")).toHaveText("embedding · MLP · batch");

  await page.goto("/words");
  await expect(page.getByTestId("words-list")).toContainText("embedding");
  await expect(page.getByTestId("words-list")).toContainText("MLP");
});

test("kids: Pip tidies the letter map, the puzzle earns the sticker", async ({ page }, info) => {
  await fresh(page, "kids");
  await page.goto("/learn/4");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The letter map");
  await expect(page.locator("main")).not.toContainText("embedding");

  // Each tidy halves the mess: 1, 0.5, 0.25, 0.13, 0.06, 0.03, so five tidies finish it.
  await expect(page.getByTestId("k-feel")).toHaveText("Messy!");
  await page.getByRole("button", { name: "Tidy up!" }).click();
  await expect(page.getByTestId("k-feel")).toHaveText("Getting tidy");
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Tidy up!" }).click();
  await expect(page.getByTestId("k-feel")).toHaveText("All tidy!");
  await expect(page.getByRole("button", { name: "Tidy up!" })).toBeDisabled();
  await page.getByRole("button", { name: "Mess it up" }).click();
  await expect(page.getByTestId("k-feel")).toHaveText("Messy!");
  await noSideScroll(page);
  await page.screenshot({ path: info.outputPath("kids.png"), fullPage: true });

  await page.getByLabel("I think:").fill("e");
  await expect(page.getByTestId("k-sticker")).toContainText("You tidied the letter map!");
});

test("home lists stage 4 as open", async ({ page }) => {
  await fresh(page, "adults");
  await page.goto("/");
  await page.getByRole("link", { name: /Stage 4/ }).click();
  await expect(page).toHaveURL(/\/learn\/4$/);
});
