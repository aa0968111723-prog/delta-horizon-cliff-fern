import assert from "node:assert/strict";
import test from "node:test";
import { analyzeIgMemoryPost, applyStudentSimToCopy } from "./ig-analyze.ts";

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

test("upcoming drafts can be analyzed from caption without a published post", () => {
  const draft = analyzeIgMemoryPost({
    caption: "大學生活很自由，但你最近真的有比較快樂嗎？\n9/24 浮游禪光，淡水校園。留言就可以。",
    mediaType: "carousel",
  });
  assert.ok(draft.hook.includes("快樂"));
  assert.ok(draft.visual.includes("光") || draft.theme.includes("光") || draft.theme.includes("夜間"));
  assert.equal(draft.cta, "有行動");
  assert.ok(draft.studentSim?.knowsWhenWhere);
});

test("student sim rewrite drops 誠摯邀請 and adds how to join", () => {
  const copy = applyStudentSimToCopy(
    {
      eyebrow: "",
      headline: "淡江大學禪學社誠摯邀請您",
      subhead: "",
      body: "本週活動敬邀蒞臨。",
      cta: "",
      handle: "@tkuzen",
      caption: "淡江大學禪學社誠摯邀請您蒞臨本週活動。",
      hashtags: ["#淡江禪學社"],
      altText: "",
    },
    analyzeIgMemoryPost({
      caption: "淡江大學禪學社誠摯邀請您蒞臨本週活動。",
      mediaType: "image",
    }).studentSim!,
    "9/24 19:30",
    "圖書館前",
  );
  assert.equal(copy.headline.includes("誠摯邀請"), false);
  assert.equal(copy.caption.includes("誠摯邀請您蒞臨"), false);
  assert.ok(/留言|連結|朋友|圖書館/.test(copy.caption));
});
