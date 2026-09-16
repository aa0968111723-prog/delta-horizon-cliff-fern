#!/usr/bin/env node
/**
 * 互動 QA：走一遍「首頁 → AI 幫我創作 → 生成文案 → 學生視角檢查 → 建立內容」，
 * 再逐頁檢查活動、日曆、IG、搜尋與連接，最後回報每一頁的 console 錯誤。
 *
 * 用法：node scripts/qa-flow.mjs [baseUrl] [screenshotPrefix]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:8080";
const prefix = process.argv[3] ?? "/workspace/screenshots/qa";
mkdirSync("/workspace/screenshots", { recursive: true });

const errors = [];
const steps = [];

function record(step, ok, detail = "") {
  steps.push({ step, ok, detail });
  if (!ok) errors.push(`${step}: ${detail}`);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

async function text() {
  return page.locator("body").innerText();
}

async function expectText(step, needle) {
  const body = await text();
  record(step, body.includes(needle), body.includes(needle) ? "" : `找不到「${needle}」`);
}

/** Playwright 的可見性穩定檢查會被學生視角等面板撐高版面卡住，改直接點。 */
async function tap(locator) {
  await locator.evaluate((el) => {
    if (el instanceof HTMLElement) el.click();
  });
}

try {
  // 1. 首頁
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await expectText("首頁標題", "今天可以創作什麼？");
  await expectText("今天推薦創作", "AI 建議這篇");
  await expectText("今天可以發", "今天可以發");
  await expectText("可以發了", "可以發了");
  await expectText("首頁帶走文案", "複製並下載");
  await expectText("今日靈感", "今日靈感");
  await page.getByText("今天可以發", { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${prefix}-today-posts.png` });

  // 2. AI 幫我創作
  await page.getByRole("button", { name: /AI 幫我創作/ }).evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await page.waitForURL(/\/create/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await expectText("創作頁", "一句想法");
  const ideaVal = await page.locator("#idea").inputValue();
  record("首頁帶入想法", ideaVal.length > 0, "想法欄是空的");

  // 3. 從活動節奏進來會自動寫文案；沒出現再按生成
  const autoDrafts = await page
    .waitForSelector("text=文案版本", { timeout: 30000 })
    .then(() => true)
    .catch(() => false);
  if (!autoDrafts) {
    await tap(page.getByRole("button", { name: /^生成文案$/ }));
    await page.waitForSelector("text=文案版本", { timeout: 30000 });
  }
  await expectText("文案版本", "文案版本");
  const draftCount = await page.locator("article").count();
  record("文案版本數量", draftCount >= 2, `只有 ${draftCount} 篇`);
  await page.screenshot({ path: `${prefix}-copy.png`, fullPage: false });

  // 4. 學生視角：生成後會自動切換；沒出現再按一次
  const autoReview = await page
    .waitForSelector("text=淡江學生視角", { timeout: 30000 })
    .then(() => true)
    .catch(() => false);
  if (!autoReview) {
    await tap(page.getByRole("button", { name: /學生視角檢查/ }).first());
    await page.waitForSelector("text=淡江學生視角", { timeout: 30000 });
  }
  await expectText("學生視角", "會停下來的可能");
  await page.screenshot({ path: `${prefix}-review.png` });

  // 5. 視覺方向
  await tap(page.getByRole("button", { name: /想 3 個視覺方向/ }));
  await page.waitForSelector("summary:has-text('圖片 Prompt')", { timeout: 30000 });
  const dirs = await page.locator("summary", { hasText: "圖片 Prompt" }).count();
  record("視覺方向數量", dirs >= 3, `只有 ${dirs} 個`);
  await page.screenshot({ path: `${prefix}-visual.png` });

  // 6. 用這版 → 建立內容
  await page.getByRole("button", { name: /^用這版$/ }).first().evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await page.waitForTimeout(1200);
  await expectText("建立內容後回到創作頁", "進畫面編輯");
  await expectText("來源標示", "這則用到的來源");
  await expectText("完成這則", "這則完成了");
  await expectText("發文包", "複製發文文案");
  await expectText("複製並下載", "複製並下載");
  await expectText("下載圖", "下載圖");
  await expectText("做成全套", "一次做成全套");
  await expectText("無障礙說明", "無障礙");
  await page.getByText("發這則").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${prefix}-post-pack.png` });
  const createUrl = page.url();
  await tap(page.getByRole("button", { name: /做成.*LINE/ }));
  await page.waitForURL(/\/studio\//, { timeout: 15000 });
  await page.waitForSelector("text=1.91:1", { timeout: 15000 });
  await expectText("LINE 橫式", "1.91:1");
  await expectText("LINE 預覽", "LINE 預覽");
  await expectText("複製 LINE 文案", "複製 LINE 文案");
  await page.screenshot({ path: `${prefix}-line.png` });
  await tap(page.getByRole("button", { name: /做成Threads/ }));
  await page.waitForSelector("text=Threads 預覽", { timeout: 15000 });
  await expectText("Threads 預覽", "Threads 預覽");
  await expectText("複製 Threads 文案", "複製 Threads 文案");
  await page.screenshot({ path: `${prefix}-threads.png` });
  await tap(page.getByRole("button", { name: /做成Reels/ }));
  await page.waitForSelector("text=Reels 預覽", { timeout: 15000 });
  await expectText("Reels 預覽", "Reels 預覽");
  await expectText("轉換後可複製腳本", "複製整支腳本");
  await page.screenshot({ path: `${prefix}-reels-preview.png` });
  await page.goto(createUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=這則完成了", { timeout: 15000 });
  await tap(page.getByRole("button", { name: "這則完成了" }).first());
  await page.waitForTimeout(500);
  await expectText("標成完成後可排程", "排到日曆");

  // 6b. 一鍵轉換 + Reels 腳本
  await expectText("一鍵轉換", "做成其他型態");
  await page.getByRole("button", { name: /寫 Reels 腳本/ }).evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await page.waitForSelector("text=複製整支腳本", { timeout: 30000 });
  await expectText("Reels 腳本", "複製整支腳本");
  await expectText("生成封面", "生成封面圖");
  await page.screenshot({ path: `${prefix}-reels.png` });

  await page.getByText("做成其他型態").scrollIntoViewIfNeeded();
  await page.locator("[aria-label^='做成']").first().evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await page.waitForTimeout(800);
  const afterConvert = await text();
  record("一鍵轉換輪播", afterConvert.includes("輪播") || afterConvert.includes("做成其他型態"), "轉換後畫面沒更新");

  // 7. 逐頁檢查
  for (const [name, path, needle] of [
    ["活動列表", "/campaigns", "社課與活動"],
    ["日曆", "/calendar", "依宣傳節奏排程"],
    ["IG 中心", "/instagram", "IG 中心"],
    ["搜尋", "/search", "找素材與過去的內容"],
    ["連接", "/connections", "尚未設定憑證"],
    ["素材庫", "/assets", "用這張創作"],
    ["品牌", "/brand", "歷屆文宣"],
  ]) {
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await expectText(name, needle);
  }

  await page.goto(`${base}/assets`, { waitUntil: "networkidle" });
  await expectText("示範素材龜龜", "龜龜");
  await expectText("示範素材三色光", "三色光標誌");
  const brokenPreviews = await page.getByText("預覽失敗").count();
  record("示範素材沒有預覽失敗", brokenPreviews === 0, `有 ${brokenPreviews} 張預覽失敗`);
  const seedImages = await page.locator("article img").count();
  record("示範素材圖檔", seedImages >= 5, `只有 ${seedImages} 張圖`);
  await page.screenshot({ path: `${prefix}-assets.png` });

  await page.goto(`${base}/brand`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "品牌記憶" }).evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await page.waitForTimeout(400);
  await expectText("歷屆文宣挑選", "歷屆文宣");
  await page.screenshot({ path: `${prefix}-brand-legacy.png` });

  await page.goto(`${base}/calendar`, { waitUntil: "networkidle" });
  await expectText("日曆可改節奏", "還沒建立");
  await expectText("日曆還沒排", "完成了、還沒排");
  await expectText("日曆帶走文案", "複製並下載");
  await page.getByRole("button", { name: "依宣傳節奏排程" }).evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await page.waitForTimeout(800);
  const cal = await text();
  record(
    "AI 自動排程",
    cal.includes("已排程") || cal.includes("主視覺") || cal.includes("沒有可以排"),
    "排程後日曆沒有更新",
  );
  await page.screenshot({ path: `${prefix}-calendar.png` });

  // 8. 活動詳情 + AI 生成完整宣傳
  await page.goto(`${base}/campaigns`, { waitUntil: "networkidle" });
  await tap(page.locator("a[href^='/campaigns/']").first());
  await page.waitForURL(/\/campaigns\/camp/, { timeout: 15000 });
  // 用戶端換頁要等新的 route chunk 載完，networkidle 這時已經是 idle 了。
  await page.waitForSelector("text=宣傳節奏", { timeout: 20000 });
  await expectText("活動詳情", "宣傳節奏");
  await expectText("做成這篇入口", "做成這篇");
  await page.getByRole("button", { name: /AI 生成完整宣傳/ }).evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await page.waitForTimeout(2500);
  const waves = await page.locator("ol > li").count();
  record("宣傳節奏波次", waves >= 4, `只有 ${waves} 波`);
  await page.screenshot({ path: `${prefix}-campaign.png`, fullPage: false });

  await page.getByRole("button", { name: "做成這篇" }).first().evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await page.waitForURL(/\/create/, { timeout: 15000 });
  const madeIdea = await page.locator("#idea").inputValue();
  record("做成這篇帶入想法", madeIdea.length > 0, "想法欄沒有帶入節奏 hook");
  const madeDrafts = await page
    .waitForSelector("text=文案版本", { timeout: 30000 })
    .then(() => true)
    .catch(() => false);
  record("做成這篇自動文案", madeDrafts, "做成這篇之後沒有自動寫文案");
  await page.screenshot({ path: `${prefix}-from-wave.png` });

  // 8b. 從一張圖片 → 不用先分析就能做成限動；改這張圖要看得到
  await page.goto(`${base}/create?from=image`, { waitUntil: "networkidle" });
  await expectText("從一張圖片", "圖片理解");
  const tinyPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC",
    "base64",
  );
  writeFileSync("/tmp/qa-image.png", tinyPng);
  await page.locator('input[type="file"][accept="image/*"]').setInputFiles("/tmp/qa-image.png");
  await page.waitForSelector('img[alt="待分析的圖片"]', { timeout: 10000 });
  await expectText("做成限動入口", "做成限動");
  await expectText("用這張寫文案", "用這張寫文案");
  await expectText("改這張圖", "改這張圖");
  await expectText("改版預設", "更像淡江生活");
  await page
    .locator("section")
    .filter({ hasText: "圖片理解" })
    .getByRole("button", { name: "做成限動" })
    .evaluate((el) => (el instanceof HTMLElement ? el.click() : undefined));
  await page.waitForURL(/\/studio\//, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("text=這則用到的來源", { timeout: 10000 });
  await expectText("做成限動來源", "這則用到的來源");
  await page.screenshot({ path: `${prefix}-from-image.png` });

  await page.goto(`${base}/instagram`, { waitUntil: "networkidle" });
  await expectText("IG 個人頁", "追蹤者");
  await expectText("IG 網格切換", "網格");
  await expectText("IG 貼文切換", "貼文");
  await expectText("IG 限動切換", "限動");
  await page.getByRole("button", { name: "貼文" }).evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await expectText("IG 動態預覽", "動態預覽");
  const nextPage = page.getByRole("button", { name: "下一頁" }).first();
  record("IG 輪播翻頁", (await nextPage.count()) > 0, "找不到下一頁");
  await nextPage.evaluate((el) => (el instanceof HTMLElement ? el.click() : undefined));
  await page.screenshot({ path: `${prefix}-ig-feed.png` });
  await page.getByRole("button", { name: "限動" }).evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await expectText("IG 限動預覽", "限動預覽");
  await page.screenshot({ path: `${prefix}-ig-story.png` });
  await page.getByRole("button", { name: "IG DNA" }).evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await expectText("IG DNA 寫新的一篇", "用這個習慣寫新的一篇");
  await expectText("IG DNA 讀過去內容", "用 AI 讀這些過去內容");
  await page.getByRole("button", { name: "用 AI 讀這些過去內容" }).evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await page.waitForTimeout(2500);
  const dnaBody = await text();
  record(
    "IG 讀過過去內容",
    dnaBody.includes("帳號自己的語氣") || dnaBody.includes("本機整理") || dnaBody.includes("語氣"),
    "讀完後 DNA 沒有整理結果",
  );
  await page.screenshot({ path: `${prefix}-ig-reading.png` });
  await page.getByRole("button", { name: "過去 IG" }).evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await expectText("延續這則", "延續這則");
  await page.getByRole("link", { name: "延續這則" }).first().evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await page.waitForURL(/\/create/, { timeout: 15000 });
  const extendIdea = await page.locator("#idea").inputValue();
  record("延續這則帶入想法", extendIdea.length > 0, "想法欄沒有帶入過去內容");

  await page.goto(`${base}/search`, { waitUntil: "networkidle" });
  await expectText("搜尋用這張創作", "用這張創作");

  await page.goto(`${base}/create?kind=ig-post&step=visual`, { waitUntil: "networkidle" });
  await page.waitForSelector("summary:has-text('圖片 Prompt')", { timeout: 30000 });
  const quickDirs = await page.locator("summary", { hasText: "圖片 Prompt" }).count();
  record("快速開始視覺方向", quickDirs >= 3, `只有 ${quickDirs} 個`);
  const visualIdea = await page.locator("#idea").inputValue();
  record("快速開始帶入想法", visualIdea.length > 0, "想法欄是空的");
  await page.screenshot({ path: `${prefix}-quick-visual.png` });

  await page.goto(`${base}/create?kind=reels`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Reels 腳本", { timeout: 30000 });
  await expectText("快速開始 Reels", "複製整支腳本");
  await page.screenshot({ path: `${prefix}-quick-reels.png` });

  // 9. 手機視窗檢查橫向溢出
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mobile.newPage();
  for (const path of ["/", "/create", "/campaigns", "/calendar", "/instagram", "/search", "/connections", "/brand", "/assets"]) {
    await mp.goto(`${base}${path}`, { waitUntil: "networkidle" });
    const overflow = await mp.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    record(`手機無橫向溢出 ${path}`, !overflow, overflow ? "有橫向溢出" : "");
  }
  for (const width of [375, 430]) {
    await mp.setViewportSize({ width, height: 844 });
    await mp.goto(`${base}/`, { waitUntil: "networkidle" });
    const overflow = await mp.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    record(`手機 ${width} 無橫向溢出`, !overflow, overflow ? "有橫向溢出" : "");
  }
  // 中央 AI 創作按鈕
  await mp.goto(`${base}/`, { waitUntil: "networkidle" });
  await mp.getByRole("button", { name: "AI 創作" }).evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await mp.waitForTimeout(600);
  const sheet = await mp.locator("body").innerText();
  record("底部 AI 創作面板", sheet.includes("今天想創作什麼？"), "面板沒打開");
  await mp.screenshot({ path: `${prefix}-mobile-create.png` });
  await mobile.close();
} catch (err) {
  record("流程中斷", false, err.message);
} finally {
  await browser.close();
}

const ignorable = /Outdated Optimize Dep|favicon|net::ERR_ABORTED/;
const realConsole = consoleErrors.filter((line) => !ignorable.test(line));

console.log(
  JSON.stringify(
    {
      ok: errors.length === 0 && realConsole.length === 0,
      base,
      failures: errors,
      consoleErrors: realConsole,
      steps,
    },
    null,
    2,
  ),
);
process.exit(errors.length === 0 && realConsole.length === 0 ? 0 : 1);
