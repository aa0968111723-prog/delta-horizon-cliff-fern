import assert from "node:assert/strict";
import test from "node:test";
import { tagsFromAssetText, tagsFromVision } from "./asset-tags.ts";

test("vision tags come from the scene, not next-step actions", () => {
  const tags = tagsFromVision({
    scene: "夜間茶會，龜龜貼紙在茶杯旁邊",
    people: "同學圍坐，沒有清楚臉",
    color: "霧亞麻與淡水綠",
    light: "柔、不要閃光燈",
    studentFit: "看起來像淡江同學生活",
    tooReligious: false,
    tooOld: false,
    tooAi: false,
    next: ["延續這個風格", "做成限動", "做成 Carousel"],
  });
  assert.ok(tags.includes("茶會"));
  assert.ok(tags.includes("夜間"));
  assert.ok(tags.includes("龜龜"));
  assert.ok(tags.includes("生活感"));
  assert.equal(tags.includes("延續這個風格"), false);
  assert.equal(tags.includes("做成限動"), false);
});

test("asset tags read the name, not the first six characters", () => {
  const tags = tagsFromAssetText("浮游禪光海報.jpg", "poster", "三色光");
  assert.ok(tags.includes("浮游禪光"));
  assert.ok(tags.includes("海報"));
  assert.ok(tags.includes("三色光"));
  assert.equal(tags.includes("浮游禪"), false);
});
