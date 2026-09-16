import assert from "node:assert/strict";
import test from "node:test";
import { publishedToMemory } from "./publish-memory.ts";
import { isPromoKind, placeScheduleItems } from "./schedule.ts";
import type { ScheduleItem } from "./types.ts";

function item(partial: Partial<ScheduleItem> & Pick<ScheduleItem, "id" | "contentKind" | "scheduledAt">): ScheduleItem {
  return {
    title: partial.title ?? partial.id,
    status: partial.status ?? "scheduled",
    publishedAt: null,
    projectId: null,
    campaignId: "camp_floating_light",
    captionPreview: partial.captionPreview ?? "最近是不是很久沒有好好坐下來？",
    ...partial,
  };
}

test("placeScheduleItems moves a second promo off an ad night", () => {
  const night = Date.parse("2026-09-16T20:00:00+08:00");
  const existing = [item({ id: "sch_wave", contentKind: "ig-post", scheduledAt: night, title: "預告" })];
  const pending = [
    item({ id: "sch_post", contentKind: "ig-post", scheduledAt: night, title: "IG Post · 浮游禪光" }),
    item({ id: "sch_story", contentKind: "story", scheduledAt: night + 86_400_000, title: "Story · 浮游禪光" }),
    item({ id: "sch_car", contentKind: "carousel", scheduledAt: night, title: "Carousel · 浮游禪光" }),
  ];
  const placed = placeScheduleItems(existing, pending);
  assert.ok(placed[0]!.scheduledAt > night);
  assert.equal(placed[1]!.scheduledAt, night + 86_400_000);
  assert.notEqual(day(placed[0]!.scheduledAt), day(placed[2]!.scheduledAt));
  assert.ok(isPromoKind("carousel"));
  assert.equal(isPromoKind("story"), false);
});

test("publishedToMemory writes IG history without fake insights", () => {
  const { post, memory } = publishedToMemory({
    now: Date.parse("2026-09-16T21:00:00+08:00"),
    campaigns: [],
    item: item({
      id: "sch_car",
      contentKind: "carousel",
      scheduledAt: Date.parse("2026-09-16T20:00:00+08:00"),
      captionPreview: "最近是不是連休息都覺得有罪惡感？\n晚上見",
      sequence: { kind: "carousel", labels: ["P1"], assetIds: ["asset_p1"], projectId: "proj" },
    }),
  });
  assert.equal(post.mediaType, "carousel");
  assert.equal(post.assetId, "asset_p1");
  assert.equal(post.reach, 0);
  assert.equal(post.saves, 0);
  assert.match(post.hook ?? "", /連休息/);
  assert.match(post.analysis ?? "", /Insights/);
  assert.equal(memory.source, "instagram");
  assert.equal(memory.thumbAssetId, "asset_p1");
});

function day(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
