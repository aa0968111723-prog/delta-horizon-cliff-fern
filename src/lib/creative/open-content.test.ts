import assert from "node:assert/strict";
import test from "node:test";
import { contentOpenLabel, contentOpenPlan, contentWorkKind, surfaceForContentType } from "./open-content.ts";
import type { ContentItem } from "./types.ts";

function item(type: ContentItem["type"], projectId: string | null = null): ContentItem {
  return {
    id: "c1",
    campaignId: "camp",
    title: "測試",
    angle: "角度",
    type,
    status: "idea",
    plannedAt: "2026-09-24T19:00:00+08:00",
    publishedAt: null,
    projectId,
    createdAt: 1,
    updatedAt: 1,
  };
}

test("content types map to Feed / Story / Reels / Carousel", () => {
  assert.equal(surfaceForContentType("IG Post"), "feed");
  assert.equal(surfaceForContentType("Story"), "story");
  assert.equal(surfaceForContentType("倒數"), "story");
  assert.equal(surfaceForContentType("Reels"), "reels");
  assert.equal(surfaceForContentType("Carousel"), "carousel");
  assert.equal(contentWorkKind("Threads"), "copy");
  assert.equal(contentWorkKind("IG Post"), "studio");
});

test("calendar items without a project stay in create, not a fake studio", () => {
  const plan = contentOpenPlan(item("Carousel"));
  assert.equal(plan.hasWork, false);
  assert.equal(plan.kind, "create");
  assert.equal(contentOpenLabel(plan), "開始這則網宣");
});

test("calendar items with a project open that 網宣 in studio or copy", () => {
  const visual = contentOpenPlan(item("Carousel", "proj_1"));
  assert.equal(visual.hasWork, true);
  assert.equal(visual.kind, "studio");
  assert.equal(visual.projectId, "proj_1");
  assert.equal(visual.formatId, "feed-portrait");
  assert.equal(contentOpenLabel(visual), "打開網宣");

  const copy = contentOpenPlan(item("Threads", "proj_1"));
  assert.equal(copy.kind, "copy");
  assert.equal(contentOpenLabel(copy), "打開文案");
});
