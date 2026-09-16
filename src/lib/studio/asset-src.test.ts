import assert from "node:assert/strict";
import test from "node:test";
import { resolveAssetSrc, seedSrcById } from "./asset-src.ts";

test("seedSrcById keeps public seed paths for turtle and tamsui", () => {
  const map = seedSrcById([
    { id: "asset_turtle", seedSrc: "/seed/turtle.svg" },
    { id: "asset_blob" },
  ]);
  assert.equal(map.asset_turtle, "/seed/turtle.svg");
  assert.equal(map.asset_blob, undefined);
});

test("resolveAssetSrc prefers a live blob, then the seed path", () => {
  assert.equal(resolveAssetSrc("asset_turtle", { asset_turtle: "blob:tea" }, { asset_turtle: "/seed/turtle.svg" }), "blob:tea");
  assert.equal(resolveAssetSrc("asset_turtle", {}, { asset_turtle: "/seed/turtle.svg" }), "/seed/turtle.svg");
  assert.equal(resolveAssetSrc("missing", {}, { asset_turtle: "/seed/turtle.svg" }), undefined);
  assert.equal(resolveAssetSrc(undefined, { asset_turtle: "blob:tea" }), undefined);
});
