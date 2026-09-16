import assert from "node:assert/strict";
import test from "node:test";
import { campaignIdForUpsert } from "./campaign.ts";

test("new campaigns do not keep an undefined id from the form payload", () => {
  assert.equal(campaignIdForUpsert(undefined, undefined), "");
  assert.equal(campaignIdForUpsert("camp_tea", undefined), "camp_tea");
  assert.equal(campaignIdForUpsert(undefined, "camp_from_input"), "camp_from_input");
});
