import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const ROOT = "/workspace/.grok";
const html = readFileSync(`${ROOT}/og-card.html`);

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2,
  });

  await page.route("http://og.local/**", async (route) => {
    const url = route.request().url();
    if (url.endsWith("/NotoSerifTC.ttf")) {
      return route.fulfill({
        path: `${ROOT}/fonts/NotoSerifTC-wght.ttf`,
        contentType: "font/ttf",
      });
    }
    if (url.endsWith("/NotoSansTC.ttf")) {
      return route.fulfill({
        path: `${ROOT}/fonts/NotoSansTC-wght.ttf`,
        contentType: "font/ttf",
      });
    }
    if (url.endsWith("/og-bg.jpg")) {
      return route.fulfill({
        path: `${ROOT}/og-bg.jpg`,
        contentType: "image/jpeg",
      });
    }
    if (url.endsWith("/card.html") || url === "http://og.local/") {
      return route.fulfill({ body: html, contentType: "text/html; charset=utf-8" });
    }
    return route.abort();
  });

  await page.goto("http://og.local/card.html", { waitUntil: "networkidle", timeout: 15000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(200);
  await page.screenshot({
    path: `${ROOT}/og-overlay.png`,
    type: "png",
    omitBackground: false,
  });
  const fonts = await page.evaluate(() =>
    [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`),
  );
  console.log(JSON.stringify({ ok: true, fonts }, null, 2));
} finally {
  await browser.close();
}
