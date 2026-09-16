import assert from "node:assert/strict";
import test from "node:test";
import { bindScheduledWave, inferEventDate, isoFromMs, scheduledAtFor, suggestWaves } from "./schedule.ts";

test("isoFromMs uses Taipei calendar day", () => {
  const ms = Date.parse("2026-09-24T00:30:00+08:00");
  assert.equal(isoFromMs(ms), "2026-09-24");
});

test("inferEventDate reads 下週 and 9/24", () => {
  const from = new Date("2026-09-16T12:00:00+08:00");
  assert.equal(inferEventDate("下週有一場茶會", from), "2026-09-23");
  assert.equal(inferEventDate("9/24 浮游禪光", from), "2026-09-24");
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

test("carousel schedule is event minus 7 Taipei days", () => {
  const at = scheduledAtFor("carousel", "2026-09-23");
  assert.equal(isoFromMs(at), "2026-09-16");
  assert.equal(isoFromMs(scheduledAtFor("story", "2026-09-23")), "2026-09-22");
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
    scheduledAt: scheduledAtFor("carousel", campaignDate),
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
    scheduledAt: scheduledAtFor("story", campaignDate),
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
