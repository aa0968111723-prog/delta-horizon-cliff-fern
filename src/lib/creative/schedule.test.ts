import assert from "node:assert/strict";
import test from "node:test";
import {
  bindScheduledWave,
  campaignNameFromTitle,
  createModeForKind,
  createSearchForCalendarItem,
  createSearchForWave,
  inferEventDate,
  isoFromMs,
  planPreviewSchedule,
  scheduledAtFor,
  suggestWaves,
} from "./schedule.ts";

test("isoFromMs uses Taipei calendar day", () => {
  const ms = Date.parse("2026-09-24T00:30:00+08:00");
  assert.equal(isoFromMs(ms), "2026-09-24");
});

test("inferEventDate reads 下週 and 9/24", () => {
  const from = new Date("2026-09-16T12:00:00+08:00");
  assert.equal(inferEventDate("下週有一場茶會", from), "2026-09-23");
  assert.equal(inferEventDate("9/24 浮游禪光", from), "2026-09-24");
});

test("IG grid titles keep the event name without the format suffix", () => {
  assert.equal(campaignNameFromTitle("下週有一場茶會 · Carousel"), "下週有一場茶會");
});

test("IG preview of a finished carousel plans the week-before slot", () => {
  const plan = planPreviewSchedule({
    project: {
      id: "proj_preview",
      name: "下週有一場茶會 · Carousel",
      status: "done",
      scheduledAt: null,
      campaignId: null,
      contentKind: "carousel",
      copy: { headline: "最近是不是很久沒坐好？", body: "帶一個朋友就好", cta: "晚上來坐一下" },
    },
    campaigns: [],
    caption: "最近是不是很久沒坐好？",
    now: new Date("2026-09-16T12:00:00+08:00"),
  });
  assert.equal(plan.action, "schedule");
  if (plan.action !== "schedule") return;
  assert.equal(plan.campaignDraft?.name, "下週有一場茶會");
  assert.equal(plan.campaignDraft?.date, "2026-09-23");
  assert.equal(plan.day, "2026-09-16");
});

test("already scheduled IG pack opens that calendar day", () => {
  const plan = planPreviewSchedule({
    project: {
      id: "proj_ready",
      name: "下週有一場茶會 · Carousel",
      status: "scheduled",
      scheduledAt: Date.parse("2026-09-16T19:00:00+08:00"),
      campaignId: "camp_tea",
      contentKind: "carousel",
      copy: { headline: "最近是不是很久沒坐好？", body: "", cta: "" },
    },
    campaigns: [{ id: "camp_tea", date: "2026-09-23", waves: [] }],
    caption: "最近是不是很久沒坐好？",
  });
  assert.equal(plan.action, "open");
  if (plan.action !== "open") return;
  assert.equal(plan.day, "2026-09-16");
  assert.equal(plan.campaignId, "camp_tea");
});

test("a finished pack that already has a date opens the calendar instead of rescheduling", () => {
  const plan = planPreviewSchedule({
    project: {
      id: "proj_float",
      name: "浮游禪光 · 主視覺 Carousel",
      status: "done",
      scheduledAt: Date.parse("2026-09-17T19:00:00+08:00"),
      campaignId: "camp_float_light",
      contentKind: "carousel",
      copy: { headline: "", body: "", cta: "" },
    },
    campaigns: [{ id: "camp_float_light", date: "2026-09-24", waves: [] }],
    caption: "最近是不是很久沒有好好坐下來？",
  });
  assert.equal(plan.action, "open");
  if (plan.action !== "open") return;
  assert.equal(plan.day, "2026-09-17");
});

test("tea campaign waves mix life and promo instead of stacking ads", () => {
  const waves = suggestWaves({
    type: "tea",
    date: "2026-09-24",
    name: "秋季茶會",
    oneLiner: "帶一個朋友就好",
  }, new Date("2026-09-10T12:00:00+08:00"));
  const intents = waves.map((w) => w.intent);
  assert.ok(intents.includes("生活") || intents.includes("情緒共鳴"));
  assert.ok(intents.includes("當天"));
  assert.ok(intents.includes("回顧"));
  assert.ok(waves.every((w) => w.scheduledAt));
  assert.ok(waves.every((w) => w.publishedAt == null));
});

test("ads-heavy mix drops stacked promo waves for a knowledge beat", () => {
  const waves = suggestWaves(
    {
      type: "tea",
      date: "2026-09-24",
      name: "秋季茶會",
      oneLiner: "帶一個朋友就好",
    },
    new Date("2026-09-10T12:00:00+08:00"),
    "最近活動廣告偏多。下一波穿插生活、互動、知識，避免 IG 看起來一直在招生。",
  );
  const intents = waves.map((w) => w.intent);
  assert.equal(intents.includes("主視覺"), false);
  assert.ok(intents.includes("知識"));
  assert.ok(intents.includes("生活") || intents.includes("情緒共鳴"));
  assert.ok(intents.includes("當天"));
});

