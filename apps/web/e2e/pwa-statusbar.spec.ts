import { expect, test, type Page } from "@playwright/test";

// The installed iPhone PWA (iOS 26) drew the top bar under the clock: with
// black-translucent the page ran under the status bar, and env(safe-area-inset-top)
// read 0, so the inset padding did nothing (operator screenshot 2026-11-27).
// The fix is statusBarStyle "default" + a per-track theme-color. These checks
// keep it from coming back, and simulate the 59px inset of an iPhone with a
// Dynamic Island through the --inset-top override (env() can't be faked).

const INSET = 59;
const THEME = { adults: "#0b0b0a", kids: "#fbf1df" } as const;
type Track = keyof typeof THEME;

async function setTrack(page: Page, track: Track) {
  await page.addInitScript((t) => localStorage.setItem("llm-track", t), track);
}

/**
 * Look like the installed home-screen app: display-mode standalone (as script
 * sees it) and navigator.standalone, which iOS sets for home-screen apps, plus
 * the simulated top inset. Chromium's CDP display-mode emulation is not
 * honoured by the Playwright build, so matchMedia is answered directly.
 */
async function standalone(page: Page, inset: number) {
  await page.addInitScript((px) => {
    const real = window.matchMedia.bind(window);
    window.matchMedia = (q: string) => {
      if (!/display-mode:\s*standalone/.test(q)) return real(q);
      const noop = () => {};
      return { matches: true, media: q, onchange: null, addListener: noop, removeListener: noop,
        addEventListener: noop, removeEventListener: noop, dispatchEvent: () => false } as unknown as MediaQueryList;
    };
    Object.defineProperty(navigator, "standalone", { value: true, configurable: true });
    // The init script runs before <html> exists; add the override once the head is parsed.
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = `:root { --inset-top: ${px}px; }`;
      document.head.appendChild(style);
    });
  }, inset);
}

async function open(page: Page, track: Track) {
  await page.goto("/");
  await expect(page.locator(`[data-track="${track}"]`)).toBeVisible();
  await expect(page.getByTestId("top-bar")).toBeVisible();
}

test.describe("PWA status bar", () => {
  // Uses a Chromium CDP call; the phone project is Chromium at a phone size.
  test.beforeEach(({ browserName }, info) => {
    test.skip(browserName !== "chromium" || info.project.name !== "phone", "phone (Chromium) only");
  });
  test.use({ viewport: { width: 390, height: 844 } });

  test("the home-screen app asks iOS to reserve the status bar (no black-translucent)", async ({ page }) => {
    await open(page, "adults");
    await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute("content", "default");
    await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"][content="black-translucent"]')).toHaveCount(0);
  });

  for (const track of ["adults", "kids"] as const) {
    test(`${track}: theme-color is the track's page colour`, async ({ page }) => {
      await setTrack(page, track);
      await open(page, track);
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", THEME[track]);
    });

    test(`${track}: standalone at 390x844 with a ${INSET}px top inset, the bar's first control sits below the inset`, async ({ page }) => {
      await setTrack(page, track);
      await standalone(page, INSET);
      await open(page, track);
      expect(await page.evaluate(() => matchMedia("(display-mode: standalone)").matches)).toBe(true);
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--inset-top").trim())).toBe(`${INSET}px`);

      const bar = page.getByTestId("top-bar");
      const first = bar.locator("a, button").first();
      const box = (await first.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(INSET);

      // And the page heading starts below the bar, not under it.
      const barBox = (await bar.boundingBox())!;
      const h1 = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
      expect(h1.y).toBeGreaterThanOrEqual(barBox.y + barBox.height - 1);
    });
  }
});

// Review screenshots, only when asked:  SHOTS_DIR=/app/shots npx playwright test pwa-statusbar
// 390x844 portrait + 844x390 landscape, browser + standalone, kids + adults.
test.describe("PWA status bar screenshots", () => {
  test.beforeEach(({ browserName }, info) => {
    test.skip(!process.env.SHOTS_DIR || browserName !== "chromium" || info.project.name !== "phone", "SHOTS_DIR unset");
  });

  const sizes = [
    { name: "portrait-390x844", viewport: { width: 390, height: 844 }, inset: INSET },
    // iOS hides the status bar in landscape, so the top inset is 0 there.
    { name: "landscape-844x390", viewport: { width: 844, height: 390 }, inset: 0 },
  ];
  for (const size of sizes) {
    for (const mode of ["browser", "standalone"] as const) {
      for (const track of ["kids", "adults"] as const) {
        test(`${track} ${mode} ${size.name}`, async ({ page }) => {
          await page.setViewportSize(size.viewport);
          await setTrack(page, track);
          if (mode === "standalone") await standalone(page, size.inset);
          await open(page, track);
          await page.waitForTimeout(400); // let the track colour transition finish
          await page.screenshot({ path: `${process.env.SHOTS_DIR}/${track}-${mode}-${size.name}.png` });
        });
      }
    }
  }
});
