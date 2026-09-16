import assert from "node:assert/strict";
import test from "node:test";
import { applyFlowToProject, flowActions, primaryFlowAction, statusLabel } from "./status.ts";

test("flowActions for making starts with 這則完成了", () => {
  assert.equal(primaryFlowAction("making")?.id, "done");
  assert.equal(primaryFlowAction("making")?.label, "這則完成了");
  assert.deepEqual(
    flowActions("making").map((item) => item.id),
    ["done", "scheduled", "published"],
  );
});

test("flowActions for done offers schedule then published", () => {
  assert.deepEqual(
    flowActions("done").map((item) => item.id),
    ["scheduled", "published", "making"],
  );
});

test("flowActions for scheduled and published", () => {
  assert.equal(primaryFlowAction("scheduled")?.id, "published");
  assert.equal(primaryFlowAction("published")?.id, "unpublish");
});

test("applyFlowToProject moves making → done → scheduled → published", () => {
  const now = Date.parse("2026-09-16T19:00:00");
  const making = { status: "making" as const, scheduledAt: null, publishedAt: null };
  const done = applyFlowToProject(making, "done", now);
  assert.equal(done.status, "done");
  const scheduled = applyFlowToProject(done, "scheduled", now);
  assert.equal(scheduled.status, "scheduled");
  assert.equal(scheduled.scheduledAt, now);
  const published = applyFlowToProject(scheduled, "published", now + 1000);
  assert.equal(published.status, "published");
  assert.equal(published.publishedAt, now + 1000);
  assert.equal(published.scheduledAt, now);
});

test("unpublish returns to scheduled if a time is still set", () => {
  const at = Date.parse("2026-09-16T19:00:00");
  const next = applyFlowToProject(
    { status: "published", scheduledAt: at, publishedAt: at },
    "unpublish",
    at,
  );
  assert.equal(next.status, "scheduled");
  assert.equal(statusLabel(next.status), "已排程");
});

test("unschedule clears the calendar slot", () => {
  const at = Date.parse("2026-09-16T19:00:00");
  const next = applyFlowToProject(
    { status: "scheduled", scheduledAt: at, publishedAt: null },
    "unschedule",
    at,
  );
  assert.equal(next.status, "done");
  assert.equal(next.scheduledAt, null);
});
