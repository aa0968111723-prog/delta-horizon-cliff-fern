import assert from "node:assert/strict";
import test from "node:test";
import { academicPhase, daysUntil, formatDaysUntil, isoTaipei, studentContext } from "./season.ts";

test("mid-September is orientation for Tamkang", () => {
  assert.equal(academicPhase(new Date("2026-09-16T12:00:00+08:00")), "orientation");
});

test("late November is midterm", () => {
  assert.equal(academicPhase(new Date("2026-11-12T12:00:00+08:00")), "midterm");
});

test("formatDaysUntil of 浮游禪光 from 9/16 is 8 days", () => {
  assert.equal(formatDaysUntil("2026-09-24", new Date("2026-09-16T12:00:00+08:00")), "還有 8 天");
  assert.equal(daysUntil("2026-09-24", new Date("2026-09-16T12:00:00+08:00")), 8);
});

test("isoTaipei is the Taipei calendar day", () => {
  assert.equal(isoTaipei(new Date("2026-09-16T12:00:00+08:00")), "2026-09-16");
});

test("studentContext names Tamkang students not generic youth", () => {
  const ctx = studentContext(new Date("2026-09-16T12:00:00+08:00"));
  const blob = `${ctx.phaseLabel}${ctx.calendarNote}${ctx.whoIsListening.join()}`;
  assert.match(blob, /開學|大一|淡水/);
  assert.equal(blob.includes("Z 世代"), false);
});
