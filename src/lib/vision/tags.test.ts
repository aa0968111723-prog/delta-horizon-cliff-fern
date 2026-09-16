import assert from "node:assert/strict";
import test from "node:test";
import { convertKindFromAction, ideaFromVision, isImageVisionAction, mergeAssetTags, tagsFromVision } from "./tags.ts";
import type { VisionReport } from "./analyze.ts";

const report: VisionReport = {
  content: "夜間茶會海報，三色光與留白。",
  people: "側臉與手，不是網紅姿勢。",
  color: "宣紙與苔綠，青暖玫瑰。",
  light: "柔和側光。",
  composition: "下半留給 Hook。",
  typeRatio: "字不超過三分之一。",
  hierarchy: "第一句 > 活動名 > 時間。",
  brandFeel: "可延續龜龜，不要廟宇。",
  studentFeel: "淡江晚上。",
  stayFeel: "宗教符號會滑走。",
  tooReligious: "沒有佛像。",
  tooOld: "避免過正式框。",
  tooAi: "皮膚過滑是警訊。",
  fitsTamkang: "加入捷運會更真。",
  actions: [],
  source: "mock",
};

test("vision tags pick club DNA from the report", () => {
  const tags = tagsFromVision(report, ["歷屆"]);
  assert.ok(tags.includes("茶會"));
  assert.ok(tags.includes("三色光"));
  assert.ok(tags.includes("龜龜"));
  assert.ok(mergeAssetTags(["Logo"], tags).includes("Logo"));
});

test("vision actions route to image or convert with a usable idea", () => {
  assert.equal(isImageVisionAction("similar"), true);
  assert.equal(convertKindFromAction("carousel"), "carousel");
  assert.match(ideaFromVision("carousel", report, "去年茶會"), /Carousel/);
  assert.match(ideaFromVision("continue", report, ""), /配色/);
});
