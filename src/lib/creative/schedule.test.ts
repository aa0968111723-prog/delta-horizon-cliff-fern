import assert from "node:assert/strict";
import test from "node:test";
import { inferEventDate, isoFromMs, suggestWaves } from "./schedule.ts";

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
