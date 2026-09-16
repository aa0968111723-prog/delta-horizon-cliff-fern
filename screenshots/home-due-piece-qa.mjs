import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
const issues = [];
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));

await page.goto(`${base}/create?mode=idea&idea=${encodeURIComponent("下週有一場茶會")}`, {
  waitUntil: "networkidle",
});
await page.waitForSelector('[data-testid="realize-direction"]', { timeout: 45_000 });
await page.locator('[data-testid="realize-direction"]').click();
await page.waitForSelector('[data-testid="kit-ready"]', { timeout: 60_000 });
await page.locator('[data-testid="publish-hero"]').click();
await page.waitForSelector('[data-testid="ig-ready"]', { timeout: 40_000 });

await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="home-ready"]', { timeout: 20_000 });
await page.waitForSelector('[data-testid="home-rate-strong"]', { timeout: 10_000 });
await page.locator('[data-testid="home-rate-strong"]').click();
await page.waitForSelector('[data-testid="home-extend-hook"]', { timeout: 10_000 });
await page.locator('[data-testid="home-extend-hook"]').click();
await page.waitForSelector('[data-testid="realize-direction"]', { timeout: 45_000 });
await page.locator('[data-testid="realize-direction"]').click();
await page.waitForSelector('[data-testid="kit-piece"]', { timeout: 60_000 });

await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="home-recommend-name"]', { timeout: 20_000 });
const recName = (await page.locator('[data-testid="home-recommend-name"]').innerText()) ?? "";
if (!/茶會/.test(recName)) issues.push(`今天推薦 lost 茶會: ${recName}`);
if (/可以自己來/.test(recName)) issues.push(`今天推薦 became the piece: ${recName}`);

await page.waitForSelector('[data-testid="home-scheduled"]', { timeout: 10_000 });
const scheduled = (await page.locator('[data-testid="home-scheduled"]').innerText()) ?? "";
if (!/可以自己來/.test(scheduled)) issues.push(`已排程 missing the new piece: ${scheduled.slice(0, 200)}`);
if (!/現在可以發/.test(scheduled)) issues.push("已排程 missing 現在可以發 for the due piece");

await page.waitForSelector('[data-testid="home-due"]', { timeout: 10_000 });
await page.locator('[data-testid="home-due"]').click();
await page.waitForSelector('[data-testid="home-awaiting-feel"]', { timeout: 40_000 });
if (page.url().includes("/calendar") || page.url().includes("/ig")) {
  issues.push(`發布後離開了首頁: ${page.url()}`);
}
const feel = (await page.locator('[data-testid="home-awaiting-feel"]').innerText()) ?? "";
if (!/剛發布|學生會停/.test(feel)) issues.push(`剛發布 missing after Home publish: ${feel.slice(0, 160)}`);
await page.locator('[data-testid="home-rate-strong"]').click();
await page.waitForSelector('[data-testid="home-extend-hook"]', { timeout: 10_000 });
const recAfter = (await page.locator('[data-testid="home-recommend-name"]').innerText()) ?? "";
if (!/茶會/.test(recAfter)) issues.push(`學習後今天推薦 lost 茶會: ${recAfter}`);
if (/可以自己來/.test(recAfter)) issues.push(`今天推薦 became the piece after learn: ${recAfter}`);
await page.screenshot({ path: "/workspace/screenshots/home-due-piece.png", fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="home-ready"]', { timeout: 20_000 });
const recMobile = (await page.locator('[data-testid="home-recommend-name"]').innerText()) ?? "";
if (!/茶會/.test(recMobile)) issues.push(`390 今天推薦 lost 茶會: ${recMobile}`);
if (await page.locator('[data-testid="home-extend-hook"]').count() === 0) {
  issues.push("390 學習後沒有用這個 Hook 再寫一篇");
}
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
);
if (overflow) issues.push("390/home overflow after Home publish");
await page.screenshot({ path: "/workspace/screenshots/home-due-piece-390.png", fullPage: true });

if (errors.length) issues.push(`pageerror ${errors.join(" | ")}`);
await browser.close();
if (issues.length) {
  console.error(JSON.stringify({ ok: false, issues, recName, scheduled: scheduled.slice(0, 200) }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, recName, scheduled: scheduled.slice(0, 180) }));
