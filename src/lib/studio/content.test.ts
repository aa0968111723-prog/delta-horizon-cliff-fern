import assert from "node:assert/strict";
import test from "node:test";
import { migrateStatus } from "./content.ts";

test("legacy project statuses map to the five creative states", () => {
  assert.equal(migrateStatus("draft"), "creating");
  assert.equal(migrateStatus("ready"), "done");
  assert.equal(migrateStatus("exported"), "published");
  assert.equal(migrateStatus("idea"), "idea");
  assert.equal(migrateStatus("scheduled"), "scheduled");
});
