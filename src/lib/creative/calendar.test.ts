import assert from "node:assert/strict";
import test from "node:test";
import { isoDay, monthGrid, movePlannedAt, weekGrid, daysUntilLabel, calendarSurface } from "./calendar.ts";
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

test("daysUntilLabel uses the campaign date instead of a hardcoded countdown", () => {
  assert.equal(daysUntilLabel("2026-09-24", new Date("2026-09-16T08:00:00+08:00")), "還有 8 天");
  assert.equal(daysUntilLabel("2026-09-16", new Date("2026-09-16T08:00:00+08:00")), "就是今天");
  assert.equal(daysUntilLabel("2026-09-10", new Date("2026-09-16T08:00:00+08:00")), "已結束");
});

test("narrow screens use agenda or week, never the month grid", () => {
  assert.equal(calendarSurface(true, "month", "agenda"), "agenda");
  assert.equal(calendarSurface(true, "month", "week"), "week");
  assert.equal(calendarSurface(false, "month", "agenda"), "month");
});
