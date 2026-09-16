import assert from "node:assert/strict";
import test from "node:test";
import { soonestScheduled } from "./schedule.ts";

test("soonestScheduled surfaces the next tea-party IG post, not a later LINE draft", () => {
  const items = [
    { id: "line", status: "scheduled", scheduledAt: 90, title: "LINE · 茶會" },
    { id: "ig", status: "scheduled", scheduledAt: 10, title: "IG Post · 茶會", imageAssetId: "asset_hero" },
    { id: "old", status: "published", scheduledAt: 1, title: "已發" },
    { id: "carousel", status: "scheduled", scheduledAt: 20, title: "Carousel · 茶會", imageAssetId: "asset_hero" },
  ];
  const next = soonestScheduled(items, 2);
  assert.deepEqual(
    next.map((item) => item.id),
    ["ig", "carousel"],
  );
});
