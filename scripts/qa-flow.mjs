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

/** Chromium 的滑鼠 dragTo 不會觸發 HTML5 DataTransfer，改派 DragEvent。 */
async function html5DragPackToAnotherDay() {
  return page.evaluate(() => {
    const chip = document.querySelector("[data-testid=calendar-chip-pack]");
    if (!(chip instanceof HTMLElement)) return { ok: false, detail: "沒有全套晶片" };
    const sourceDay = chip.closest("[data-testid=calendar-day]");
    const sourceDate = sourceDay?.getAttribute("data-date") ?? "";
    const days = [...document.querySelectorAll("[data-testid=calendar-day]")];
    const later = days.find((el) => {
      const date = el.getAttribute("data-date") ?? "";
      return date > sourceDate && el.getAttribute("data-in-month") === "1";
    });
    const dest =
      later ??
      days.find((el) => {
        const date = el.getAttribute("data-date") ?? "";
        return date && date !== sourceDate && el.getAttribute("data-in-month") === "1";
      });
    if (!(dest instanceof HTMLElement)) {
      return { ok: false, detail: "沒有可以放下的日期", sourceDate };
    }
    const destDate = dest.getAttribute("data-date") ?? "";
    const dt = new DataTransfer();
    const fire = (el, type) =>
      el.dispatchEvent(
        new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          dataTransfer: dt,
        }),
      );
    fire(chip, "dragstart");
    fire(dest, "dragenter");
    fire(dest, "dragover");
    fire(dest, "drop");
    fire(chip, "dragend");
    return { ok: true, detail: `${sourceDate} → ${destDate}`, sourceDate, destDate };
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
  await expectText("視覺方向可用示範照片", "點照片也能當主視覺");
  await tap(page.getByRole("button", { name: "Story 9:16" }).first());
  await tap(page.getByTestId("visual-generate").first());
  await page.waitForSelector("text=本機素材", { timeout: 20000 });
  await expectText("生圖本機素材", "本機素材");
  await expectText("生圖不是 AI 畫面", "不是 AI 生成的畫面");
  await expectText("生圖已排成比例", "已排成 Story 9:16");
  const previewRatio = await page.getByTestId("visual-preview").first().getAttribute("data-ratio");
  record("生圖預覽比例", previewRatio === "9:16", `預覽是 ${previewRatio ?? "沒有"}`);
  await page.getByTestId("visual-local-ratio").first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${prefix}-visual.png` });

  // 6. 用這版 → 建立內容。從首頁節奏進來時已經有內容跟「進畫面編輯」。
  if (!(await text()).includes("進畫面編輯")) {
    await page.getByRole("button", { name: /^用這版$/ }).first().evaluate((el) =>
      el instanceof HTMLElement ? el.click() : undefined,
    );
    await page.waitForSelector("text=進畫面編輯", { timeout: 15000 });
  }
  await expectText("建立內容後回到創作頁", "進畫面編輯");
  await tap(page.getByRole("button", { name: "IG 1:1" }).first());
  await tap(page.getByTestId("hero-card-asset_tamsui_dusk").first());
  await page.waitForTimeout(500);
  const afterCreateHero = await text();
  record(
    "創作頁 1:1 主視覺",
    afterCreateHero.includes("已套成 1:1") || afterCreateHero.includes("1:1 主視覺"),
    "選 1:1 再點淡水河傍晚之後沒有換成主視覺",
  );
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
  await page.waitForSelector('[data-testid="line-preview"][data-variant="compact"]', { timeout: 8000 });
  await expectText("LINE 橫式畫面在下面", "1.91:1 畫面在下面");
  await page.waitForSelector('[data-testid="artboard-photo"]', { timeout: 15000 });
  const linePhoto = await page
    .getByTestId("artboard")
    .first()
    .locator("[data-testid=artboard-photo]")
    .count();
  record(
    "LINE 橫式有照片",
    linePhoto > 0,
    linePhoto > 0 ? `畫布上有 ${linePhoto} 張主視覺` : "LINE 圖沒有主視覺照片",
  );
  const lineVisible = await page.evaluate(() => {
    const board = document.querySelector("[data-testid=artboard]");
    const preview = document.querySelector("[data-testid=line-preview]");
    if (!(board instanceof HTMLElement)) return { ok: false, detail: "沒有畫布" };
    const r = board.getBoundingClientRect();
    const visibleH = Math.min(r.bottom, window.innerHeight - 40) - Math.max(r.top, 0);
    const compact = preview?.getAttribute("data-variant") === "compact";
    return {
      ok: compact && visibleH >= 120 && r.width >= 180 && r.width > r.height,
      detail: `${compact ? "compact" : "full"} ${Math.round(r.width)}×${Math.round(visibleH)}`,
    };
  });
  record("LINE 橫式封面看得到", Boolean(lineVisible.ok), lineVisible.detail || "");
  await tap(page.getByTestId("line-open-copy").first());
  await page.waitForSelector("text=改這裡只影響目前這一頁", { timeout: 8000 });
  await expectText("LINE 完整文案在文字", "改這裡只影響目前這一頁");
  await page.screenshot({ path: `${prefix}-line.png` });
  await tap(page.getByRole("button", { name: /做成Threads/ }).first());
  await page.waitForSelector("text=Threads 預覽", { timeout: 15000 });
  await expectText("Threads 預覽", "Threads 預覽");
  await expectText("複製 Threads 文案", "複製 Threads 文案");
  await page.screenshot({ path: `${prefix}-threads.png` });
  await tap(page.getByRole("button", { name: /做成Reels/ }).first());
  await page.waitForSelector("text=Reels 預覽", { timeout: 15000 });
  await expectText("Reels 預覽", "Reels 預覽");
  await expectText("轉換後可複製腳本", "複製整支腳本");
  await page.waitForSelector("[data-testid=artboard]", { timeout: 15000 });
  const convertReelsVisible = await page.evaluate(() => {
    const board = document.querySelector("[data-testid=artboard]");
    if (!(board instanceof HTMLElement)) return { ok: false, detail: "沒有畫布" };
    const r = board.getBoundingClientRect();
    const visibleH = Math.min(r.bottom, window.innerHeight - 40) - Math.max(r.top, 0);
    return { ok: visibleH >= 180 && r.width >= 90, detail: `${Math.round(r.width)}×${Math.round(visibleH)}` };
  });
  record("轉換 Reels 封面看得到", Boolean(convertReelsVisible.ok), convertReelsVisible.detail || "");
  await page.screenshot({ path: `${prefix}-reels-preview.png` });
  await page.goto(createUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=這則完成了", { timeout: 15000 });
  await expectText("全套列表", "這次做成的全套");
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

  await page.getByText("做成其他型態").evaluate((el) => el instanceof HTMLElement && el.scrollIntoView({ block: "nearest" }));
  await tap(page.getByRole("button", { name: "一次做成全套" }));
  await page.waitForURL(/pack=1/, { timeout: 15000 }).catch(() => undefined);
  await page.waitForSelector("#convert-pack", { timeout: 15000 });
  const afterPack = await text();
  record(
    "一次做成全套",
    afterPack.includes("這次做成的全套") && afterPack.includes("輪播") && afterPack.includes("限動"),
    "全套裡沒有輪播或限動",
  );
  await page.locator("#convert-pack").evaluate((el) => el instanceof HTMLElement && el.scrollIntoView({ block: "start" }));
  await expectText("全套下載", "下載全套");
  await expectText("全套完成", "這套完成了");
  await expectText("全套同步文案", "文案套到全套");
  await tap(page.getByRole("button", { name: "文案套到全套" }));
  await page.waitForTimeout(500);
  const afterSpread = await text();
  record(
    "全套文案已套上",
    afterSpread.includes("套到") || afterSpread.includes("Threads"),
    "套到全套之後沒有更新",
  );
  await expectText("全套同步畫面", "畫面套到全套");
  await tap(page.getByRole("button", { name: "畫面套到全套" }));
  await page.waitForTimeout(500);
  const afterVisual = await text();
  record(
    "全套畫面已套上",
    afterVisual.includes("套到") || afterVisual.includes("主視覺") || afterVisual.includes("畫面"),
    "套到全套畫面之後沒有更新",
  );
  await tap(page.getByRole("button", { name: "這套完成了" }));
  await page.waitForTimeout(400);
  await expectText("全套可排程", "排這套到日曆");
  await expectText("全套可發布", "這套都發出去了");
  await page.screenshot({ path: `${prefix}-pack.png` });
  await tap(page.locator("#convert-pack a").filter({ hasText: "進畫面" }).first());
  await page.waitForURL(/\/studio\//, { timeout: 15000 });
  await expectText("畫面裡可套全套", "文案套到全套");
  await page.waitForSelector("text=當主視覺", { timeout: 15000 });
  await expectText("畫面裡當主視覺", "當主視覺");
  await page.getByTestId("hero-strip-asset_window_light").evaluate((el) => {
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ block: "center" });
      el.click();
    }
  });
  await page.waitForSelector("text=窗邊光與坐墊」已套成", { timeout: 8000 });
  await expectText("畫面換成主視覺", "窗邊光與坐墊」已套成");
  await page.screenshot({ path: `${prefix}-studio-pack.png` });

  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.getByText("今天可以發", { exact: true }).scrollIntoViewIfNeeded();
  await expectText("首頁全套型態", "種型態");
  await expectText("首頁全套排程", "排這套到日曆");
  await page.screenshot({ path: `${prefix}-today-pack.png` });

  await page.goto(`${base}/export`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=預覽與下載", { timeout: 15000 });
  await expectText("輸出全套", "下載全套");
  await expectText("輸出全套列表", "這次做成的全套");
  await expectText("輸出全套說明", "種畫面會下載圖");
  await page.screenshot({ path: `${prefix}-export-pack.png` });
  const downloads = [];
  page.on("download", (download) => {
    downloads.push(download.suggestedFilename());
    void download.cancel().catch(() => undefined);
  });
  await tap(page.getByRole("button", { name: "下載全套" }).first());
  const deadline = Date.now() + 20000;
  while (!downloads.length && Date.now() < deadline) {
    await page.waitForTimeout(250);
  }
  record(
    "點下載全套",
    downloads.length > 0,
    downloads.length ? downloads.slice(0, 8).join("、") : "沒有開始下載",
  );

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
  await expectText("日曆全套排程", "排這套到日曆");
  await page.getByRole("button", { name: "依宣傳節奏排程" }).evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await page.waitForTimeout(800);
  const cal = await text();
  record(
    "AI 自動排程",
    cal.includes("已排程") || cal.includes("主視覺") || cal.includes("沒有可以排") || cal.includes("同一晚"),
    "排程後日曆沒有更新",
  );
  await expectText("日曆型態晶片", "IG 貼文");
  await expectText("日曆全套晶片", "全套 ·");
  await page.screenshot({ path: `${prefix}-calendar.png` });
  const packChipReady = await page
    .waitForSelector("[data-testid=calendar-chip-pack]", { timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  if (!packChipReady) {
    await tap(page.getByRole("button", { name: "週" }));
    await page.waitForSelector("[data-testid=calendar-week]", { timeout: 8000 });
    await page.waitForSelector("[data-testid=calendar-chip-pack]", { timeout: 8000 });
  }
  const dragPlan = await html5DragPackToAnotherDay();
  record("日曆拖曳全套", Boolean(dragPlan.ok), dragPlan.detail || "");
  await page.waitForTimeout(700);
  const afterDrag = await text();
  record("日曆拖曳全套改期提示", afterDrag.includes("全套改到"), "沒有「全套改到」提示");
  if (dragPlan.destDate) {
    const destText = await page.locator(`[data-testid=calendar-day][data-date="${dragPlan.destDate}"]`).innerText();
    record(
      "日曆拖曳全套落到那天",
      destText.includes("全套"),
      `目的日 ${dragPlan.destDate} 沒有全套晶片`,
    );
  }
  await page.screenshot({ path: `${prefix}-calendar-drag.png` });
  await tap(page.getByRole("button", { name: "週" }));
  await page.waitForSelector("[data-testid=calendar-week]", { timeout: 8000 });
  await expectText("日曆週視圖", "那週");
  await expectText("日曆週說明", "這一週七欄");
  await expectText("日曆週全套", "全套 ·");
  await page.screenshot({ path: `${prefix}-calendar-week.png` });
  await page.getByRole("button", { name: "清單" }).evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await page.waitForTimeout(400);
  await expectText("日曆清單全套", "全套 ·");
  await page.screenshot({ path: `${prefix}-calendar-agenda.png` });
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await expectText("首頁即將發的全套", "全套 ·");
  await page.getByText("已排程內容", { exact: true }).evaluate((el) =>
    el instanceof HTMLElement ? el.scrollIntoView({ block: "start" }) : undefined,
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${prefix}-home-scheduled.png` });

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

  // 8b. 從一張圖片：示範照片會自動用本機規則分析；上傳圖也能直接做成限動
  await page.goto(`${base}/create?from=image`, { waitUntil: "networkidle" });
  await expectText("從一張圖片", "圖片理解");
  await page.waitForSelector('[data-testid="analyze-asset-asset_tamsui_dusk"]', { timeout: 15000 });
  await tap(page.getByTestId("analyze-asset-asset_tamsui_dusk"));
  await page.waitForSelector('[data-testid="image-analysis"]', { timeout: 20000 });
  await page.waitForSelector('[data-testid="make-kind-ig-post"]', { timeout: 15000 });
  await expectText("圖片本機規則", "本機規則");
  await expectText("圖片適合淡江", "適合淡江學生");
  await expectText("圖片不會太宗教", "不會太宗教");
  await expectText("圖片沒看像素", "沒有真的看像素");
  await page.screenshot({ path: `${prefix}-image-analysis.png` });
  await tap(page.getByTestId("copy-from-image"));
  await page.waitForSelector("text=文案版本", { timeout: 30000 });
  await expectText("從圖寫文案版本", "文案版本");
  await expectText("從圖寫文案仍見圖片", "圖片理解");
  await expectText("從圖寫文案 hook", "走上坡");
  await page.waitForSelector("text=淡江學生視角", { timeout: 20000 });
  await expectText("從圖寫文案學生視角", "會停下來的可能");
  await page.screenshot({ path: `${prefix}-from-image-copy.png` });
  await tap(
    page
      .locator("section")
      .filter({ hasText: "圖片理解" })
      .getByRole("button", { name: "改這張圖" }),
  );
  await page.waitForSelector("text=本機改版", { timeout: 20000 });
  await expectText("圖片本機改版", "本機改版");
  await expectText("圖片改版留白", "只改構圖比例與留白");
  await page.screenshot({ path: `${prefix}-image-revision.png` });
  const tinyPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC",
    "base64",
  );
  writeFileSync("/tmp/qa-image.png", tinyPng);
  await page.locator('input[type="file"][accept="image/*"]').setInputFiles("/tmp/qa-image.png");
  await page.waitForSelector('img[alt="待分析的圖片"]', { timeout: 10000 });
  await expectText("做成限動入口", "做成限動");
  await expectText("做成貼文入口", "做成貼文");
  await expectText("做成 1:1 入口", "做成 1:1");
  await expectText("用這張寫文案", "用這張寫文案");
  await expectText("改這張圖", "改這張圖");
  await expectText("改版預設", "更像淡江生活");
  await expectText("做成貼文會排成 4:5", "做成貼文會排成 IG 4:5");
  await expectText("做成 1:1 會排正方形", "做成 1:1 會排成正方形");
  await expectText("做成限動會排成 9:16", "限動與 Reels 封面會排成 Story 9:16");
  await expectText("做成 LINE 會排橫式", "做成 LINE 圖會排成橫式 1.91:1");
  await tap(page.getByTestId("analyze-asset-asset_tamsui_dusk"));
  await page.waitForSelector('[data-testid="make-kind-story"]', { timeout: 20000 });
  await tap(
    page
      .locator("section")
      .filter({ hasText: "圖片理解" })
      .getByTestId("make-kind-story"),
  );
  await page.waitForURL(/\/studio\//, { timeout: 25000 });
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("text=這則用到的來源", { timeout: 15000 });
  await expectText("做成限動來源", "這則用到的來源");
  await expectText("做成限動已排成比例", "已排成 Story 9:16");
  await page.waitForSelector('[data-testid="artboard"]', { timeout: 15000 });
  const storyRatio = await page.getByTestId("artboard").first().getAttribute("data-ratio");
  record("做成限動畫布比例", storyRatio === "9:16", `畫布是 ${storyRatio ?? "沒有比例"}`);
  const storyFormat = await page.getByTestId("artboard").first().getAttribute("data-format");
  record("做成限動畫布格式", storyFormat === "story", `格式是 ${storyFormat ?? "沒有格式"}`);
  await page.waitForSelector('[data-testid="artboard-photo"]', { timeout: 15000 });
  const storyPhoto = await page
    .getByTestId("artboard")
    .first()
    .locator("[data-testid=artboard-photo]")
    .count();
  record(
    "做成限動封面有照片",
    storyPhoto > 0,
    storyPhoto > 0 ? `畫布上有 ${storyPhoto} 張主視覺` : "封面沒有主視覺照片",
  );
  await page.screenshot({ path: `${prefix}-from-image.png` });

  // 8c. 從一張圖片做成 Reels：腳本 + 9:16 封面
  await page.goto(`${base}/create?from=image`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="analyze-asset-asset_tamsui_dusk"]', { timeout: 15000 });
  await tap(page.getByTestId("analyze-asset-asset_tamsui_dusk"));
  await page.waitForSelector('[data-testid="image-analysis"]', { timeout: 20000 });
  await page.waitForSelector('[data-testid="make-kind-reels"]', { timeout: 15000 });
  await expectText("做成 Reels 會寫腳本", "做成 Reels 封面會同時寫一支 20 秒腳本");
  await tap(
    page
      .locator("section")
      .filter({ hasText: "圖片理解" })
      .getByTestId("make-kind-reels"),
  );
  await page.waitForURL(/\/studio\//, { timeout: 25000 });
  await page.waitForLoadState("networkidle");
  await page.waitForSelector('[data-testid="reels-timeline"]', { timeout: 15000 });
  await expectText("做成 Reels 腳本", "複製整支腳本");
  await expectText("做成 Reels 本機草稿", "本機草稿");
  await expectText("做成 Reels hook 走上坡", "走上坡");
  await expectText("做成 Reels 已排成比例", "已排成 Story 9:16");
  await page.waitForSelector('[data-testid="artboard"]', { timeout: 15000 });
  const reelsRatio = await page.getByTestId("artboard").first().getAttribute("data-ratio");
  record("做成 Reels 畫布比例", reelsRatio === "9:16", `畫布是 ${reelsRatio ?? "沒有比例"}`);
  const reelsFormat = await page.getByTestId("artboard").first().getAttribute("data-format");
  record("做成 Reels 畫布格式", reelsFormat === "reels-cover", `格式是 ${reelsFormat ?? "沒有格式"}`);
  await page.waitForSelector('[data-testid="artboard-photo"]', { timeout: 15000 });
  const reelsPhoto = await page
    .getByTestId("artboard")
    .first()
    .locator("[data-testid=artboard-photo]")
    .count();
  record(
    "做成 Reels 封面有照片",
    reelsPhoto > 0,
    reelsPhoto > 0 ? `畫布上有 ${reelsPhoto} 張主視覺` : "封面沒有主視覺照片",
  );
  await expectText("做成 Reels 封面用照片", "這張照片當 9:16 封面");
  const reelsVisible = await page.evaluate(() => {
    const board = document.querySelector("[data-testid=artboard]");
    const timeline = document.querySelector("[data-testid=reels-timeline]");
    const beats = timeline ? timeline.querySelectorAll("li").length : 0;
    if (!(board instanceof HTMLElement)) return { ok: false, detail: "沒有畫布" };
    const r = board.getBoundingClientRect();
    const vh = window.innerHeight;
    const visibleH = Math.min(r.bottom, vh - 40) - Math.max(r.top, 0);
    const compact = timeline?.getAttribute("data-variant") === "compact";
    return {
      ok: compact && visibleH >= 220 && r.width >= 110 && beats === 0,
      detail: `${compact ? "compact" : "full"} ${Math.round(r.width)}×${Math.round(visibleH)} 秒數列=${beats}`,
    };
  });
  record("做成 Reels 封面看得到", Boolean(reelsVisible.ok), reelsVisible.detail || "");
  await expectText("做成 Reels 腳本收到文字", "完整秒數、旁白與拍法在「文字」");
  await tap(page.getByTestId("reels-open-script").first());
  await page.waitForSelector("text=0–3 秒", { timeout: 8000 });
  await expectText("做成 Reels 完整腳本在文字", "0–3 秒");
  await page.screenshot({ path: `${prefix}-from-image-reels.png` });

  // 8d. 從一張圖片做成輪播：五頁 4:5
  await page.goto(`${base}/create?from=image`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="analyze-asset-asset_tamsui_dusk"]', { timeout: 15000 });
  await tap(page.getByTestId("analyze-asset-asset_tamsui_dusk"));
  await page.waitForSelector('[data-testid="image-analysis"]', { timeout: 20000 });
  await page.waitForSelector('[data-testid="make-kind-carousel"]', { timeout: 15000 });
  await expectText("做成輪播會拆五頁", "輪播排成 IG 4:5 並拆成五頁");
  await tap(
    page
      .locator("section")
      .filter({ hasText: "圖片理解" })
      .getByTestId("make-kind-carousel"),
  );
  await page.waitForURL(/\/studio\//, { timeout: 25000 });
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("[data-testid=slide-count]", { timeout: 15000 });
  const slideCount = await page.getByTestId("slide-count").first().innerText();
  record("做成輪播頁數", /\/5\b/.test(slideCount), `頁數是 ${slideCount}`);
  await expectText("做成輪播封面頁", "封面");
  await expectText("做成輪播痛點頁", "痛點");
  await expectText("做成輪播 hook 走上坡", "走上坡");
  await expectText("做成輪播已排成比例", "已排成 IG 4:5");
  await page.waitForSelector('[data-testid="artboard"]', { timeout: 15000 });
  const carouselRatio = await page.getByTestId("artboard").first().getAttribute("data-ratio");
  record("做成輪播畫布比例", carouselRatio === "4:5", `畫布是 ${carouselRatio ?? "沒有比例"}`);
  const carouselFormat = await page.getByTestId("artboard").first().getAttribute("data-format");
  record("做成輪播畫布格式", carouselFormat === "feed-portrait", `格式是 ${carouselFormat ?? "沒有格式"}`);
  await page.waitForSelector('[data-testid="artboard-photo"]', { timeout: 15000 });
  const carouselPhoto = await page
    .getByTestId("artboard")
    .first()
    .locator("[data-testid=artboard-photo]")
    .count();
  record(
    "做成輪播封面有照片",
    carouselPhoto > 0,
    carouselPhoto > 0 ? `畫布上有 ${carouselPhoto} 張主視覺` : "封面沒有主視覺照片",
  );
  await page.screenshot({ path: `${prefix}-from-image-carousel.png` });

  // 8e. 從一張圖片做成貼文：單張 4:5，照片當主視覺
  await page.goto(`${base}/create?from=image`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="analyze-asset-asset_tamsui_dusk"]', { timeout: 15000 });
  await tap(page.getByTestId("analyze-asset-asset_tamsui_dusk"));
  await page.waitForSelector('[data-testid="image-analysis"]', { timeout: 20000 });
  await page.waitForSelector('[data-testid="make-kind-ig-post"]', { timeout: 15000 });
  await expectText("做成貼文入口再點", "做成貼文");
  await tap(
    page
      .locator("section")
      .filter({ hasText: "圖片理解" })
      .getByTestId("make-kind-ig-post"),
  );
  await page.waitForURL(/\/studio\//, { timeout: 25000 });
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("text=這則用到的來源", { timeout: 15000 });
  await expectText("做成貼文來源", "這則用到的來源");
  await expectText("做成貼文已排成比例", "已排成 IG 4:5");
  await page.waitForSelector('[data-testid="artboard"]', { timeout: 15000 });
  const postRatio = await page.getByTestId("artboard").first().getAttribute("data-ratio");
  record("做成貼文畫布比例", postRatio === "4:5", `畫布是 ${postRatio ?? "沒有比例"}`);
  const postFormat = await page.getByTestId("artboard").first().getAttribute("data-format");
  record("做成貼文畫布格式", postFormat === "feed-portrait", `格式是 ${postFormat ?? "沒有格式"}`);
  await page.waitForSelector('[data-testid="artboard-photo"]', { timeout: 15000 });
  const postPhoto = await page
    .getByTestId("artboard")
    .first()
    .locator("[data-testid=artboard-photo]")
    .count();
  record(
    "做成貼文封面有照片",
    postPhoto > 0,
    postPhoto > 0 ? `畫布上有 ${postPhoto} 張主視覺` : "貼文沒有主視覺照片",
  );
  await page.screenshot({ path: `${prefix}-from-image-post.png` });

  // 8f. 從一張圖片做成 1:1：正方形，照片當主視覺
  await page.goto(`${base}/create?from=image`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="analyze-asset-asset_tamsui_dusk"]', { timeout: 15000 });
  await tap(page.getByTestId("analyze-asset-asset_tamsui_dusk"));
  await page.waitForSelector('[data-testid="image-analysis"]', { timeout: 20000 });
  await page.waitForSelector('[data-testid="make-kind-square"]', { timeout: 15000 });
  await expectText("做成 1:1 入口再點", "做成 1:1");
  await tap(
    page
      .locator("section")
      .filter({ hasText: "圖片理解" })
      .getByTestId("make-kind-square"),
  );
  await page.waitForURL(/\/studio\//, { timeout: 25000 });
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("text=這則用到的來源", { timeout: 15000 });
  await expectText("做成 1:1 來源", "這則用到的來源");
  await expectText("做成 1:1 已排成比例", "已排成 IG 1:1");
  await page.waitForSelector('[data-testid="artboard"]', { timeout: 15000 });
  const squareRatio = await page.getByTestId("artboard").first().getAttribute("data-ratio");
  record("做成 1:1 畫布比例", squareRatio === "1:1", `畫布是 ${squareRatio ?? "沒有比例"}`);
  const squareFormat = await page.getByTestId("artboard").first().getAttribute("data-format");
  record("做成 1:1 畫布格式", squareFormat === "feed-square", `格式是 ${squareFormat ?? "沒有格式"}`);
  await page.waitForSelector('[data-testid="artboard-photo"]', { timeout: 15000 });
  const squarePhoto = await page
    .getByTestId("artboard")
    .first()
    .locator("[data-testid=artboard-photo]")
    .count();
  record(
    "做成 1:1 封面有照片",
    squarePhoto > 0,
    squarePhoto > 0 ? `畫布上有 ${squarePhoto} 張主視覺` : "1:1 沒有主視覺照片",
  );
  await page.screenshot({ path: `${prefix}-from-image-square.png` });

  // 8g. 從一張圖片做成 LINE：1.91:1 橫式，畫面編輯先看到圖
  await page.goto(`${base}/create?from=image`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="analyze-asset-asset_tamsui_dusk"]', { timeout: 15000 });
  await tap(page.getByTestId("analyze-asset-asset_tamsui_dusk"));
  await page.waitForSelector('[data-testid="image-analysis"]', { timeout: 20000 });
  await page.waitForSelector('[data-testid="make-kind-line"]', { timeout: 15000 });
  await expectText("做成 LINE 入口再點", "做成 LINE 圖");
  await tap(
    page
      .locator("section")
      .filter({ hasText: "圖片理解" })
      .getByTestId("make-kind-line"),
  );
  await page.waitForURL(/\/studio\//, { timeout: 25000 });
  await page.waitForLoadState("networkidle");
  await page.waitForSelector('[data-testid="line-preview"][data-variant="compact"]', { timeout: 15000 });
  await expectText("做成 LINE 來源", "這則用到的來源");
  await expectText("做成 LINE 已排成比例", "已排成 LINE / 連結");
  await expectText("做成 LINE 畫面在下面", "1.91:1 畫面在下面");
  await page.waitForSelector('[data-testid="artboard"]', { timeout: 15000 });
  const lineRatio = await page.getByTestId("artboard").first().getAttribute("data-ratio");
  record("做成 LINE 畫布比例", lineRatio === "1.91:1", `畫布是 ${lineRatio ?? "沒有比例"}`);
  const lineFormat = await page.getByTestId("artboard").first().getAttribute("data-format");
  record("做成 LINE 畫布格式", lineFormat === "feed-landscape", `格式是 ${lineFormat ?? "沒有格式"}`);
  await page.waitForSelector('[data-testid="artboard-photo"]', { timeout: 15000 });
  const fromImageLinePhoto = await page
    .getByTestId("artboard")
    .first()
    .locator("[data-testid=artboard-photo]")
    .count();
  record(
    "做成 LINE 封面有照片",
    fromImageLinePhoto > 0,
    fromImageLinePhoto > 0 ? `畫布上有 ${fromImageLinePhoto} 張主視覺` : "LINE 沒有主視覺照片",
  );
  const fromImageLineVisible = await page.evaluate(() => {
    const board = document.querySelector("[data-testid=artboard]");
    const preview = document.querySelector("[data-testid=line-preview]");
    const extra = document.querySelectorAll("[data-testid=line-preview] [data-ratio]").length;
    if (!(board instanceof HTMLElement)) return { ok: false, detail: "沒有畫布" };
    const r = board.getBoundingClientRect();
    const visibleH = Math.min(r.bottom, window.innerHeight - 40) - Math.max(r.top, 0);
    const compact = preview?.getAttribute("data-variant") === "compact";
    return {
      ok: compact && extra === 0 && visibleH >= 120 && r.width >= 180 && r.width > r.height,
      detail: `${compact ? "compact" : "full"} ${Math.round(r.width)}×${Math.round(visibleH)} 預覽圖=${extra}`,
    };
  });
  record("做成 LINE 橫式看得到", Boolean(fromImageLineVisible.ok), fromImageLineVisible.detail || "");
  await tap(page.getByTestId("line-open-copy").first());
  await page.waitForSelector("text=改這裡只影響目前這一頁", { timeout: 8000 });
  await expectText("做成 LINE 完整文案在文字", "改這裡只影響目前這一頁");
  await page.screenshot({ path: `${prefix}-from-image-line.png` });

  await page.goto(`${base}/instagram`, { waitUntil: "networkidle" });
  await expectText("IG 個人頁", "追蹤者");
  await expectText("IG 網格切換", "網格");
  await expectText("IG 貼文切換", "貼文");
  await expectText("IG 限動切換", "限動");
  await expectText("IG 九宮格說明", "九宮格只放貼文");
  const highlightCovers = await page.locator("[data-testid=ig-highlight-cover]").count();
  record(
    "IG 精選圓圈有封面",
    highlightCovers > 0,
    highlightCovers > 0 ? `${highlightCovers} 個精選封面` : "精選圓圈沒有畫面",
  );
  const highlightPortrait = await page.locator('[data-testid=ig-highlight-cover] [data-ratio="9:16"]').count();
  record(
    "IG 精選封面是直式",
    highlightPortrait > 0,
    highlightPortrait > 0 ? `${highlightPortrait} 張 9:16` : "精選封面不是 9:16",
  );
  const gridKinds = await page.locator("[data-testid=ig-grid-cell]").evaluateAll((els) =>
    els.map((el) => el.getAttribute("data-kind") ?? ""),
  );
  const offGrid = gridKinds.filter((kind) =>
    ["story", "reels", "line", "threads", "countdown", "poll"].includes(kind),
  );
  record(
    "IG 網格只有貼文",
    gridKinds.length > 0 && offGrid.length === 0,
    gridKinds.length
      ? offGrid.length
        ? `不該出現 ${offGrid.join("、")}`
        : `格子 ${gridKinds.join("、")}`
      : "九宮格是空的",
  );
  const gridCover = await page
    .locator("[data-testid=ig-grid-cell]")
    .first()
    .evaluate((el) => {
      const box = el.getBoundingClientRect();
      const board = el.querySelector("[data-ratio]");
      const art = board?.getBoundingClientRect();
      if (!art) return { ok: false, detail: "格子裡沒有畫面" };
      const fills = art.width >= box.width * 0.95 && art.height >= box.height * 0.95;
      return {
        ok: fills,
        detail: `格子 ${Math.round(box.width)}×${Math.round(box.height)} 畫面 ${Math.round(art.width)}×${Math.round(art.height)}`,
      };
    })
    .catch(() => ({ ok: false, detail: "量不到格子" }));
  record("IG 網格鋪滿正方形", Boolean(gridCover.ok), gridCover.detail);
  const highlightId = await page.locator("[data-testid=ig-highlight-open]").first().getAttribute("data-project-id");
  record("IG 精選可點開", Boolean(highlightId), highlightId ? `精選 ${highlightId}` : "沒有精選按鈕");
  await page.locator("[data-testid=ig-highlight-open]").first().evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await page.waitForSelector("[data-testid=ig-story-viewer]", { timeout: 8000 });
  await expectText("精選打開限動", "限動預覽");
  const peekStoryId = await page.locator("[data-testid=ig-story-viewer]").getAttribute("data-story-id");
  record(
    "精選打開同一則",
    Boolean(highlightId) && peekStoryId === highlightId,
    `打開 ${peekStoryId ?? "沒有"} 精選 ${highlightId ?? "沒有"}`,
  );
  const peekPortrait = await page.evaluate(() => {
    const viewer = document.querySelector("[data-testid=ig-story-viewer]");
    const board = viewer?.querySelector('[data-ratio="9:16"]');
    const box = board?.getBoundingClientRect();
    if (!box) return { ok: false, detail: "沒有 9:16 畫面" };
    return {
      ok: box.height > box.width && box.height >= 180,
      detail: `${Math.round(box.width)}×${Math.round(box.height)}`,
    };
  });
  record("精選限動是直式", Boolean(peekPortrait.ok), peekPortrait.detail);
  await page.screenshot({ path: `${prefix}-ig-highlight-viewer.png` });
  await page.getByTestId("ig-peek-close").evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await page.waitForSelector("[data-testid=ig-peek]", { state: "hidden", timeout: 8000 }).catch(() => null);

  const gridPostId = await page.locator("[data-testid=ig-grid-open]").first().getAttribute("data-project-id");
  record("IG 格子可點開", Boolean(gridPostId), gridPostId ? `格子 ${gridPostId}` : "沒有格子按鈕");
  await page.locator("[data-testid=ig-grid-open]").first().evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await page.waitForSelector("[data-testid=ig-post-viewer]", { timeout: 8000 });
  await expectText("格子打開貼文", "動態預覽");
  const peekPostId = await page.locator("[data-testid=ig-post-viewer]").getAttribute("data-post-id");
  record(
    "格子打開同一則",
    Boolean(gridPostId) && peekPostId === gridPostId,
    `打開 ${peekPostId ?? "沒有"} 格子 ${gridPostId ?? "沒有"}`,
  );
  const peekFeed = await page.evaluate(() => {
    const viewer = document.querySelector("[data-testid=ig-post-viewer]");
    const board = viewer?.querySelector("[data-ratio]");
    const box = board?.getBoundingClientRect();
    const ratio = board?.getAttribute("data-ratio") ?? "";
    if (!box) return { ok: false, detail: "沒有貼文畫面" };
    return {
      ok: (ratio === "4:5" || ratio === "1:1") && box.width >= 160,
      detail: `${ratio} ${Math.round(box.width)}×${Math.round(box.height)}`,
    };
  });
  record("格子貼文看得到畫面", Boolean(peekFeed.ok), peekFeed.detail);
  await page.screenshot({ path: `${prefix}-ig-post-viewer.png` });
  await page.getByTestId("ig-peek-close").evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await page.waitForSelector("[data-testid=ig-peek]", { state: "hidden", timeout: 8000 }).catch(() => null);

  await page.screenshot({ path: `${prefix}-ig-profile.png` });
  await page.getByTestId("ig-view-feed").evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await expectText("IG 動態預覽", "動態預覽");
  const nextPage = page.getByRole("button", { name: "下一頁" }).first();
  record("IG 輪播翻頁", (await nextPage.count()) > 0, "找不到下一頁");
  await nextPage.evaluate((el) => (el instanceof HTMLElement ? el.click() : undefined));
  await page.screenshot({ path: `${prefix}-ig-feed.png` });
  await page.getByTestId("ig-view-story").evaluate((el) =>
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
  for (const path of ["/", "/create", "/campaigns", "/calendar", "/instagram", "/search", "/connections", "/brand", "/assets", "/export"]) {
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
  await mp.setViewportSize({ width: 390, height: 844 });
  await mp.goto(`${base}/calendar`, { waitUntil: "networkidle" });
  await mp.getByRole("button", { name: "週" }).evaluate((el) =>
    el instanceof HTMLElement ? el.click() : undefined,
  );
  await mp.waitForSelector("[data-testid=calendar-week]", { timeout: 8000 });
  const weekOverflow = await mp.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  record("手機週視圖無橫向溢出", !weekOverflow, weekOverflow ? "有橫向溢出" : "");
  await mp.screenshot({ path: `${prefix}-calendar-week-mobile.png` });
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
