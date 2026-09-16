import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
const issues = [];
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));

await page.goto(`${base}/create?mode=idea&idea=${encodeURIComponent("下週有一場茶會")}`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="found-sources"]', { timeout: 25_000 });
const found = (await page.locator('[data-testid="found-sources"]').innerText()) ?? "";
if (!/Google Drive/.test(found)) issues.push(`一句話進創作沒找到 Drive: ${found.slice(0, 200)}`);
if (!/Canva/.test(found)) issues.push(`一句話進創作沒找到 Canva: ${found.slice(0, 200)}`);
if (!/Instagram/.test(found)) issues.push(`一句話進創作沒找到 Instagram: ${found.slice(0, 200)}`);
if (/。。/.test(found)) issues.push(`找到的素材說明句點重複: ${found.slice(0, 180)}`);
await page.waitForSelector('[data-testid="direction-list"]', { timeout: 45_000 });
const foundY = (await page.locator('[data-testid="found-sources"]').boundingBox())?.y ?? 0;
const dirsY = (await page.locator('[data-testid="direction-list"]').boundingBox())?.y ?? 0;
if (foundY > dirsY) issues.push("找到的素材還排在三個方向下面");
if ((await page.locator('[data-testid="event-details"]').count()) === 0) {
  issues.push("活動細節沒有收進摺疊");
}
await page.screenshot({ path: "/workspace/screenshots/idea-sources.png", fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="home-ready"]', { timeout: 20_000 });
const fabOverlap = await page.evaluate(() => {
  const fab = document.querySelector('button[aria-label="AI 創作"]');
  const cta = document.querySelector('[data-testid="home-recommend"] button');
  if (!fab || !cta) return "missing";
  const a = fab.getBoundingClientRect();
  const b = cta.getBoundingClientRect();
  const hit = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  return hit ? "cta-under-fab" : "ok";
});
if (fabOverlap !== "ok") issues.push(`390 首頁 AI 幫我創作被 FAB 擋住: ${fabOverlap}`);
const inspOverlap = await page.evaluate(() => {
  const fab = document.querySelector('[data-testid="mobile-create-fab"]');
  const buttons = [...document.querySelectorAll('[data-testid="home-inspiration"] button')];
  if (!fab) return "missing-fab";
  const a = fab.getBoundingClientRect();
  for (const el of buttons) {
    const b = el.getBoundingClientRect();
    const hit = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    if (hit) return "inspiration-under-fab";
  }
  return "ok";
});
if (inspOverlap !== "ok") issues.push(`390 今日靈感被 FAB 擋住: ${inspOverlap}`);
await page.screenshot({ path: "/workspace/screenshots/idea-home-390.png" });

if (errors.length) issues.push(`pageerror ${errors.join(" | ")}`);
await browser.close();
if (issues.length) {
  console.error(JSON.stringify({ ok: false, issues, found: found.slice(0, 240) }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, found: found.slice(0, 160) }));
