import assert from "node:assert/strict";
import test from "node:test";
import { attachStoryAssets, countdownStillLine, isCountdownStillItem, storyFrameLines, storyPosterInput, storyRowsForFrames } from "./story-frames.ts";
import { directionPosterSvg } from "./poster.ts";

test("tea-party stories are 3–5 student frames, first is the hook", () => {
  const frames = storyFrameLines({
    hook: "可以自己來？",
    campaignName: "茶會",
    subhead: "9/24 19:00 · 淡水校園",
    cta: "來坐一下",
    storyFrames: ["可以自己來？", "茶會", "9/24 19:00 淡水校園", "來坐一下"],
  });
  assert.ok(frames.length >= 3 && frames.length <= 5);
  assert.equal(frames[0], "可以自己來？");
  assert.match(frames.join("\n"), /19:00|淡水/);
  assert.doesNotMatch(frames.join("\n"), /誠摯邀請|負責人/);
});

test("story posters are 9:16 and keep the frame line, not a temple poster", () => {
  const input = storyPosterInput("可以自己來？", 0, { eventName: "茶會" });
  assert.equal(input.width, 1080);
  assert.equal(input.height, 1920);
  const svg = directionPosterSvg(input);
  assert.match(svg, /可以自己來/);
  assert.match(svg, /height="1920"/);
  assert.match(svg, /data-turtle="龜龜"/);
  assert.doesNotMatch(svg, /temple|寺廟/);
});

test("attachStoryAssets writes stills onto that campaign's Story rows in order", () => {
  const next = attachStoryAssets(
    [
      { kind: "carousel", campaignId: "c1", imageAssetId: "hero" },
      { kind: "story", campaignId: "c1" },
      { kind: "story", campaignId: "c1" },
      { kind: "story", campaignId: "c2" },
    ],
    ["s0", "s1"],
    "c1",
  );
  assert.equal(next[0]?.imageAssetId, "hero");
  assert.equal(next[1]?.imageAssetId, "s0");
  assert.equal(next[2]?.imageAssetId, "s1");
  assert.equal(next[3]?.imageAssetId, undefined);
});

test("storyRowsForFrames reuse existing story ids so realize does not duplicate", () => {
  const rows = storyRowsForFrames(
    [
      { id: "a", kind: "story", campaignId: "c1", scheduledAt: 2 },
      { id: "b", kind: "story", campaignId: "c1", scheduledAt: 1 },
    ],
    ["hook", "時間"],
    "c1",
  );
  assert.equal(rows[0]?.existingId, "b");
  assert.equal(rows[1]?.existingId, "a");
});

test("storyRowsForFrames skip 當日提醒 so converted frames stay their own 9:16 stills", () => {
  const rows = storyRowsForFrames(
    [
      { id: "day", kind: "story", campaignId: "c1", scheduledAt: 1, title: "當日提醒 · 茶會" },
      { id: "s1", kind: "story", campaignId: "c1", scheduledAt: 2, title: "Story 1 · 茶會" },
    ],
    ["可以自己來？", "來坐一下"],
    "c1",
  );
  assert.equal(rows[0]?.existingId, "s1");
  assert.equal(rows[1]?.existingId, undefined);
});

test("countdown and 當日提醒 are the 9:16 stills that are not converted Story frames", () => {
  assert.equal(isCountdownStillItem({ kind: "countdown", title: "倒數 · 茶會" }), true);
  assert.equal(isCountdownStillItem({ kind: "story", title: "當日提醒 · 茶會" }), true);
  assert.equal(isCountdownStillItem({ kind: "story", title: "Story 1 · 茶會" }), false);
  assert.equal(isCountdownStillItem({ kind: "carousel", title: "Carousel · 茶會" }), false);
});

test("countdown stills stay short and local, not a club invitation", () => {
  assert.equal(countdownStillLine({ kind: "countdown", title: "倒數 · 茶會" }), "明天晚上，淡水。");
  assert.equal(countdownStillLine({ kind: "story", title: "當日提醒 · 茶會" }), "今晚有位子。");
  assert.doesNotMatch(countdownStillLine({ kind: "countdown" }), /誠摯邀請|負責人/);
});
