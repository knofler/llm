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

test("adults: stack blocks, train below the tally, let it write, names unlock last", async ({ page }, info) => {
  await fresh(page, "adults");
  await page.goto("/learn/6");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Stack the blocks");
  await expect(page.locator("main")).not.toContainText("GPT");
  await expect(page.getByTestId("a-block")).toHaveCount(2);

  const start = await num(page, "a-score");
  const tally = await num(page, "a-tally");
  expect(start).toBeGreaterThan(tally);
  const count = (await page.getByTestId("a-count").textContent())!;

  await page.getByRole("button", { name: "3", exact: true }).click();
  await expect(page.getByTestId("a-block")).toHaveCount(3);
  expect(await page.getByTestId("a-count").textContent()).not.toBe(count);
  await page.getByRole("button", { name: "2", exact: true }).click();
  await expect(page.getByTestId("a-block")).toHaveCount(2);

  await page.getByRole("button", { name: "Train 50" }).click();
  await expect(page.getByTestId("a-steps")).toHaveText("50 handfuls so far");
  expect(await num(page, "a-score")).toBeLessThan(start);
  await page.getByRole("button", { name: "Train 50" }).click();
  await expect(page.getByTestId("a-steps")).toHaveText("100 handfuls so far");
  expect(await num(page, "a-score")).toBeLessThan(tally);
  await expect(page.getByTestId("a-guess")).toContainText("it guesses");

  await page.getByLabel("boldness").fill("0.5");
  await page.getByRole("button", { name: "Write 80 letters" }).click();
  await expect(page.getByTestId("a-write")).toHaveText(/^[pisawctdog. ]{82}$/);

  await page.getByRole("button", { name: "Start over" }).click();
  await expect(page.getByTestId("a-steps")).toHaveText("0 handfuls so far");
  expect(await num(page, "a-score")).toBe(start);
  await noSideScroll(page);
  await page.screenshot({ path: info.outputPath("adults.png"), fullPage: true });

  await page.getByRole("button", { name: "I drew it, unlock the names" }).click();
  await expect(page.getByTestId("a-word")).toHaveText("GPT · training · parameters · temperature");

  await page.goto("/words");
  await expect(page.getByTestId("words-list")).toContainText("GPT");
  await expect(page.getByTestId("words-list")).toContainText("temperature");
});

test("kids: stack brain layers until the robot talks, the dial puzzle earns the sticker", async ({ page }, info) => {
  await fresh(page, "kids");
  await page.goto("/learn/6");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your talking robot");
  await expect(page.locator("main")).not.toContainText("GPT");

  const says = page.getByTestId("k-says");
  await expect(says).toHaveText("blorp zzk qa… vvv?");
  await expect(page.getByRole("button", { name: "Take one off" })).toBeDisabled();
  const add = page.getByRole("button", { name: "Add a layer" });
  await add.click();
  await expect(says).toHaveText("pip sa a cot. pip pip.");
  await add.click();
  await add.click();
  await expect(says).toHaveText("Pip saw a cat and a dog in the sun!");
  await expect(add).toBeDisabled();
  await expect(page.getByTestId("k-layers").getByRole("listitem")).toHaveCount(4);

  await page.getByRole("button", { name: "Calm" }).click();
  await expect(says).toHaveText("Pip saw a cat. Pip saw a cat. Pip saw a cat.");
  await page.getByRole("button", { name: "Silly" }).click();
  await expect(says).toContainText("moon");
  await page.getByRole("button", { name: "Take one off" }).click();
  await expect(page.getByRole("button", { name: "Silly" })).toHaveCount(0);
  await noSideScroll(page);
  await page.screenshot({ path: info.outputPath("kids.png"), fullPage: true });

  await page.getByLabel("I think:").fill("calm");
  await expect(page.getByTestId("k-sticker")).toBeEmpty();
  await page.getByLabel("I think:").fill("silly");
  await expect(page.getByTestId("k-sticker")).toContainText("Grown-ups call a robot like this a GPT.");
});

test("home lists stage 6 as open", async ({ page }) => {
  await fresh(page, "adults");
  await page.goto("/");
  await page.getByRole("link", { name: /Stage 6/ }).click();
  await expect(page).toHaveURL(/\/learn\/6$/);
});
