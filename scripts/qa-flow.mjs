#!/usr/bin/env node
/**
 * 互動 QA：走一遍「首頁 → AI 幫我創作 → 生成文案 → 學生視角檢查 → 建立內容」，
 * 再逐頁檢查活動、日曆、IG、搜尋與連接，最後回報每一頁的 console 錯誤。
 *
 * 用法：node scripts/qa-flow.mjs [baseUrl] [screenshotPrefix]
 */
import { mkdirSync } from "node:fs";
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

try {
  // 1. 首頁
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await expectText("首頁標題", "今天可以創作什麼？");
  await expectText("今天推薦創作", "AI 建議這篇");

  // 2. AI 幫我創作
  await page.getByRole("button", { name: /AI 幫我創作/ }).click();
  await page.waitForURL(/\/create/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await expectText("創作頁", "一句想法");

  // 3. 生成文案（沒有 API key 時會退回本機草稿）
  await page.getByRole("button", { name: /^生成文案$/ }).click();
  await page.waitForSelector("text=文案版本", { timeout: 30000 });
  await expectText("文案版本", "文案版本");
  const draftCount = await page.locator("article").count();
  record("文案版本數量", draftCount >= 2, `只有 ${draftCount} 篇`);
  await page.screenshot({ path: `${prefix}-copy.png`, fullPage: false });

  // 4. 學生視角檢查
  await page.getByRole("button", { name: /學生視角檢查/ }).first().click();
  await page.waitForSelector("text=淡江學生視角", { timeout: 30000 });
  await expectText("學生視角", "會停下來的可能");
  await page.screenshot({ path: `${prefix}-review.png` });

  // 5. 視覺方向
  await page.getByRole("button", { name: /想 3 個視覺方向/ }).click();
  await page.waitForSelector("summary:has-text('圖片 Prompt')", { timeout: 30000 });
  const dirs = await page.locator("summary", { hasText: "圖片 Prompt" }).count();
  record("視覺方向數量", dirs >= 3, `只有 ${dirs} 個`);
  await page.screenshot({ path: `${prefix}-visual.png` });

  // 6. 用這版 → 建立內容
  await page.getByRole("button", { name: /^用這版$/ }).first().click();
  await page.waitForTimeout(1200);
  await expectText("建立內容後回到創作頁", "進畫面編輯");

  // 7. 逐頁檢查
  for (const [name, path, needle] of [
    ["活動列表", "/campaigns", "社課與活動"],
    ["日曆", "/calendar", "內容日曆"],
    ["IG 中心", "/instagram", "IG 中心"],
    ["搜尋", "/search", "找素材與過去的內容"],
    ["連接", "/connections", "素材與帳號"],
    ["素材庫", "/assets", "素材"],
    ["品牌", "/brand", "品牌"],
  ]) {
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await expectText(name, needle);
  }

  // 8. 活動詳情 + AI 生成完整宣傳
  await page.goto(`${base}/campaigns`, { waitUntil: "networkidle" });
  await page.locator("a[href^='/campaigns/']").first().click();
  await page.waitForURL(/\/campaigns\/camp/, { timeout: 15000 });
  // 用戶端換頁要等新的 route chunk 載完，networkidle 這時已經是 idle 了。
  await page.waitForSelector("text=宣傳節奏", { timeout: 20000 });
  await expectText("活動詳情", "宣傳節奏");
  await page.getByRole("button", { name: /AI 生成完整宣傳/ }).click();
  await page.waitForTimeout(2500);
  const waves = await page.locator("ol > li").count();
  record("宣傳節奏波次", waves >= 4, `只有 ${waves} 波`);
  await page.screenshot({ path: `${prefix}-campaign.png`, fullPage: false });

  // 9. 手機視窗檢查橫向溢出
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mobile.newPage();
  for (const path of ["/", "/create", "/campaigns", "/calendar", "/instagram", "/search", "/connections"]) {
    await mp.goto(`${base}${path}`, { waitUntil: "networkidle" });
    const overflow = await mp.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    record(`手機無橫向溢出 ${path}`, !overflow, "有橫向溢出");
  }
  // 中央 AI 創作按鈕
  await mp.goto(`${base}/`, { waitUntil: "networkidle" });
  await mp.getByRole("button", { name: "AI 創作" }).click();
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
