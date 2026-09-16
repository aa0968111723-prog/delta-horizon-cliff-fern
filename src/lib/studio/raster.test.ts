import assert from "node:assert/strict";
import test from "node:test";
import { isIgPublishMime, needsRaster } from "./raster.ts";

test("Instagram Graph only accepts JPEG or PNG, so SVG posters must rasterize", () => {
  assert.equal(isIgPublishMime("image/png"), true);
  assert.equal(isIgPublishMime("image/jpeg"), true);
  assert.equal(isIgPublishMime("image/svg+xml"), false);
  assert.equal(needsRaster("image/svg+xml"), true);
  assert.equal(needsRaster("image/webp"), true);
  assert.equal(needsRaster("image/jpeg"), true);
  assert.equal(needsRaster("image/png"), false);
});
