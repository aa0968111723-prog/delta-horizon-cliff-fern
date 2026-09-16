import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCampaignRhythm,
  convertedScheduleDrafts,
  convertedScheduleInput,
  convertedScheduleUpserts,
  matchingScheduleRow,
  offsetDaysForKind,
  publishableScheduleRows,
  scheduleChipLabel,
  scheduleDraftsFromCampaign,
} from "./schedule.ts";

test("tea ceremony rhythm is not a wall of ads", () => {
  const waves = buildCampaignRhythm({ eventDate: "2026-09-24", eventType: "浮游禪光", leadDays: 10 });
  assert.ok(waves.length >= 6);
  const purposes = waves.map((w) => w.purpose);
  assert.ok(purposes.includes("life") || purposes.includes("emotion"));
  assert.ok(purposes.includes("recap"));
  const ads = purposes.filter((p) => p === "hero" || p === "info" || p === "reason");
  assert.ok(ads.length < purposes.length, "rhythm should mix life/interact/knowledge");
  assert.ok(waves.every((w) => !w.hook.includes("誠摯邀請您")));
});

test("schedule drafts attach the campaign project and mark future waves scheduled", () => {
  const waves = buildCampaignRhythm({ eventDate: "2026-09-24", eventType: "茶會", leadDays: 8 });
  const rows = scheduleDraftsFromCampaign(
    { id: "camp_tea", name: "茶會", date: "2026-09-24", waves, projectIds: ["proj_tea"] },
    Date.parse("2026-09-16T12:00:00+08:00"),
  );
  assert.ok(rows.every((row) => row.projectId === "proj_tea"));
  assert.ok(rows.some((row) => row.status === "scheduled"));
  assert.ok(rows.every((row) => row.status === "scheduled" || row.status === "idea"));
  assert.equal(rows.some((row) => row.status === "published"), false);
});

test("converted story lands the night before the event", () => {
  assert.equal(offsetDaysForKind("story"), -1);
  assert.equal(offsetDaysForKind("reels"), -2);
  const row = convertedScheduleInput({
    eventDate: "2026-09-24",
    eventName: "茶會",
    kind: "story",
    hook: "明天這個點，燈會先亮。",
    campaignId: "camp_tea",
    projectId: "proj_tea",
  });
  assert.equal(row.title, "Story · 茶會");
  assert.equal(row.status, "scheduled");
  assert.equal(row.contentKind, "story");
  assert.equal(new Date(row.plannedAt).getDate(), 23);
});

test("converted story reuses the countdown slot, not the day-of story", () => {
  const waves = buildCampaignRhythm({ eventDate: "2026-09-24", eventType: "茶會", leadDays: 8 });
  const rows = scheduleDraftsFromCampaign(
    { id: "camp_tea", name: "茶會", date: "2026-09-24", waves, projectIds: ["proj_tea"] },
    Date.parse("2026-09-16T12:00:00+08:00"),
  );
  const converted = convertedScheduleInput({
    eventDate: "2026-09-24",
    eventName: "茶會",
    kind: "story",
    campaignId: "camp_tea",
    projectId: "proj_tea",
  });
  const match = matchingScheduleRow(rows, {
    campaignId: "camp_tea",
    kind: "story",
    plannedAt: converted.plannedAt,
  });
  assert.ok(match);
  assert.match(match.title, /倒數/);
  assert.ok(rows.filter((row) => row.contentKind === "story").length >= 2);
  const dayOf = rows.find((row) => row.title.includes("當日"));
  assert.ok(dayOf);
  assert.notEqual(match.title, dayOf?.title);
});

test("chip label does not double the format name", () => {
  assert.equal(scheduleChipLabel({ contentKind: "story", title: "Story · 浮游禪光" }), "Story · 浮游禪光");
  assert.equal(scheduleChipLabel({ contentKind: "story", title: "當日 · 浮游禪光" }), "Story 當日 · 浮游禪光");
});

test("all converted formats land on distinct days around the event", () => {
  const drafts = convertedScheduleDrafts({
    eventDate: "2026-09-24",
    eventName: "茶會",
    kinds: ["ig-post", "carousel", "story", "threads", "line", "reels"],
    campaignId: "camp_tea",
    projectId: "proj_tea",
  });
  assert.equal(drafts.length, 6);
  const days = new Set(drafts.map((row) => new Date(row.plannedAt).getDate()));
  assert.equal(days.size, 6);
  assert.ok(drafts.some((row) => row.title === "Reels · 茶會"));
});

test("floating-light tease is publishable on the matching day", () => {
  const waves = buildCampaignRhythm({ eventDate: "2026-09-24", eventType: "浮游禪光", leadDays: 8 });
  const rows = scheduleDraftsFromCampaign(
    { id: "camp_floating_light", name: "浮游禪光", date: "2026-09-24", waves, projectIds: ["proj_floating_light"] },
    Date.parse("2026-09-16T12:00:00+08:00"),
  );
  const due = publishableScheduleRows(rows, Date.parse("2026-09-16T12:00:00+08:00"));
  assert.ok(due.some((row) => row.title.includes("浮游禪光")));
  assert.ok(due.some((row) => row.title.includes("預熱")));
  assert.equal(due.some((row) => row.title.includes("回顧")), false);
});

test("auto-scheduling converted formats reuses the same-day wave slot", () => {
  const waves = buildCampaignRhythm({ eventDate: "2026-09-24", eventType: "茶會", leadDays: 8 });
  const rows = scheduleDraftsFromCampaign(
    { id: "camp_tea", name: "茶會", date: "2026-09-24", waves, projectIds: ["proj_tea"] },
    Date.parse("2026-09-16T12:00:00+08:00"),
  ).map((row, index) => ({ ...row, id: `sch_${index}` }));
  const upserts = convertedScheduleUpserts(rows, {
    eventDate: "2026-09-24",
    eventName: "茶會",
    kinds: ["ig-post", "carousel", "story", "threads", "line", "reels"],
    campaignId: "camp_tea",
    projectId: "proj_tea",
  });
  assert.equal(upserts.length, 6);
  const story = upserts.find((row) => row.contentKind === "story");
  assert.ok(story?.id);
  const match = rows.find((row) => row.id === story?.id);
  assert.match(match?.title ?? "", /倒數/);
  assert.ok(upserts.some((row) => row.title === "Reels · 茶會"));
  assert.ok(upserts.some((row) => row.title === "LINE · 茶會"));
  assert.ok(upserts.every((row) => row.status === "scheduled"));
});

test("short lead compresses into a dense sequence", () => {
  const waves = buildCampaignRhythm({ eventDate: "2026-09-20", eventType: "社課", leadDays: 3 });
  assert.ok(waves.length <= 6);
  assert.ok(waves.some((w) => w.purpose === "countdown" || w.purpose === "dayof"));
});
