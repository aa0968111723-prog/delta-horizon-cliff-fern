import assert from "node:assert/strict";
import test from "node:test";
import { looksEnglish } from "./zh.ts";

test("english campaign blurbs are rejected", () => {
  assert.equal(
    looksEnglish("Emotional IG campaign picturing a Tamkang University freshman at dusk"),
    true,
  );
  assert.equal(looksEnglish("最近是不是很久沒有好好坐下來？"), false);
  assert.equal(looksEnglish("IG Carousel · 淡江"), false);
});
