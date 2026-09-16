import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
const issues = [];
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));

await page.goto(`${base}/image`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="vision-action-story"]', { timeout: 40_000 });
await page.locator('[data-testid="vision-action-story"]').click();
await page.waitForURL(/\/create/, { timeout: 15_000 });
await page.waitForSelector('[data-testid="kit-ready"], [data-testid="story-board"]', { timeout: 60_000 });
await page.waitForSelector('[data-testid="kit-piece"]', { timeout: 20_000 });

await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="home-ready"]', { timeout: 20_000 });
const recommendBefore = ((await page.locator('[data-testid="home-recommend-name"]').innerText()) ?? "").trim();
if (/限動|Carousel/.test(recommendBefore)) {
  issues.push(`今天推薦被限動篇偷走: ${recommendBefore}`);
}
await page.waitForSelector('[data-testid="home-due"]', { timeout: 10_000 });
const dueLabel = ((await page.locator('[data-testid="home-due"]').innerText()) ?? "").trim();
if (!/現在可以發/.test(dueLabel)) issues.push(`home-due 不是現在可以發: ${dueLabel}`);

await page.locator('[data-testid="home-due"]').click();
await page.waitForSelector('[data-testid="home-awaiting-feel"]', { timeout: 40_000 });
if (page.url().includes("/calendar") || page.url().includes("/ig")) {
  issues.push(`發布後離開了首頁: ${page.url()}`);
}
await page.waitForSelector('[data-testid="home-ready"]', { timeout: 5_000 });
const feel = ((await page.locator('[data-testid="home-awaiting-feel"]').innerText()) ?? "").trim();
if (!/剛發布|學生會停/.test(feel)) issues.push(`剛發布區塊不像學習: ${feel.slice(0, 160)}`);
if (await page.locator('[data-testid="home-due"]').count()) {
  issues.push("發布後還掛著現在可以發");
}

await page.locator('[data-testid="home-awaiting-feel"]').scrollIntoViewIfNeeded();
await page.screenshot({ path: "/workspace/screenshots/home-publish-story-feel.png" });

await page.locator('[data-testid="home-rate-strong"]').click();
await page.waitForSelector('[data-testid="home-learned"]', { timeout: 10_000 });
if (await page.locator('[data-testid="home-awaiting-feel"]').count()) {
  issues.push("標記學生會停後還停在剛發布");
}
await page.waitForSelector('[data-testid="home-extend-hook"]', { timeout: 10_000 });
const recommend = ((await page.locator('[data-testid="home-recommend-name"]').innerText()) ?? "").trim();
if (/限動|Carousel/.test(recommend)) {
  issues.push(`學習後今天推薦被限動篇偷走: ${recommend}`);
}
if (!/浮游禪光|茶會/.test(recommend)) {
  issues.push(`今天推薦不是活動: ${recommend}`);
}

await page.locator('[data-testid="home-learned"]').scrollIntoViewIfNeeded();
await page.screenshot({ path: "/workspace/screenshots/home-publish-story-learned.png" });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="home-ready"]', { timeout: 20_000 });
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
);
if (overflow) issues.push("390/home overflow after publish+learn");
await page.screenshot({ path: "/workspace/screenshots/home-publish-story-390.png", fullPage: true });

if (errors.length) issues.push(`pageerror ${errors.join(" | ")}`);
await browser.close();
if (issues.length) {
  console.error(JSON.stringify({ ok: false, issues, recommendBefore, recommend, feel: feel.slice(0, 180) }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, recommendBefore, recommend, feel: feel.slice(0, 160) }));
