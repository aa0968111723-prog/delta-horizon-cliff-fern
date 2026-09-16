import assert from "node:assert/strict";
import test from "node:test";
import { migrateProjectStatus, STATUS_META } from "./status.ts";

test("legacy project statuses migrate into the single-user content lifecycle", () => {
  assert.equal(migrateProjectStatus("draft", false), "idea");
  assert.equal(migrateProjectStatus("draft", true), "creating");
  assert.equal(migrateProjectStatus("ready", true), "complete");
  assert.equal(migrateProjectStatus("exported", true), "complete");
  assert.equal(migrateProjectStatus("scheduled", true), "scheduled");
  assert.equal(migrateProjectStatus(undefined, false), "idea");
});

test("status labels stay in 想法／創作中／完成／已排程／已發布", () => {
  assert.deepEqual(
    Object.values(STATUS_META).map((item) => item.label),
    ["想法", "創作中", "完成", "已排程", "已發布"],
  );
});
