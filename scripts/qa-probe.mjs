#!/usr/bin/env node
/** 單點探查：把某個按鈕按下去之後，實際畫面上出現了什麼。 */
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:8080";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const logs = [];
page.on("console", (m) => logs.push(`${m.type()}: ${m.text()}`));
page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));

await page.goto(`${base}/create?from=idea&seed=下週有一場茶會`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /想 3 個視覺方向/ }).click();
await page.waitForTimeout(6000);
const body = await page.locator("body").innerText();
console.log("--- has 視覺方向 section:", body.includes("先想方向，再生圖"));
console.log("--- has 配色:", body.includes("配色"));
console.log("--- has 圖片 Prompt:", body.includes("圖片 Prompt"));
console.log("--- toast text:", body.match(/(AI 回傳|沒有連上|出錯).{0,40}/g));
console.log("--- logs:", logs.slice(0, 8));
await page.screenshot({ path: "/workspace/screenshots/qa-probe.png", fullPage: true });
await browser.close();
