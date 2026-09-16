import assert from "node:assert/strict";
import test from "node:test";
import { blobToDataUrl, coverFit } from "./raster.ts";

test("coverFit fills the destination without letterboxing", () => {
  const fit = coverFit(1080, 1350, 1080, 1920);
  assert.equal(fit.dw >= 1080, true);
  assert.equal(fit.dh >= 1920, true);
  assert.equal(Math.abs(fit.dx) > 0 || Math.abs(fit.dy) > 0, true);
  const square = coverFit(1080, 1080, 1080, 1080);
  assert.equal(square.dx, 0);
  assert.equal(square.dy, 0);
  assert.equal(square.dw, 1080);
  assert.equal(square.dh, 1080);
});

test("blobToDataUrl keeps a jpeg data url prefix", async () => {
  const blob = new Blob([Uint8Array.from([0xff, 0xd8, 0xff, 0x00])], { type: "image/jpeg" });
  const url = await blobToDataUrl(blob);
  assert.match(url, /^data:image\/jpeg;base64,/);
});
