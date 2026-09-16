import assert from "node:assert/strict";
import test from "node:test";
import { buildCampaignRhythm, convertedScheduleInput, offsetDaysForKind, scheduleDraftsFromCampaign } from "./schedule.ts";

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

test("short lead compresses into a dense sequence", () => {
  const waves = buildCampaignRhythm({ eventDate: "2026-09-20", eventType: "社課", leadDays: 3 });
  assert.ok(waves.length <= 6);
  assert.ok(waves.some((w) => w.purpose === "countdown" || w.purpose === "dayof"));
});
