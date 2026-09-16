import assert from "node:assert/strict";
import test from "node:test";
import { looksEnglish, preferChinese, withClubImageScene } from "./zh.ts";

test("english campaign blurbs are rejected", () => {
  assert.equal(
    looksEnglish("Emotional IG campaign picturing a Tamkang University freshman at dusk"),
    true,
  );
  assert.equal(looksEnglish("最近是不是很久沒有好好坐下來？"), false);
  assert.equal(looksEnglish("IG Carousel · 淡江"), false);
});

test("studio image prompts stay in living Chinese", () => {
  const prompt = withClubImageScene("夜間茶會，同學圍坐");
  assert.ok(prompt.includes("夜間茶會"));
  assert.ok(prompt.includes("淡江"));
  assert.equal(prompt.includes("Tamkang University"), false);
  assert.equal(prompt.includes("monk robes"), false);
  assert.equal(preferChinese("cinematic IG poster of zen monks in a temple hall", "淡江夜間生活"), "淡江夜間生活");
  assert.equal(preferChinese("淡江學生坐在圖書館前", "fallback"), "淡江學生坐在圖書館前");
});
