import assert from "node:assert/strict";
import test from "node:test";
import { isoDay, monthGrid, movePlannedAt, weekGrid } from "./calendar.ts";
import type { ContentItem } from "./types.ts";

function item(id: string, plannedAt: string): ContentItem {
  return {
    id,
    campaignId: "c1",
    title: "情緒共鳴",
    angle: "先說忙亂",
    type: "IG Post",
    status: "idea",
    plannedAt,
    publishedAt: null,
    projectId: null,
    createdAt: 1,
    updatedAt: 1,
  };
}

test("month grid starts on Monday and keeps items on the matching day", () => {
  const days = monthGrid(new Date("2026-09-16T00:00:00+08:00"), [
    item("a", "2026-09-16T19:00:00+08:00"),
  ]);
  assert.equal(days[0]?.date, "2026-08-31");
  const target = days.find((day) => day.date === "2026-09-16");
  assert.equal(target?.items[0]?.id, "a");
});

test("reschedule keeps the original hour", () => {
  assert.equal(movePlannedAt("2026-09-16T19:30:00+08:00", "2026-09-18"), "2026-09-18T19:30:00+08:00");
  assert.equal(isoDay("2026-09-18T19:30:00+08:00"), "2026-09-18");
});

test("week grid always has seven days", () => {
  assert.equal(weekGrid(new Date("2026-09-16T00:00:00+08:00"), []).length, 7);
});
