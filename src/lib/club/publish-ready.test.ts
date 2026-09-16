import assert from "node:assert/strict";
import test from "node:test";
import { lastPackFromPlan, needsPublicRaster, withPublicRaster } from "./last-pack.ts";

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