test("carousel schedule is event minus 7 Taipei days", () => {
  const noon = Date.parse("2026-09-16T12:00:00+08:00");
  const at = scheduledAtFor("carousel", "2026-09-23", noon);
  assert.equal(isoFromMs(at), "2026-09-16");
  assert.equal(isoFromMs(scheduledAtFor("story", "2026-09-23", noon)), "2026-09-22");
});

test("carousel after 19:00 Taipei moves to the next evening instead of going due", () => {
  const night = Date.parse("2026-09-16T20:30:00+08:00");
  assert.equal(isoFromMs(scheduledAtFor("carousel", "2026-09-23", night)), "2026-09-17");
  const plan = planPreviewSchedule({
    project: {
      id: "proj_night",
      name: "下週有一場茶會 · Carousel",
      status: "done",
      scheduledAt: null,
      campaignId: null,
      contentKind: "carousel",
      copy: { headline: "最近是不是很久沒坐好？", body: "帶一個朋友就好", cta: "晚上來坐一下" },
    },
    campaigns: [],
    caption: "最近是不是很久沒坐好？",
    now: new Date(night),
  });
  assert.equal(plan.action, "schedule");
  if (plan.action !== "schedule") return;
  assert.equal(plan.day, "2026-09-17");
});

test("binding a converted carousel moves 情緒共鳴 to the format date", () => {
  const campaignDate = "2026-09-23";
  const waves = suggestWaves(
    { type: "tea", date: campaignDate, name: "下週茶會", oneLiner: "很久沒坐好" },
    new Date("2026-09-16T12:00:00+08:00"),
  );
  const emotion = waves.find((w) => w.intent === "情緒共鳴");
  assert.ok(emotion);
  assert.equal(isoFromMs(emotion.scheduledAt ?? 0), "2026-09-17");
  const next = bindScheduledWave(waves, {
    kind: "carousel",
    projectId: "proj_carousel",
    scheduledAt: scheduledAtFor("carousel", campaignDate, Date.parse("2026-09-16T12:00:00+08:00")),
    topic: "最近是不是很久沒坐好",
    status: "scheduled",
    campaignDate,
  });
  const bound = next.find((w) => w.projectId === "proj_carousel");
  assert.ok(bound);
  assert.equal(bound.id, emotion.id);
  assert.equal(bound.intent, "情緒共鳴");
  assert.equal(isoFromMs(bound.scheduledAt ?? 0), "2026-09-16");
  assert.equal(bound.status, "scheduled");
});

test("binding story does not steal 當天 or 回顧", () => {
  const campaignDate = "2026-09-23";
  const waves = suggestWaves(
    { type: "tea", date: campaignDate, name: "下週茶會", oneLiner: "很久沒坐好" },
    new Date("2026-09-16T12:00:00+08:00"),
  );
  const dayOf = waves.find((w) => w.intent === "當天");
  assert.ok(dayOf);
  const next = bindScheduledWave(waves, {
    kind: "story",
    projectId: "proj_story",
    scheduledAt: scheduledAtFor("story", campaignDate, Date.parse("2026-09-16T12:00:00+08:00")),
    topic: "明天晚上見",
    status: "scheduled",
    campaignDate,
  });
  const bound = next.find((w) => w.projectId === "proj_story");
  assert.ok(bound);
  assert.equal(bound.intent, "Story");
  assert.notEqual(bound.id, dayOf.id);
  assert.equal(isoFromMs(bound.scheduledAt ?? 0), "2026-09-22");
  assert.equal(next.find((w) => w.id === dayOf.id)?.projectId, null);
});

test("empty calendar waves open create with the wave format, not the campaign desk", () => {
  const search = createSearchForCalendarItem(
    {
      title: "情緒共鳴 · 很久沒坐好",
      kind: "carousel",
      campaignId: "camp_float",
    },
    "浮游禪光",
  );
  assert.ok(search);
  assert.equal(search.go, "1");
  assert.equal(search.mode, "carousel");
  assert.equal(search.campaign, "camp_float");
  assert.match(search.q, /浮游禪光/);
  assert.match(search.q, /Carousel/);
  assert.equal(createSearchForCalendarItem({ title: "浮游禪光", kind: "event", campaignId: "camp_float" }), null);
  assert.equal(
    createSearchForCalendarItem({
      title: "已有稿",
      kind: "story",
      campaignId: "camp_float",
      projectId: "proj_1",
    }),
    null,
  );
  assert.equal(
    createSearchForCalendarItem({
      title: "情緒共鳴 · 很久沒坐好",
      kind: "ig-post",
      campaignId: "camp_float",
      status: "published",
    }),
    null,
  );
  assert.equal(createModeForKind("story"), "story");
  const waveSearch = createSearchForWave(
    { id: "camp_float", name: "浮游禪光" },
    { intent: "當天", topic: "今天晚上見", contentKind: "story" },
  );
  assert.equal(waveSearch.mode, "story");
  assert.match(waveSearch.q, /今天晚上見/);
});
