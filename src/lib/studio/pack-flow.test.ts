import assert from "node:assert/strict";
import test from "node:test";
import { applyFlowToPack, packFlowActions } from "./pack-flow.ts";

test("packFlowActions asks to finish making members", () => {
  const actions = packFlowActions([{ status: "making" }, { status: "done" }]).map((item) => item.id);
  assert.deepEqual(actions, ["done", "scheduled", "published"]);
  assert.equal(packFlowActions([{ status: "making" }, { status: "done" }])[0]?.label, "這套完成了");
});

test("packFlowActions for an all-done pack skips 這套完成了", () => {
  assert.deepEqual(
    packFlowActions([{ status: "done" }, { status: "done" }]).map((item) => item.id),
    ["scheduled", "published"],
  );
});

test("packFlowActions for an all-published pack offers unpublish", () => {
  const actions = packFlowActions([{ status: "published" }, { status: "published" }]);
  assert.equal(actions[0]?.id, "unpublish");
  assert.equal(actions[0]?.label, "這套還沒發");
});

test("applyFlowToPack marks every member done except already published", () => {
  const at = Date.parse("2026-09-16T19:00:00");
  const next = applyFlowToPack(
    [
      { id: "a", status: "making", scheduledAt: null, publishedAt: null },
      { id: "b", status: "done", scheduledAt: null, publishedAt: null },
      { id: "c", status: "published", scheduledAt: at, publishedAt: at },
    ],
    "done",
    at,
  );
  assert.equal(next.find((item) => item.id === "a")?.status, "done");
  assert.equal(next.find((item) => item.id === "b")?.status, "done");
  assert.equal(next.find((item) => item.id === "c")?.status, "published");
});

test("applyFlowToPack schedules the whole pack to the same stamp", () => {
  const at = Date.parse("2026-09-16T19:00:00");
  const next = applyFlowToPack(
    [
      { id: "a", status: "done", scheduledAt: null, publishedAt: null },
      { id: "b", status: "making", scheduledAt: null, publishedAt: null },
    ],
    "scheduled",
    at,
  );
  assert.equal(next[0]?.status, "scheduled");
  assert.equal(next[0]?.scheduledAt, at);
  assert.equal(next[1]?.scheduledAt, at);
});
