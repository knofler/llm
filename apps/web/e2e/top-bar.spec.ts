import { expect, test, type Page } from "@playwright/test";

async function fresh(page: Page, track: "adults" | "kids") {
  await page.goto("/");
  await page.evaluate((t) => localStorage.setItem("llm-track", t), track);
}

/** The bar's top edge sits at the top of the screen and it is fully on screen. */
async function pinned(page: Page) {
  const bar = page.getByTestId("top-bar");
  await expect(bar).toBeInViewport({ ratio: 1 });
  const box = (await bar.boundingBox())!;
  expect(Math.abs(box.y)).toBeLessThan(1);
}

for (const track of ["adults", "kids"] as const) {
  test(`${track}: the top bar stays pinned after scrolling to the bottom, and its links work`, async ({ page }) => {
    await fresh(page, track);
    await page.goto("/learn/5");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Nothing starts hidden under the bar.
    const bar = (await page.getByTestId("top-bar").boundingBox())!;
    const h1 = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
    expect(h1.y).toBeGreaterThanOrEqual(bar.y + bar.height - 1);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
    await pinned(page);

    await page.getByTestId("top-bar").getByRole("link", { name: track === "kids" ? "My words" : "Word book" }).click();
    await expect(page).toHaveURL(/\/words$/);
    await pinned(page);
  });
}
