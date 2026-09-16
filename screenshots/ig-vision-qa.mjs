import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
const issues = [];
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));

await page.goto(`${base}/ig`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="ig-ready"]', { timeout: 30_000 });
await page.waitForSelector('[data-testid="ig-memory-grid"]', { timeout: 20_000 });
await page.locator('[data-testid="ig-mem-ig_mem_tea"]').click();
await page.waitForSelector('[data-testid="ig-memory-visual"]', { timeout: 15_000 });
await page.locator('[data-testid="ig-analyze"]').click();
await page.waitForSelector('[data-testid="vision-too-ai"]', { timeout: 20_000 });
const teaTooAi = ((await page.locator('[data-testid="vision-too-ai"]').innerText()) ?? "").trim();
if (teaTooAi !== "還好") issues.push(`茶會現場被判太 AI: ${teaTooAi}`);
const teaLook = (await page.locator('[data-testid="vision-card"]').innerText()) ?? "";
if (!/現場|校園|空氣/.test(teaLook)) issues.push(`茶會分析沒看畫面: ${teaLook.slice(0, 180)}`);
const visualLesson = (await page.locator('[data-testid="ig-lesson-visual"]').innerText()) ?? "";
if (!/有時候|坐下來/.test(visualLesson) || !/收藏/.test(visualLesson)) {
  issues.push(`視覺課沒引用實際貼文: ${visualLesson.slice(0, 180)}`);
}
await page.screenshot({ path: "/workspace/screenshots/ig-vision-tea.png", fullPage: true });

await page.locator('[data-testid="ig-mem-ig_local_1"]').click();
await page.locator('[data-testid="ig-analyze"]').click();
await page.waitForFunction(() => {
  const el = document.querySelector('[data-testid="vision-too-ai"]');
  return el && el.textContent && el.textContent.trim() === "可能";
}, { timeout: 20_000 });
const orbTooAi = ((await page.locator('[data-testid="vision-too-ai"]').innerText()) ?? "").trim();
await page.screenshot({ path: "/workspace/screenshots/ig-vision-orbs.png", fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/ig`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="ig-memory-grid"]', { timeout: 20_000 });
await page.locator('[data-testid="ig-mem-ig_mem_tea"]').click();
await page.waitForSelector('[data-testid="ig-memory-visual"]', { timeout: 15_000 });
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
);
if (overflow) issues.push("390/ig overflow");
await page.screenshot({ path: "/workspace/screenshots/ig-vision-390.png" });

if (errors.length) issues.push(`pageerror ${errors.join(" | ")}`);
await browser.close();
if (issues.length) {
  console.error(JSON.stringify({ ok: false, issues, teaTooAi, orbTooAi }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, teaTooAi, orbTooAi }));
