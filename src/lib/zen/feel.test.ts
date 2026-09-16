import assert from "node:assert/strict";
import test from "node:test";
import { learnFromIg } from "./insights.ts";
import { metricsFromFeel } from "./feel.ts";

test("marking a tea-party post as 學生會停 beats a formal announcement", () => {
  const strong = metricsFromFeel("strong");
  const learning = learnFromIg([
    {
      id: "tea",
      caption: "大學生活很自由，但你最近真的有比較快樂嗎？",
      date: "2026-09-23",
      kind: "carousel",
      source: "local",
      feel: "strong",
      ...strong,
    },
    {
      id: "formal",
      caption: "淡江大學禪學社誠摯邀請您參加茶會。",
      date: "2026-09-10",
      kind: "post",
      saves: 4,
      likes: 20,
      comments: 1,
      source: "local",
    },
  ]);
  assert.match(learning.bestHookShape, /快樂/);
  assert.match(learning.promptBlock, /快樂/);
});
