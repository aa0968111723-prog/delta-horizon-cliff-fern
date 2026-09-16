import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
const issues = [];
const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);
const nextWeekMd = `${String(nextWeek.getMonth() + 1).padStart(2, "0")}/${String(nextWeek.getDate()).padStart(2, "0")}`;
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));

await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="home-ready"]', { timeout: 20_000 });
await page.locator('[data-testid="home-search"]').click();
await page.waitForSelector('[data-testid="creative-search-input"]', { timeout: 10_000 });
await page.locator('[data-testid="creative-search-input"]').fill("找以前晚上的茶會照片");
await page.waitForTimeout(600);
const driveCreate = page
  .locator("section")
  .filter({ hasText: "Google Drive" })
  .locator('[data-testid="search-into-create"]')
  .first();
await driveCreate.waitFor({ timeout: 10_000 });
await driveCreate.click();
await page.waitForSelector('[data-testid="source-visual"]', { timeout: 20_000 });
const source = (await page.locator('[data-testid="source-visual-label"]').innerText()) ?? "";
if (!/Google Drive/.test(source)) issues.push(`來源沒標 Google Drive: ${source}`);
if (!/茶會/.test(source)) issues.push(`來源沒帶到茶會檔: ${source}`);
const eventName = (await page.locator('[data-testid="event-name"]').inputValue()) ?? "";
if (eventName !== "茶會") issues.push(`活動名不是茶會: ${eventName}`);
await page.waitForSelector('[data-testid="event-schedule"]', { timeout: 10_000 });
const eventSchedule = (await page.locator('[data-testid="event-schedule"]').inputValue()) ?? "";
if (!new RegExp(nextWeekMd.replace("/", "\\/")).test(eventSchedule)) {
  issues.push(`歷屆茶會檔排成今天而不是下週: ${eventSchedule}（應為 ${nextWeekMd}）`);
}
await page.waitForSelector('[data-testid="found-sources"]', { timeout: 25_000 });
const found = (await page.locator('[data-testid="found-sources"]').innerText()) ?? "";
if (!/Google Drive/.test(found) || !/2025 茶會現場/.test(found)) {
  issues.push(`找到的素材沒釘選 Drive 茶會: ${found.slice(0, 180)}`);
}
if (!/已參考/.test(found)) issues.push("加入創作後來源沒有已參考");
const foundY = (await page.locator('[data-testid="found-sources"]').boundingBox())?.y ?? 0;
await page.waitForSelector('[data-testid="realize-direction"]', { timeout: 45_000 });
const dirsY = (await page.locator('[data-testid="direction-list"]').boundingBox())?.y ?? 0;
if (foundY > dirsY) issues.push("找到的素材還排在三個方向下面");
if ((await page.locator('[data-testid="event-details"]').count()) === 0) {
  issues.push("活動細節沒有收進摺疊，創作頁還像表單");
}
await page.waitForSelector('[data-testid="direction-look-a"]', { timeout: 20_000 });
const lookSrcs = await page.locator('[data-testid="direction-list"] img').evaluateAll((els) =>
  els.map((el) => el.getAttribute("src") || ""),
);
if (new Set(lookSrcs.filter(Boolean)).size < 3) {
  issues.push(`A/B/C 方向看起來一樣: ${lookSrcs.length}`);
}
if ((await page.locator('[data-testid="direction-look-b"]').count()) === 0) {
  issues.push("沒有方向 B 預覽");
}
if ((await page.locator('[data-testid="direction-look-c"]').count()) === 0) {
  issues.push("沒有方向 C 預覽");
}
const lookHasPhoto = await page.locator('[data-testid="direction-look-a"]').evaluate((el) => {
  const src = el.getAttribute("src") || "";
  try {
    return /data-source-photo/.test(decodeURIComponent(escape(atob(src.split(",")[1] || ""))));
  } catch {
    return false;
  }
});
if (!lookHasPhoto) issues.push("方向 A 預覽沒有延續 Drive 照片");
await page.locator('[data-testid="realize-direction"]').click();
await page.waitForSelector('[data-testid="kit-ready"]', { timeout: 60_000 });
const heroSource = (await page.locator('[data-testid="hero-visual-source"]').innerText()) ?? "";
if (!/Google Drive/.test(heroSource) || !/2025 茶會現場/.test(heroSource)) {
  issues.push(`主視覺來源還寫空白海報: ${heroSource}`);
}
await page.waitForSelector('[data-testid="carousel-page-0"]', { timeout: 90_000 });
await page.waitForSelector('[data-testid="story-frame-0"]', { timeout: 30_000 });
if ((await page.locator('[data-testid="kit-piece"]').count()) > 0) {
  issues.push("Drive 茶會被做成一篇而不是活動");
}
const kitName = (await page.locator('[data-testid="kit-campaign-name"]').innerText()) ?? "";
if (!/已建立 茶會/.test(kitName)) issues.push(`kit 不是茶會活動: ${kitName}`);
if (!/預熱/.test(kitName)) issues.push(`短宣傳期沒有預熱: ${kitName}`);
const visualSource = (await page.locator('[data-testid="kit-visual-source"]').innerText()) ?? "";
if (!/Google Drive/.test(visualSource) || !/2025 茶會現場/.test(visualSource)) {
  issues.push(`主視覺沒有延續 Drive 茶會照片: ${visualSource}`);
}
const waveCaps = await page.locator('[data-testid="wave-caption"]').allInnerTexts();
if (!waveCaps.some((text) => /罪惡感/.test(text))) {
  issues.push(`宣傳節奏沒有預熱生活文案: ${waveCaps.join(" / ").slice(0, 180)}`);
}
await page.screenshot({ path: "/workspace/screenshots/search-into-create.png", fullPage: true });
await page.locator('[data-testid="kit-calendar"]').click();
await page.waitForSelector('[data-testid="calendar-ready"]', { timeout: 20_000 });
await page.waitForSelector('[data-testid="calendar-agenda"]', { timeout: 10_000 });
const agenda = (await page.locator('[data-testid="calendar-agenda"]').innerText()) ?? "";
if (!/預熱/.test(agenda)) issues.push(`月曆沒有預熱波次: ${agenda.slice(0, 240)}`);
if (!/主視覺/.test(agenda)) issues.push(`月曆沒有主視覺波次: ${agenda.slice(0, 240)}`);
if (!/Carousel/.test(agenda)) issues.push(`月曆沒有獨立 Carousel: ${agenda.slice(0, 240)}`);
const titles = await page.locator('[data-testid="agenda-title"]').allInnerTexts();
const warmupAt = titles.findIndex((text) => /^預熱/.test(text));
const heroAt = titles.findIndex((text) => /^主視覺/.test(text));
if (warmupAt < 0 || heroAt < 0) issues.push(`月曆缺預熱或主視覺標題: ${titles.slice(0, 8).join(" / ")}`);
if (warmupAt >= 0 && heroAt >= 0 && warmupAt > heroAt) {
  issues.push(`預熱排在主視覺後面: ${titles.slice(0, 8).join(" / ")}`);
}
if (titles.some((text) => /^IG Post/.test(text)) && titles.some((text) => /^主視覺/.test(text))) {
  issues.push(`月曆同時有主視覺和 IG Post，同一篇活動廣告疊了兩則: ${titles.slice(0, 10).join(" / ")}`);
}
if (!/罪惡感/.test(agenda)) issues.push(`預熱還是活動廣告，沒有生活感: ${agenda.slice(0, 280)}`);
const captions = await page.locator('[data-testid="schedule-caption"]').allInnerTexts();
const warmupCaption = captions.find((text) => /罪惡感|躺平|心虛/.test(text));
const heroCaption = captions.find((text) => /可以自己來|坐好/.test(text) && !/罪惡感/.test(text));
if (!warmupCaption) issues.push("月曆沒有預熱自己的文案");
if (!heroCaption) issues.push("月曆沒有主視覺自己的文案");
if (warmupCaption && heroCaption && warmupCaption === heroCaption) {
  issues.push("預熱和主視覺還是同一篇文案");
}
const reasonAt = titles.findIndex((text) => /^參加理由/.test(text));
const threadsAt = titles.findIndex((text) => /^Threads/.test(text));
if (reasonAt >= 0 && threadsAt >= 0 && threadsAt < reasonAt) {
  issues.push(`Threads 插在參加理由前面: ${titles.slice(0, 12).join(" / ")}`);
}
const storyAt = titles.findIndex((text) => /^Story 1/.test(text));
const countdownAt = titles.findIndex((text) => /^倒數/.test(text));
if (storyAt >= 0 && countdownAt >= 0 && storyAt > countdownAt) {
  issues.push(`限動疊在倒數晚上: ${titles.slice(0, 16).join(" / ")}`);
}
const lineAt = titles.findIndex((text) => /^LINE/.test(text));
const reelsAt = titles.findIndex((text) => /^Reels/.test(text));
if (lineAt >= 0 && threadsAt >= 0 && reelsAt >= 0 && lineAt > threadsAt && lineAt < reelsAt) {
  issues.push(`LINE 插在 Threads 和 Reels 中間: ${titles.slice(0, 16).join(" / ")}`);
}
const warmupWhen = await page.locator('[data-testid="agenda-title"]').evaluateAll((nodes) => {
  const hit = nodes.find((node) => /^預熱/.test(node.textContent ?? ""));
  const when = hit?.parentElement?.querySelector('[data-testid="agenda-when"]')?.textContent ?? "";
  return when;
});
if (warmupWhen && !/20:00/.test(warmupWhen)) {
  issues.push(`月曆沒有顯示淡水晚上（預熱應為 20:00）: ${warmupWhen}`);
}
if ((await page.locator('[data-testid="agenda-shift-later"]').count()) === 0) {
  issues.push("月曆 Agenda 不能改日期（沒有後一天）");
}
await page.screenshot({ path: "/workspace/screenshots/search-into-create-calendar.png", fullPage: true });

