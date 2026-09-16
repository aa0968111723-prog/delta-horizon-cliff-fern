import assert from "node:assert/strict";
import test from "node:test";
import { visionFromDirection, visionFromPixels } from "./vision-local.ts";
import { proposeVisualDirections } from "../ai/image-directions.ts";

test("gold-heavy pixels flag temple risk", () => {
  const vision = visionFromPixels({
    avgR: 200,
    avgG: 170,
    avgB: 60,
    brightness: 0.55,
    saturation: 0.62,
    goldShare: 0.28,
    coolShare: 0.04,
    topBrightness: 0.5,
    bottomBrightness: 0.52,
  });
  assert.match(vision.tooReligious, /金色|廟/);
  assert.match(vision.stay, /海報|招生/);
  assert.ok(vision.next.includes("做成限動"));
});

test("dusk pixels read as Tamkang night", () => {
  const vision = visionFromPixels(
    {
      avgR: 70,
      avgG: 90,
      avgB: 120,
      brightness: 0.28,
      saturation: 0.22,
      goldShare: 0.02,
      coolShare: 0.4,
      topBrightness: 0.18,
      bottomBrightness: 0.36,
    },
    "茶會",
  );
  assert.match(vision.content, /茶|夜/);
  assert.match(vision.tooReligious, /沒有明顯宗教/);
  assert.match(vision.student, /淡江|茶會|淡水/);
});

test("visionFromDirection keeps student-first next steps", () => {
  const dir = proposeVisualDirections("我要宣傳茶會")[0]!;
  const vision = visionFromDirection(dir, "我要宣傳茶會");
  assert.equal(vision.color, dir.palette);
  assert.ok(vision.next.includes("做成 Carousel"));
});
