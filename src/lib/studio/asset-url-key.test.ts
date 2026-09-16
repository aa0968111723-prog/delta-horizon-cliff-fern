import assert from "node:assert/strict";
import test from "node:test";
import { assetUrlKey } from "./asset-url-key.ts";

test("asset url key ignores order and duplicates so Home can keep a stable search field", () => {
  assert.equal(assetUrlKey(["b", "a", "a"]), assetUrlKey(["a", "b"]));
  assert.equal(assetUrlKey([]), "");
});
