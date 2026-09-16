import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
const issues = [];
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));

await page.goto(`${base}/inspire`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="inspire-ready"]', { timeout: 30_000 });
await page.waitForSelector('[data-testid="found-sources"]', { timeout: 20_000 });
const found = (await page.locator('[data-testid="found-sources"]').innerText()) ?? "";
if (!/Google Drive/.test(found) || !/茶會/.test(found)) {
  issues.push(`靈感研究沒搜到茶會素材: ${found.slice(0, 220)}`);
}
const research = (await page.locator('[data-testid="inspiration-research"]').innerText()) ?? "";
if (!/構圖/.test(research) || !/Hook/.test(research)) issues.push(`沒有抽象出構圖與 Hook: ${research.slice(0, 180)}`);
if (/其他學校|某社團貼文|Assignee/.test(research)) issues.push("靈感研究在抄別人");
const sourceLine = (await page.locator('[data-testid="inspire-visual-source"]').innerText()) ?? "";
if (!/Google Drive/.test(sourceLine)) issues.push(`沒標來源: ${sourceLine}`);
await page.waitForSelector('[data-testid="direction-look-a"]', { timeout: 15_000 });
const lookHasPhoto = await page.locator('[data-testid="direction-look-a"]').evaluate((el) => {
  const src = el.getAttribute("src") || "";
  try {
    return /data-source-photo/.test(decodeURIComponent(escape(atob(src.split(",")[1] || ""))));
  } catch {
    return false;
  }
});
if (!lookHasPhoto) issues.push("靈感方向沒有延續找到的照片");
const headlines = (await page.locator('[data-testid="direction-headline"]').allInnerTexts()).join("\n");
if (/誠摯邀請/.test(headlines)) issues.push(`靈感 Hook 出現誠摯邀請: ${headlines}`);
await page.locator('[data-testid="direction-look-a"]').screenshot({ path: "/workspace/screenshots/inspire-look-a.png" });
await page.screenshot({ path: "/workspace/screenshots/inspire-tea.png", fullPage: true });

await page.locator('[data-testid="inspire-into-create"]').click();
await page.waitForSelector('[data-testid="event-name"]', { timeout: 25_000 });
const eventName = (await page.locator('[data-testid="event-name"]').inputValue()) ?? "";
if (eventName !== "茶會") issues.push(`轉成內容活動名不是茶會: ${eventName}`);
await page.waitForSelector('[data-testid="found-sources"]', { timeout: 25_000 });
const createFound = (await page.locator('[data-testid="found-sources"]').innerText()) ?? "";
if (!/茶會/.test(createFound)) issues.push(`轉成內容沒帶到茶會素材: ${createFound.slice(0, 180)}`);
await page.screenshot({ path: "/workspace/screenshots/inspire-into-create.png", fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/inspire`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="inspire-ready"]', { timeout: 30_000 });
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
);
if (overflow) issues.push("390/inspire overflow");
await page.screenshot({ path: "/workspace/screenshots/inspire-tea-390.png" });

if (errors.length) issues.push(`pageerror ${errors.join(" | ")}`);
await browser.close();
if (issues.length) {
  console.error(JSON.stringify({ ok: false, issues, found: found.slice(0, 200), eventName }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, eventName, found: found.slice(0, 160) }));
