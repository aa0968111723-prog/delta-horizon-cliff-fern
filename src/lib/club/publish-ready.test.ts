import assert from "node:assert/strict";
import test from "node:test";
import { applyReelsClip, lastPackFromPlan, needsPublicRaster, skipRasterPrep, withPublicRaster, withReelsVideo } from "./last-pack.ts";

test("withPublicRaster stores an Imagine https url so Graph can publish", () => {
  const pack = lastPackFromPlan({
    projectId: "p",
    campaignId: "c",
    eventName: "茶會",
    plan: { hook: "最近是不是很久沒有好好坐下來？", captions: [], hashtags: [] },
    kind: "ig-post",
    updatedAt: 1,
  });
  assert.equal(needsPublicRaster(pack), true);
  const next = withPublicRaster(pack, "https://imgen.x.ai/tea.jpg");
  assert.equal(needsPublicRaster(next), false);
  assert.equal(next.formatPublicUrls?.["ig-post"], "https://imgen.x.ai/tea.jpg");
  assert.equal(withPublicRaster(pack, "data:image/svg+xml;charset=utf-8,x").formatPublicUrls?.["ig-post"], undefined);
});

test("Reels without a video still prepares a cover, and a pending clip does not count as published", () => {
  const pack = lastPackFromPlan({
    projectId: "p",
    campaignId: "c",
    eventName: "茶會",
    plan: { hook: "最近是不是很久沒有好好坐下來？", captions: [], hashtags: [] },
    kind: "reels",
    updatedAt: 1,
  });
  assert.equal(skipRasterPrep(pack), false);
  assert.equal(needsPublicRaster(pack), true);
  const covered = withPublicRaster(pack, "https://imgen.x.ai/cover.jpg");
  assert.equal(skipRasterPrep(covered), false);
  const pending = applyReelsClip(covered, { ok: true, pending: true, requestId: "job_wait" });
  assert.equal(pending.videoPending, true);
  assert.equal(skipRasterPrep(pending.pack), false);
  const ready = withReelsVideo(covered, { url: "https://imgen.x.ai/clip.mp4", requestId: "job_done" });
  assert.equal(skipRasterPrep(ready), true);
});
