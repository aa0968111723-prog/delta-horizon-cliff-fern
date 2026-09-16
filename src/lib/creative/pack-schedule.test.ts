import assert from "node:assert/strict";
import test from "node:test";
import {
  annotateWavesFromPack,
  captionForPackKind,
  remainingPackKinds,
  topicForPackKind,
} from "./pack-schedule.ts";
import { suggestWaves } from "./schedule.ts";

const pack = {
  plan: {
    hook: "最近是不是很久沒坐好？",
    campaignName: "下週茶會",
    cta: "晚上來坐一下",
    insight: "課表有了，人還在趕路",
    body: "燈光、熱茶、坐著就好。\n不用先懂禪。",
    subhead: "9/23 19:30 圖書館前",
  },
  conversions: {
    threads: "最近是不是連休息都有罪惡感？\n圖書館前，帶一個朋友。",
    line: "【下週茶會】9/23 圖書館前",
    story: [{ headline: "今天晚上見", body: "不用自我介紹得很完整" }],
    reels: [{ caption: "0–3 先問一句" }, { caption: "熱茶" }],
  },
};

test("each format keeps its own caption instead of repeating the invite", () => {
  assert.match(captionForPackKind(pack, "threads"), /罪惡感/);
  assert.match(captionForPackKind(pack, "story"), /今天晚上見/);
  assert.match(captionForPackKind(pack, "reels"), /0–3/);
  assert.equal(topicForPackKind(pack, "carousel"), "燈光、熱茶、坐著就好。");
});

test("wave topics pick up the pack without wiping published rows", () => {
  const waves = suggestWaves(
    { type: "tea", date: "2026-09-24", name: "下週茶會", oneLiner: "帶一個朋友就好" },
    new Date("2026-09-10T12:00:00+08:00"),
  );
  waves[0] = { ...waves[0]!, status: "published", projectId: "proj_old", topic: "舊的預熱" };
  const next = annotateWavesFromPack(waves, pack);
  assert.equal(next[0]?.topic, "舊的預熱");
  assert.ok(next.some((wave) => wave.intent === "情緒共鳴" && wave.topic === pack.plan.hook));
  assert.ok(next.some((wave) => wave.intent === "當天" && wave.topic === "今天晚上見"));
});

test("already scheduled carousel is not duplicated", () => {
  const waves = suggestWaves(
    { type: "tea", date: "2026-09-24", name: "下週茶會", oneLiner: "帶一個朋友就好" },
    new Date("2026-09-10T12:00:00+08:00"),
  );
  const withCarousel = waves.map((wave) =>
    wave.contentKind === "carousel" ? { ...wave, projectId: "proj_c", status: "scheduled" as const } : wave,
  );
  const left = remainingPackKinds(withCarousel);
  assert.equal(left.includes("carousel"), false);
  assert.ok(left.includes("story"));
  assert.ok(left.includes("threads"));
});
