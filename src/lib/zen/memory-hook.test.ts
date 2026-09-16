import assert from "node:assert/strict";
import test from "node:test";
import { composeMemoryHint, hookFromMemoryHint } from "./memory-hook.ts";

test("composeMemoryHint keeps the learned hook even when brand memory is long", () => {
  const prefix = `品牌記憶：${"霧園靜水琥珀龜龜三色光淡水夜晚".repeat(40)}`;
  const hint = composeMemoryHint(
    [prefix, "過去表現較好的 Hook：「大學生活很自由，但你最近真的有比較快樂嗎？」收藏 22"],
    800,
  );
  assert.match(hint, /^過去表現較好的 Hook：「大學生活很自由，但你最近真的有比較快樂嗎？」/);
  assert.match(hint, /收藏 22/);
  assert.equal(hookFromMemoryHint(hint), "大學生活很自由，但你最近真的有比較快樂嗎？");
  assert.ok(hint.length <= 800);
});
