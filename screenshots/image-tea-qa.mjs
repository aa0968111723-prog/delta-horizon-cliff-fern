import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
const issues = [];
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));

await page.goto(`${base}/image`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="image-ready"]', { timeout: 45_000 });
await page.waitForSelector('[data-testid="found-sources"]', { timeout: 15_000 });
const found = (await page.locator('[data-testid="found-sources"]').innerText()) ?? "";
if (!/Google Drive/.test(found) || !/茶會/.test(found)) {
  issues.push(`Image Studio 沒搜到茶會素材: ${found.slice(0, 220)}`);
}
if (!/已參考/.test(found)) issues.push("Image Studio 沒有自動參考找到的素材");
await page.waitForSelector('[data-testid="direction-look-a"]', { timeout: 15_000 });
const lookHasPhoto = await page.locator('[data-testid="direction-look-a"]').evaluate((el) => {
  const src = el.getAttribute("src") || "";
  try {
    return /data-source-photo/.test(decodeURIComponent(escape(atob(src.split(",")[1] || ""))));
  } catch {
    return false;
  }
});
if (!lookHasPhoto) issues.push("方向 A 沒有延續找到的照片");
const lookSrcs = await page.locator('[data-testid="direction-list"] img').evaluateAll((els) =>
  els.map((el) => el.getAttribute("src") || ""),
);
if (new Set(lookSrcs.filter(Boolean)).size < 3) issues.push(`A/B/C 看起來一樣: ${lookSrcs.length}`);
const heroSource = (await page.locator('[data-testid="hero-visual-source"]').innerText()) ?? "";
if (!/Google Drive|Canva|Instagram/.test(heroSource)) {
  issues.push(`主視覺還是空白海報: ${heroSource}`);
}
const headlines = (await page.locator('[data-testid="direction-headline"]').allInnerTexts()).join("\n");
if (/誠摯邀請|寺廟|佛像/.test(headlines)) {
  issues.push(`方向 Hook 出現宗教語氣: ${headlines}`);
}
await page.locator('[data-testid="direction-look-a"]').screenshot({ path: "/workspace/screenshots/image-tea-look-a.png" });
await page.screenshot({ path: "/workspace/screenshots/image-tea.png", fullPage: true });

await page.locator('[data-testid="image-into-create"]').click();
await page.waitForSelector('[data-testid="found-sources"]', { timeout: 25_000 });
const createFound = (await page.locator('[data-testid="found-sources"]').innerText()) ?? "";
if (!/茶會/.test(createFound)) issues.push(`做成完整宣傳沒帶到茶會素材: ${createFound.slice(0, 180)}`);
const eventName = (await page.locator('[data-testid="event-name"]').inputValue()) ?? "";
if (eventName !== "茶會") issues.push(`做成完整宣傳活動名不是茶會: ${eventName}`);
await page.screenshot({ path: "/workspace/screenshots/image-into-create.png", fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/image`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="image-ready"]', { timeout: 45_000 });
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
);
if (overflow) issues.push("390/image overflow");
await page.screenshot({ path: "/workspace/screenshots/image-tea-390.png" });

if (errors.length) issues.push(`pageerror ${errors.join(" | ")}`);
await browser.close();
if (issues.length) {
  console.error(JSON.stringify({ ok: false, issues, found: found.slice(0, 200), heroSource }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, heroSource, found: found.slice(0, 160) }));
