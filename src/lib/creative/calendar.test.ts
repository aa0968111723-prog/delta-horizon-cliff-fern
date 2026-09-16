import assert from "node:assert/strict";
import test from "node:test";
import { buildCampaignRhythm } from "./rhythm.ts";
import { isoDay, monthGrid, movePlannedAt, weekGrid, daysUntilLabel, calendarSurface, readCalendarDrag, writeCalendarDrag } from "./calendar.ts";
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

test("calendar drag payload prefers custom mime then plain text", () => {
  const store: Record<string, string> = {};
  const transfer = {
    setData: (type: string, value: string) => {
      store[type] = value;
    },
    getData: (type: string) => store[type] ?? "",
    effectAllowed: "none" as DataTransfer["effectAllowed"],
  };
  writeCalendarDrag(transfer, "item-9");
  assert.equal(readCalendarDrag(transfer), "item-9");
  delete store["text/zen-content"];
  assert.equal(readCalendarDrag(transfer), "item-9");
});

test("narrow screens use agenda or week, never the month grid", () => {
  assert.equal(calendarSurface(true, "month", "agenda"), "agenda");
  assert.equal(calendarSurface(true, "month", "week"), "week");
  assert.equal(calendarSurface(false, "month", "agenda"), "month");
});

test("campaign rhythm slots land on the calendar grid and keep their hour when moved", () => {
  const campaign = {
    id: "campaign_cal",
    name: "秋夜茶會",
    type: "茶會" as const,
    eventDate: "2026-09-24",
    eventTime: "19:00–21:00",
    location: "淡江大學",
    oneLiner: "一起喝茶、坐坐。",
    description: "",
    theme: "慢下來",
    studentPain: "期中壓力",
    cta: "找朋友一起來",
    registrationUrl: "",
    assetIds: [] as string[],
    createdAt: 0,
    updatedAt: 0,
  };
  const items = buildCampaignRhythm(campaign, new Date("2026-09-16T00:00:00+08:00"));
  const days = monthGrid(new Date("2026-09-24T00:00:00+08:00"), items);
  const occupied = days.filter((day) => day.items.length);
  assert.equal(occupied.reduce((sum, day) => sum + day.items.length, 0), items.length);
  assert.ok(occupied.length > 0);
  const first = items[0]!;
  const moved = movePlannedAt(first.plannedAt, "2026-09-18");
  assert.equal(isoDay(moved), "2026-09-18");
  const after = monthGrid(new Date("2026-09-18T00:00:00+08:00"), [{ ...first, plannedAt: moved }]);
  assert.equal(after.find((day) => day.date === "2026-09-18")?.items[0]?.id, first.id);
});