await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="home-events"]', { timeout: 20_000 });
await page.waitForSelector('[data-testid="home-recommend"]', { timeout: 20_000 });
const recommendName = (await page.locator('[data-testid="home-recommend-name"]').innerText()) ?? "";
if (!new RegExp(nextWeekMd.replace("/", "\\/")).test(recommendName) || !/茶會/.test(recommendName)) {
  issues.push(`今天推薦不是下週茶會: ${recommendName}（應含 ${nextWeekMd}）`);
}
const recommendDays = (await page.locator('[data-testid="home-recommend-days"]').innerText()) ?? "";
if (/還有 0 天/.test(recommendDays)) issues.push(`今天推薦還寫還有 0 天: ${recommendDays}`);
if (!/還有 [1-9]\d* 天/.test(recommendDays)) issues.push(`今天推薦沒有倒數天數: ${recommendDays}`);
const eventNames = await page.locator('[data-testid="home-event-name"]').allInnerTexts();
if (!eventNames.some((name) => name.includes("茶會"))) issues.push(`近期活動沒有茶會: ${eventNames.join(" / ")}`);
if (eventNames.some((name) => /2025 茶會現場/.test(name))) issues.push(`近期活動把 Drive 檔名當活動: ${eventNames.join(" / ")}`);
if (eventNames.some((name) => /[？?]/.test(name))) issues.push(`近期活動把 Hook 當活動: ${eventNames.join(" / ")}`);
const scheduledTitles = await page.locator('[data-testid="home-scheduled-title"]').allInnerTexts();
if (!scheduledTitles.some((name) => /^預熱/.test(name))) {
  issues.push(`首頁已排程沒有預熱: ${scheduledTitles.join(" / ")}`);
}
if (
  scheduledTitles[0] &&
  /^(IG Post|主視覺)/.test(scheduledTitles[0]) &&
  scheduledTitles.some((name) => /^預熱/.test(name))
) {
  issues.push(`首頁已排程開頭還是活動廣告: ${scheduledTitles.join(" / ")}`);
}
if (scheduledTitles.some((name) => /^IG Post/.test(name)) && scheduledTitles.some((name) => /^主視覺/.test(name))) {
  issues.push(`首頁已排程同時有主視覺和 IG Post: ${scheduledTitles.join(" / ")}`);
}
await page.screenshot({ path: "/workspace/screenshots/search-into-create-home.png", fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="home-events"]', { timeout: 20_000 });
const mobileNames = await page.locator('[data-testid="home-event-name"]').allInnerTexts();
if (!mobileNames.some((name) => name.includes("茶會"))) issues.push(`390 近期活動沒有茶會: ${mobileNames.join(" / ")}`);
if (mobileNames.some((name) => /[？?]/.test(name))) issues.push(`390 近期活動把 Hook 當活動: ${mobileNames.join(" / ")}`);
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
);
if (overflow) issues.push("390/home overflow after search-into-create");
const fabInsp = await page.evaluate(() => {
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
if (fabInsp !== "ok") issues.push(`390 今日靈感被 FAB 擋住: ${fabInsp}`);
const inspSection = await page.evaluate(() => {
  const fab = document.querySelector('[data-testid="mobile-create-fab"]');
  const section = document.querySelector('[data-testid="home-inspiration"]');
  if (!fab || !section) return "missing";
  const a = fab.getBoundingClientRect();
  const b = section.getBoundingClientRect();
  const hit = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  return hit ? "section-under-fab" : "ok";
});
if (inspSection !== "ok") issues.push(`390 今日靈感區塊被 FAB 擋住: ${inspSection}`);
await page.screenshot({ path: "/workspace/screenshots/search-into-create-390.png", fullPage: true });

if (errors.length) issues.push(`pageerror ${errors.join(" | ")}`);
await browser.close();
if (issues.length) {
  console.error(JSON.stringify({ ok: false, issues, source, eventName, found: found.slice(0, 200) }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, source, eventName }));
