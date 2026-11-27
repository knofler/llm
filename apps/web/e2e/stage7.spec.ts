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

test("adults: train, pack at 32/8/4 bits, open the file and run it, names unlock last", async ({ page }, info) => {
  await fresh(page, "adults");
  await page.goto("/learn/7");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pack your model into a file");
  for (const w of ["safetensors", "GGUF", "inference"]) await expect(page.locator("main")).not.toContainText(w);

  await page.getByRole("button", { name: "Train 50" }).click();
  await expect(page.getByTestId("a-steps")).toHaveText("50 handfuls so far");
  const score = await num(page, "a-score");
  await expect(page.getByTestId("a-tables")).toContainText("block2.mix");
  await expect(page.getByTestId("a-header")).toContainText("__metadata__");
  const saved = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save the file" }).click();
  expect((await saved).suggestedFilename()).toBe("my-model.bin");

  const size: Record<string, number> = {};
  for (const b of ["32", "8", "4"]) {
    await page.getByRole("button", { name: `${b} bits` }).click();
    await expect(page.getByRole("button", { name: `${b} bits` })).toHaveAttribute("aria-pressed", "true");
    size[b] = await num(page, "a-size");
    const squashed = Number((await page.getByTestId("a-squashed").textContent())!.match(/: (\d+\.\d+)/)![1]);
    expect(Math.abs(squashed - score)).toBeLessThan(b === "32" ? 0.011 : 1);
  }
  expect(size["8"]).toBeLessThan(size["32"]);
  expect(size["4"]).toBeLessThan(size["8"]);

  await expect(page.getByRole("button", { name: "Write 80 letters" })).toBeDisabled();
  await page.getByRole("button", { name: "32 bits" }).click();
  await page.getByRole("button", { name: "Open the file you just packed" }).click();
  await expect(page.getByTestId("a-opened")).toContainText("2 blocks");
  await expect(page.getByTestId("a-opened")).toContainText("32-bit");
  await page.getByRole("button", { name: "Write 80 letters" }).click();
  await expect(page.getByTestId("a-write")).toHaveText(/^[pisawctdog. ]{82}$/);

  await page.getByLabel("or open a saved file from your computer").setInputFiles({ name: "junk.bin", mimeType: "application/octet-stream", buffer: Buffer.from("hello there, not a model") });
  await expect(page.getByTestId("a-opened")).toHaveText("That isn't a take-home file.");
  await expect(page.getByRole("button", { name: "Write 80 letters" })).toBeDisabled();
  await noSideScroll(page);
  await page.screenshot({ path: info.outputPath("adults.png"), fullPage: true });

  await page.getByRole("button", { name: "I said it back, unlock the names" }).click();
  await expect(page.getByTestId("a-word")).toHaveText("weights · safetensors · GGUF · inference");

  await page.goto("/words");
  await expect(page.getByTestId("words-list")).toContainText("safetensors");
  await expect(page.getByTestId("words-list")).toContainText("inference");
});

test("kids: pack the robot in a box, open it at home, the tiny-box puzzle earns the sticker", async ({ page }, info) => {
  await fresh(page, "kids");
  await page.goto("/learn/7");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Take your robot home");
  await expect(page.locator("main")).not.toContainText("weights");

  const says = page.getByTestId("k-says");
  await expect(says).toContainText("still closed");
  await page.getByRole("button", { name: "Open the box at home" }).click();
  await expect(says).toHaveText("the cat sat on the mat. the dog ran to the sun.");
  await page.getByRole("button", { name: "Tiny box" }).click();
  await expect(page.getByTestId("k-ride")).toHaveText("It fits in your pocket.");
  await expect(says).toContainText("still closed");
  await page.getByRole("button", { name: "Open the box at home" }).click();
  await expect(says).toContainText("ran ta the sun");
  await expect(page.getByTestId("k-feel")).toContainText("It still talks!");
  await noSideScroll(page);
  await page.screenshot({ path: info.outputPath("kids.png"), fullPage: true });

  await page.getByLabel("I think:").fill("no");
  await expect(page.getByTestId("k-sticker")).toBeEmpty();
  await page.getByLabel("I think:").fill("yes");
  await expect(page.getByTestId("k-sticker")).toContainText("Grown-ups call the numbers in the box weights.");
});

test("home lists stage 7 as open", async ({ page }) => {
  await fresh(page, "adults");
  await page.goto("/");
  await page.getByRole("link", { name: /Stage 7/ }).click();
  await expect(page).toHaveURL(/\/learn\/7$/);
});
