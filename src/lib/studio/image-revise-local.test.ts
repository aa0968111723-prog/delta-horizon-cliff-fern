import assert from "node:assert/strict";
import test from "node:test";
import { coverRect, frameForPreset, RATIO_PX } from "./image-revise-local.ts";

test("coverRect fills the frame without stretching", () => {
  const tall = coverRect(1080, 1350, 1080, 1080);
  assert.equal(tall.w > 1080 - 1, true);
  assert.equal(Math.abs(tall.x) < 1, true);
  assert.equal(tall.y < 0, true);

  const wide = coverRect(1200, 628, 1080, 1350);
  assert.equal(wide.h > 1350 - 1, true);
  assert.equal(wide.x < 0, true);
});

test("story-space and 9:16 keep a middle band for a headline", () => {
  const story = frameForPreset("story-space", "4:5");
  assert.ok(story.band);
  assert.equal(story.band.y > 0.3 && story.band.y < 0.45, true);
  const tall = frameForPreset("tku-life", "9:16");
  assert.ok(tall.band);
});

test("more-air uses a wider paper margin than the default", () => {
  const air = frameForPreset("more-air", "4:5");
  const life = frameForPreset("tku-life", "4:5");
  assert.equal(air.pad > life.pad, true);
  assert.equal(air.band, null);
});

test("IG ratios keep integer canvas sizes", () => {
  assert.equal(RATIO_PX["4:5"].w / RATIO_PX["4:5"].h, 1080 / 1350);
  assert.equal(RATIO_PX["1:1"].w, RATIO_PX["1:1"].h);
  assert.equal(RATIO_PX["9:16"].h > RATIO_PX["4:5"].h, true);
});
