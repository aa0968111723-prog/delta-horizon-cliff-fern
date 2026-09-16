import assert from "node:assert/strict";
import test from "node:test";
import { academicMoment, daysUntil } from "./season.ts";

test("mid-September is 開學適應期", () => {
  const m = academicMoment(new Date("2026-09-16T12:00:00+08:00"));
  assert.equal(m.id, "start");
  assert.match(m.label, /開學/);
});

test("daysUntil 浮游禪光 from 9/16 is 8", () => {
  assert.equal(daysUntil("2026-09-24", new Date("2026-09-16T08:00:00+08:00")), 8);
});
