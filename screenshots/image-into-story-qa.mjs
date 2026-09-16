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
await page.screenshot({ path: "/workspace/screenshots/image-vision-actions.png", fullPage: true });
await page.locator('[data-testid="vision-action-story"]').click();
await page.waitForURL(/\/create/, { timeout: 15_000 });
const url = page.url();
if (!/into=story/.test(url) && !/into%3Dstory/.test(url)) {
  issues.push(`做成限動沒帶上 into=story: ${url}`);
}
if (!/asset=|remote=/.test(url)) {
  issues.push(`做成限動沒帶上這張圖: ${url}`);
}
await page.waitForSelector('[data-testid="event-name"]', { timeout: 40_000 });
const eventName = (await page.locator('[data-testid="event-name"]').inputValue()) ?? "";
if (/畫面是現場|禪風海報/.test(eventName)) {
  issues.push(`活動名變成圖片理解全文: ${eventName}`);
}
if (eventName === "茶會" || eventName === "浮游禪光") {
  issues.push(`做成限動重開了整場活動: ${eventName}`);
}
if (eventName && !/限動/.test(eventName)) {
  issues.push(`做成限動的篇名不像一篇限動: ${eventName}`);
}
await page.waitForSelector('[data-testid="source-visual"], [data-testid="kit-visual-source"], [data-testid="hero-visual-source"]', {
  timeout: 20_000,
});
const source = ((await page.locator('[data-testid="source-visual-label"], [data-testid="kit-visual-source"], [data-testid="hero-visual-source"]').first().innerText()) ?? "");
if (source && !/Drive|Instagram|來源|茶會|淡水/.test(source)) {
  issues.push(`來源標示不像延續這張圖: ${source.slice(0, 120)}`);
}
await page.waitForSelector('[data-testid="kit-ready"], [data-testid="story-board"]', { timeout: 60_000 });
await page.waitForSelector('[data-testid="kit-piece"]', { timeout: 20_000 });
await page.waitForSelector('[data-testid="story-board"]', { timeout: 20_000 });
const kitName = ((await page.locator('[data-testid="kit-campaign-name"]').innerText()) ?? "");
if (/預熱|情緒共鳴|參加理由|倒數/.test(kitName)) {
  issues.push(`做成限動還是整場活動節奏: ${kitName}`);
}
if (!/一篇|限動/.test(kitName)) {
  issues.push(`kit 沒說這是一篇限動: ${kitName}`);
}
const sched = (await page.locator('[data-testid="event-schedule"]').inputValue()) ?? "";
if (/09\/23|09\/24/.test(sched)) {
  issues.push(`做成限動還在排活動日: ${sched}`);
}
await page.screenshot({ path: "/workspace/screenshots/image-into-story.png", fullPage: true });

await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="home-ready"]', { timeout: 20_000 });
const recommend = ((await page.locator('[data-testid="home-recommend-name"]').innerText()) ?? "").trim();
if (/限動|Carousel/.test(recommend)) {
  issues.push(`首頁今天推薦被限動篇偷走: ${recommend}`);
}
if (!/浮游禪光|茶會/.test(recommend)) {
  issues.push(`首頁今天推薦不是活動: ${recommend}`);
}
await page.waitForSelector('[data-testid="home-scheduled-title"]', { timeout: 10_000 });
const scheduledTitle = ((await page.locator('[data-testid="home-scheduled-title"]').first().innerText()) ?? "").trim();
if (!/Story|限動/.test(scheduledTitle)) {
  issues.push(`首頁已排程不是這則限動: ${scheduledTitle}`);
}
if (/預熱|參加理由/.test(scheduledTitle)) {
  issues.push(`首頁已排程還是活動節奏: ${scheduledTitle}`);
}
await page.screenshot({ path: "/workspace/screenshots/image-into-story-home.png" });

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="story-board"]', { timeout: 40_000 });
await page.setViewportSize({ width: 390, height: 844 });
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
);
if (overflow) issues.push("390/create-from-image overflow");
await page.screenshot({ path: "/workspace/screenshots/image-into-story-390.png" });

if (errors.length) issues.push(`pageerror ${errors.join(" | ")}`);
await browser.close();
if (issues.length) {
  console.error(JSON.stringify({ ok: false, issues, eventName, url, source: source.slice(0, 120), kitName, recommend, sched, scheduledTitle }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, eventName, kitName, recommend, scheduledTitle, sched, url: url.slice(0, 180) }));
