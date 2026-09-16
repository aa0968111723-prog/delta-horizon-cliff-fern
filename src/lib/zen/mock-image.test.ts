import assert from "node:assert/strict";
import test from "node:test";
import { mockStudioSvg } from "./mock-image.ts";

test("mockStudioSvg draws a tea-night poster without temple language", () => {
  const svg = mockStudioSvg({
    prompt: "我要宣傳茶會",
    aspect: "4:5",
    headline: "來坐一下\n不用先懂禪",
    subhead: "茶會",
  });
  assert.match(svg, /viewBox="0 0 1080 1350"/);
  assert.match(svg, /來坐一下/);
  assert.match(svg, /不用先懂禪/);
  assert.match(svg, /#7ec8c3/);
  assert.match(svg, /#e8a060/);
  assert.doesNotMatch(svg, /Buddha|temple|incense|誠摯邀請/i);
});

test("mockStudioSvg uses story proportions for 9:16", () => {
  const svg = mockStudioSvg({ prompt: "浮游禪光", aspect: "9:16", headline: "今晚有燈" });
  assert.match(svg, /viewBox="0 0 1080 1920"/);
  assert.match(svg, /今晚有燈/);
});
