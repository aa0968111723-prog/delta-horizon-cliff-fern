import assert from "node:assert/strict";
import test from "node:test";
import { clipLines, composePosterSvg, moodFromVariation, xmlText } from "./poster.ts";

test("poster svg is valid xml with student hook text", () => {
  const svg = composePosterSvg({
    hook: "最近是不是很久沒有好好坐下來？",
    eventName: "茶會",
    schedule: "9/23 19:30",
    location: "淡江校園",
    mood: "sit",
  });
  assert.match(svg, /<svg xmlns=/);
  assert.match(svg, /最近是不是很久沒/);
  assert.equal(svg.includes("誠摯邀請"), false);
  assert.equal(/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(svg), false);
});

test("xmlText escapes markup and clipLines keep short IG lines", () => {
  assert.equal(xmlText(`a&b<c>"`), "a&amp;b&lt;c&gt;&quot;");
  assert.deepEqual(clipLines("最近是不是很久沒有好好坐下來？", 12, 2), ["最近是不是很久沒有好好坐", "下來？"]);
});

test("variations map to poster moods without inventing religious art", () => {
  assert.equal(moodFromVariation("mood"), "night");
  assert.equal(moodFromVariation("style"), "lights");
  assert.equal(moodFromVariation(undefined), "sit");
});

test("story posters use 9:16 viewBox", () => {
  const svg = composePosterSvg({
    hook: "明天這個點，燈會先亮。",
    eventName: "浮游禪光",
    width: 1080,
    height: 1920,
  });
  assert.match(svg, /viewBox="0 0 1080 1920"/);
});
