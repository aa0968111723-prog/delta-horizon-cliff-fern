import assert from "node:assert/strict";
import test from "node:test";
import { createsScheduleRow } from "./schedule-kinds.ts";

test("做成限動 only schedules Story rows, not a Carousel week", () => {
  assert.equal(createsScheduleRow(undefined, "carousel"), true);
  assert.equal(createsScheduleRow(["story"], "story"), true);
  assert.equal(createsScheduleRow(["story"], "carousel"), false);
  assert.equal(createsScheduleRow(["story"], "reels"), false);
  assert.equal(createsScheduleRow(["story"], "line"), false);
  assert.equal(createsScheduleRow(["carousel"], "story"), false);
});
