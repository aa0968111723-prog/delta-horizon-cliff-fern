import assert from "node:assert/strict";
import test from "node:test";
import { buildIgInsights, engagementScore, formatIgDna, formatIgInsights } from "./ig-dna.ts";
import type { RemoteItem } from "../connections/remote.ts";

test("engagementScore weights save and share above likes", () => {
  assert.ok(
    engagementScore({ likes: 10, comments: 0, saved: 2 }) >
      engagementScore({ likes: 10, comments: 0 }),
  );
  assert.ok(engagementScore({ shares: 1 }) > engagementScore({ likes: 3 }));
});

test("buildIgInsights ranks hooks from real metrics and never invents numbers", () => {
  const posts: RemoteItem[] = [
    {
      provider: "instagram",
      id: "1",
      title: "最近是不是連休息都覺得有罪惡感？",
      kind: "image",
      detail: "提問貼文",
      capturedAt: 1,
      metrics: { likes: 40, comments: 6, saved: 8 },
    },
    {
      provider: "instagram",
      id: "2",
      title: "9/24（三）晚上七點，商管 B302",
      kind: "post",
      detail: "資訊貼文",
      capturedAt: 2,
      metrics: { likes: 8, comments: 0 },
    },
  ];
  const insights = buildIgInsights(posts);
  assert.equal(insights.sampleCount, 2);
  assert.equal(insights.totalLikes, 48);
  assert.equal(insights.totalSaved, 8);
  assert.equal(insights.topPosts[0]?.title.includes("休息"), true);
  assert.ok(insights.hookWins.some((row) => row.kind === "提問"));
});

test("formatIgDna is empty without samples and never invents metrics", () => {
  const empty = formatIgDna({
    captionLength: { min: 0, max: 0, avg: 0 },
    topHashtags: [],
    topCtas: [],
    kinds: [],
    colors: [],
    hookStarts: [],
    sampleCount: 0,
  });
  assert.equal(empty, "");
  const filled = formatIgDna({
    captionLength: { min: 40, max: 90, avg: 60 },
    topHashtags: [{ tag: "#淡江大學", count: 3 }],
    topCtas: [{ cta: "來坐一下", count: 2 }],
    kinds: [{ kind: "ig-post", count: 2 }],
    colors: ["#3F9E93"],
    hookStarts: ["最近是不是連休息都覺得有罪惡感？"],
    sampleCount: 2,
  });
  assert.match(filled, /樣本 2/);
  assert.match(filled, /#淡江大學/);
  assert.match(filled, /來坐一下/);
  assert.doesNotMatch(filled, /假數據|mock/i);
});

test("empty remote posts stay empty instead of fabricating reach", () => {
  const insights = buildIgInsights([]);
  assert.equal(insights.sampleCount, 0);
  assert.equal(insights.totalReach, 0);
  assert.equal(insights.hookWins.length, 0);
  assert.equal(formatIgInsights(insights), "");
});

test("formatIgInsights only speaks when there are real metrics", () => {
  const blank = formatIgInsights(buildIgInsights([{
    provider: "instagram",
    id: "x",
    title: "沒有數字的貼文",
    kind: "image",
    detail: "",
    capturedAt: 1,
  }]));
  assert.equal(blank, "");
  const filled = formatIgInsights(
    buildIgInsights([
      {
        provider: "instagram",
        id: "1",
        title: "最近是不是連休息都覺得有罪惡感？",
        kind: "image",
        detail: "",
        capturedAt: 1,
        metrics: { likes: 40, comments: 6, saved: 8 },
      },
    ]),
  );
  assert.match(filled, /真實成效/);
  assert.match(filled, /提問/);
  assert.doesNotMatch(filled, /假數據|mock/i);
});
