import assert from "node:assert/strict";
import test from "node:test";
import {
  canvaDraftNotes,
  canvaDraftTitle,
  canvaPresetForAspect,
  canvaPresetForFormat,
  canvaPresetForKind,
} from "./canva-draft.ts";

test("canva presets follow the current IG format", () => {
  assert.equal(canvaPresetForFormat("story"), "instagramStory");
  assert.equal(canvaPresetForFormat("reels-cover"), "instagramReel");
  assert.equal(canvaPresetForFormat("feed-portrait"), "instagramPost");
  assert.equal(canvaPresetForAspect("9:16"), "instagramStory");
  assert.equal(canvaPresetForKind("reels"), "instagramReel");
});

test("canva draft title and notes keep hook plus caption", () => {
  assert.equal(canvaDraftTitle("浮游禪光", "最近是不是很久沒有好好坐下來？").includes("浮游禪光"), true);
  const notes = canvaDraftNotes({
    hook: "最近是不是很久沒有好好坐下來？",
    body: "開學之後課表很滿。",
    cta: "晚上見",
    hashtags: ["#淡江禪學社"],
  });
  assert.match(notes, /好好坐下來/);
  assert.match(notes, /晚上見/);
  assert.match(notes, /淡江禪學社/);
});
