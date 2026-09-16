import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCampaignRhythm,
  convertedScheduleDrafts,
  convertedScheduleInput,
  convertedScheduleUpserts,
  hourForPurpose,
  leadDaysUntil,
  matchingScheduleRow,
  offsetDaysForKind,
  publishableScheduleRows,
  scheduleChipLabel,
  scheduleDraftsFromCampaign,
} from "./schedule.ts";
import { rhythmMemoryFromIg, rhythmMemoryFromLessonText } from "./insights.ts";

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
  assert.match(story?.title ?? "", /倒數/);
  const match = rows.find((row) => row.id === story?.id);
  assert.match(match?.title ?? "", /倒數/);
  assert.equal(story?.plannedAt, match?.plannedAt);
  assert.ok(upserts.some((row) => row.title === "Reels · 茶會"));
  assert.ok(upserts.some((row) => row.title === "LINE · 茶會"));
  assert.ok(upserts.every((row) => row.status === "scheduled"));
  assert.equal(upserts.some((row) => row.title === "IG 貼文 · 茶會"), false);
  assert.ok(upserts.some((row) => /預熱|生活|主視覺|參加理由/.test(row.title ?? "")));
});

test("short lead compresses into a dense sequence", () => {
  const waves = buildCampaignRhythm({ eventDate: "2026-09-20", eventType: "社課", leadDays: 3 });
  assert.ok(waves.length <= 6);
  assert.ok(waves.some((w) => w.purpose === "countdown" || w.purpose === "dayof"));
});

test("next-week tea keeps hero and recap instead of dropping colliding days", () => {
  const now = Date.parse("2026-09-16T12:00:00+08:00");
  assert.equal(leadDaysUntil("2026-09-23", now), 7);
  const waves = buildCampaignRhythm({
    eventDate: "2026-09-23",
    eventType: "茶會",
    leadDays: 7,
    now,
  });
  const purposes = waves.map((w) => w.purpose);
  assert.ok(purposes.includes("tease"));
  assert.ok(purposes.includes("hero"));
  assert.ok(purposes.includes("life"));
  assert.ok(purposes.includes("recap"));
  assert.equal(waves.filter((w) => w.purpose === "hero").length, 1);
  assert.ok(waves.every((w) => !w.hook.includes("誠摯邀請您")));
});

test("IG memory rewrites the first hook and keeps recap after a strong carousel", () => {
  const memory = rhythmMemoryFromIg([
    {
      mediaType: "carousel",
      caption: "來的人比想像中多。有人問「我不會禪也可以嗎？」\n可以。",
      metrics: { reach: 2410, likes: 154, comments: 23, saves: 71 },
    },
    {
      mediaType: "image",
      caption: "龜龜今天也在。",
      metrics: { reach: 200, likes: 10, comments: 1, saves: 2 },
    },
  ]);
  assert.match(memory.learnedHook, /我不會禪也可以嗎/);
  assert.equal(memory.preferCarousel, true);
  assert.equal(memory.turtleUnderperforms, true);
  const waves = buildCampaignRhythm({
    eventDate: "2026-09-23",
    eventType: "茶會",
    leadDays: 7,
    memory,
  });
  assert.equal(waves.some((w) => w.purpose === "recap"), true);
  assert.ok(waves.some((w) => w.hook.includes("我不會禪也可以嗎")));
  assert.ok(waves.filter((w) => w.purpose === "info" || w.purpose === "emotion").every((w) => w.contentKind === "carousel"));
  assert.match(memory.note, /根據過去 IG/);
});

test("three ad captions in a row insert living content instead of another poster", () => {
  const memory = rhythmMemoryFromLessonText("一直在招生。連續活動廣告。");
  assert.equal(memory.recentAdHeavy, true);
  const waves = buildCampaignRhythm({
    eventDate: "2026-09-20",
    eventType: "社課",
    leadDays: 4,
    memory,
  });
  assert.ok(waves.some((w) => w.purpose === "life" || w.purpose === "emotion"));
  const ads = waves.filter((w) => w.purpose === "hero" || w.purpose === "info" || w.purpose === "reason");
  assert.ok(ads.length < waves.length);
});

test("life and story land at different hours so same-day chips stay readable", () => {
  assert.equal(hourForPurpose("life"), 12);
  assert.equal(hourForPurpose("countdown"), 21);
  const waves = buildCampaignRhythm({ eventDate: "2026-09-24", eventType: "浮游禪光", leadDays: 8 });
  const rows = scheduleDraftsFromCampaign(
    { id: "camp_hours", name: "浮游禪光", date: "2026-09-24", waves, projectIds: [] },
    Date.parse("2026-09-16T12:00:00+08:00"),
  );
  const hours = new Set(rows.map((row) => new Date(row.plannedAt).getHours()));
  assert.ok(hours.size >= 2);
});
