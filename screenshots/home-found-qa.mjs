import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
const issues = [];
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));

await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="home-ready"]', { timeout: 30_000 });
await page.waitForSelector('[data-testid="home-found-sources"]', { timeout: 25_000 });
const found = (await page.locator('[data-testid="home-found-sources"]').innerText()) ?? "";
if (!/找到 \d+ 個相關素材/.test(found) || !/3 個方向/.test(found)) {
  issues.push(`首頁沒有顯示找到的社團素材: ${found.slice(0, 200)}`);
}
if (!/Google Drive|Canva|Instagram/.test((await page.locator('[data-testid="home-found-chip"]').first().innerText()) ?? "")) {
  issues.push("首頁素材沒標 Drive / Canva / IG 來源");
}
await page.screenshot({ path: "/workspace/screenshots/home-found-sources.png", fullPage: true });

await page.locator('[data-testid="home-found-chip"]').first().click();
await page.waitForSelector('[data-testid="event-name"]', { timeout: 25_000 });
const fromHome = (await page.locator('[data-testid="event-name"]').inputValue()) ?? "";
if (/2025 茶會現場|浮游禪光企劃/.test(fromHome)) {
  issues.push(`首頁加入創作把檔名當成活動名: ${fromHome}`);
}
if (!fromHome) issues.push("首頁加入創作沒有活動名");
await page.screenshot({ path: "/workspace/screenshots/home-found-into-create.png", fullPage: true });

await page.goto(`${base}/assets`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="assets-ready"]', { timeout: 20_000 });
await page.locator('[data-testid="assets-search"]').fill("找以前晚上的茶會照片");
await page.waitForSelector("text=2025 茶會現場", { timeout: 15_000 });
const note = (await page.locator('[data-testid="assets-found-note"]').innerText()) ?? "";
if (!/相關素材/.test(note)) issues.push(`素材庫沒有自然語言搜尋結果: ${note}`);
await page.screenshot({ path: "/workspace/screenshots/assets-nl-search.png", fullPage: true });
await page.locator('[data-testid="asset-remote-into-create"]', { hasText: "2025 茶會現場" }).click();
await page.waitForSelector('[data-testid="event-name"]', { timeout: 25_000 });
const fromAssets = (await page.locator('[data-testid="event-name"]').inputValue()) ?? "";
if (fromAssets !== "茶會") issues.push(`素材庫加入創作活動名不是茶會: ${fromAssets}`);
await page.screenshot({ path: "/workspace/screenshots/assets-into-create.png", fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="home-found-sources"]', { timeout: 25_000 });
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
);
if (overflow) issues.push("390/home overflow");
await page.screenshot({ path: "/workspace/screenshots/home-found-390.png" });

if (errors.length) issues.push(`pageerror ${errors.join(" | ")}`);
await browser.close();
if (issues.length) {
  console.error(JSON.stringify({ ok: false, issues, found: found.slice(0, 200), fromHome, fromAssets }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, fromHome, fromAssets, found: found.slice(0, 120) }));
