import assert from "node:assert/strict";
import test from "node:test";
import { analyzeIgMemoryPost } from "./ig-analyze.ts";

test("ig analysis reads the actual caption instead of a generic visual", () => {
  const tea = analyzeIgMemoryPost({
    caption: "最近是不是連休息都覺得有罪惡感？\n下週茶會，帶一個朋友來就好。留言就可以。",
    mediaType: "image",
  });
  assert.ok(tea.hook.includes("休息"));
  assert.ok(tea.visual.includes("茶"));
  assert.equal(tea.cta, "有行動");
  assert.equal(tea.hook.includes("誠摯邀請"), false);

  const formal = analyzeIgMemoryPost({
    caption: "淡江大學禪學社誠摯邀請您蒞臨本週活動。",
    mediaType: "carousel",
  });
  assert.ok(formal.improve.some((line) => /生活|官方/.test(line)));
  assert.equal(formal.cta, "弱");
  assert.ok(formal.direction.includes("Carousel"));
});
