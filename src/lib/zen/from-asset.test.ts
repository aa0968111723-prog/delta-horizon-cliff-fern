import assert from "node:assert/strict";
import test from "node:test";
import {
  analysisFromAsset,
  citedFromAsset,
  contentKindForLaunchAction,
  convertTargetForLaunchAction,
  formatForAsset,
  formatForLaunchAction,
  ideaFromAsset,
  LAUNCH_ACTIONS,
  launchSuccessMessage,
} from "./from-asset.ts";

const tea = {
  name: "夜晚茶會",
  tags: ["茶會", "晚上", "同學互動"],
  category: "photo",
  source: "seed",
  width: 1080,
  height: 1350,
};

test("launch actions include story carousel reels and copy", () => {
  const ids = LAUNCH_ACTIONS.map((item) => item.id).join(" ");
  assert.ok(ids.includes("story"));
  assert.ok(ids.includes("carousel"));
  assert.ok(ids.includes("reels-cover"));
  assert.ok(ids.includes("copy"));
});

test("format and content kind map from a photo action", () => {
  assert.equal(formatForLaunchAction("story"), "story");
  assert.equal(formatForLaunchAction("reels-cover"), "reels-cover");
  assert.equal(formatForLaunchAction("carousel"), "feed-portrait");
  assert.equal(formatForLaunchAction("copy"), "feed-portrait");
  assert.equal(convertTargetForLaunchAction("carousel"), "carousel");
  assert.equal(convertTargetForLaunchAction("story"), "story");
  assert.equal(convertTargetForLaunchAction("reels-cover"), "reels");
  assert.equal(contentKindForLaunchAction("carousel"), "carousel");
  assert.equal(contentKindForLaunchAction("story"), "story");
  assert.equal(contentKindForLaunchAction("copy"), "ig-post");
});

test("ideaFromAsset keeps the photo and student frame", () => {
  const idea = ideaFromAsset(tea);
  assert.ok(idea.includes("夜晚茶會"));
  assert.ok(idea.includes("茶會"));
  assert.ok(idea.includes("淡江"));
});

test("citedFromAsset never pretends seed is Drive", () => {
  const cited = citedFromAsset(tea);
  assert.equal(cited.source, "brand");
  assert.equal(cited.label, "夜晚茶會");
  const drive = citedFromAsset({ ...tea, source: "drive", name: "2025 茶會" });
  assert.equal(drive.source, "drive");
});

test("formatForAsset reads category and ratio", () => {
  assert.equal(formatForAsset(tea), "feed-portrait");
  assert.equal(formatForAsset({ category: "story", width: 1080, height: 1920 }), "story");
  assert.equal(formatForAsset({ category: "photo", width: 1080, height: 1080 }), "feed-square");
});

test("analysisFromAsset and success copy stay student-facing", () => {
  const analysis = analysisFromAsset(tea);
  assert.equal(analysis.content, "夜晚茶會");
  assert.ok(analysis.brand.includes("龜龜"));
  assert.ok(launchSuccessMessage("story").includes("IG Preview"));
  assert.ok(launchSuccessMessage("copy").includes("文案"));
});
