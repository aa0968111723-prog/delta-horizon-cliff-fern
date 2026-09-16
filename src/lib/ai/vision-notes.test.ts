import assert from "node:assert/strict";
import test from "node:test";
import { visionPromptBlock } from "./vision-notes.ts";

test("vision notes tell the next pack to continue style, not copy the photo", () => {
  const block = visionPromptBlock({
    scene: "龜龜貼紙在茶杯旁邊，夜間三色光",
    people: "沒有清楚臉",
    color: "霧亞麻與淡水綠",
    light: "柔、不要閃光燈",
    composition: "主體偏上，下三分之一可放字",
    brandFit: "有龜龜配角，沒有寺廟金",
    studentFit: "像同學生活，會停",
    stay: "光與手比標語更能停",
    tooReligious: false,
    tooOld: false,
    tooAi: true,
    imagePrompt: "延續夜間生活感，淡江學生、三色光、IG 4:5",
  });
  assert.ok(block.includes("不要複製原圖"));
  assert.ok(block.includes("龜龜"));
  assert.ok(block.includes("更像同學拍的"));
  assert.equal(block.includes("年輕人"), false);
});
