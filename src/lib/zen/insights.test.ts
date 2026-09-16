import assert from "node:assert/strict";
import test from "node:test";
import { learnFromIg } from "./insights.ts";
import { nextKindAfter, offsetDaysForConvertedKind, rhythmHint } from "./rhythm.ts";
import { createPkce } from "../connect/pkce.ts";
import { canvaBrief, canvaSize } from "../connect/canva-format.ts";
import { mockWaveDraft } from "../ai/wave-draft.ts";
import { driveQueryEscape } from "../connect/escape.ts";

test("learnFromIg prefers question hooks with higher saves", () => {
  const learning = learnFromIg([
    {
      id: "a",
      caption: "最近是不是很久沒有好好坐下來？",
      date: "2026-09-17",
      kind: "carousel",
      saves: 21,
      comments: 7,
      likes: 86,
      reach: 420,
      source: "local",
    },
    {
      id: "b",
      caption: "淡江大學禪學社 9/24 浮游禪光活動開始報名，地點在社團教室。",
      date: "2025-09-10",
      kind: "post",
      saves: 4,
      comments: 1,
      likes: 22,
      reach: 390,
      source: "local",
    },
  ]);
  assert.match(learning.bestHookShape, /坐下來/);
  assert.equal(learning.bestKind, "carousel");
  assert.match(learning.promptBlock, /過去表現/);
  assert.match(learning.promptBlock, /觸及/);
  assert.ok(learning.lessons.some((l) => l.id === "hook"));
  assert.ok(learning.lessons.some((l) => l.id === "length" || l.id === "kind"));
  assert.doesNotMatch(learning.promptBlock, /Assignee|Reviewer/);
});

test("local posts without metrics do not beat real IG saves", () => {
  const learning = learnFromIg([
    {
      id: "local",
      caption: "隨便一則還沒有效果",
      date: "2026-09-16",
      kind: "post",
      source: "local",
    },
    {
      id: "a",
      caption: "最近是不是很久沒有好好坐下來？",
      date: "2026-09-17",
      kind: "carousel",
      saves: 21,
      comments: 7,
      likes: 86,
      source: "local",
    },
  ]);
  assert.match(learning.bestHookShape, /坐下來/);
});

test("one-person 學生會停 beats a seed post with higher saves", () => {
  const learning = learnFromIg([
    {
      id: "marked",
      caption: "大學生活很自由，但你最近真的有比較快樂嗎？",
      date: "2026-09-23",
      kind: "carousel",
      source: "local",
      feel: "strong",
      saves: 8,
      likes: 20,
    },
    {
      id: "seed",
      caption: "有時候我們需要的不是答案，只是一個安靜的晚上。",
      date: "2025-12-04",
      kind: "post",
      saves: 33,
      likes: 124,
      comments: 14,
      source: "local",
    },
  ]);
  assert.match(learning.bestHookShape, /快樂/);
  assert.match(learning.promptBlock, /快樂/);
  assert.ok(learning.lessons.some((l) => l.detail.includes("學生會停")));
});

test("rhythm avoids consecutive promo ads", () => {
  assert.equal(nextKindAfter(["carousel", "ig-post"]), "member-story");
  assert.match(rhythmHint(["carousel", "poster"]), /生活|故事/);
});

test("converted formats land on different days so the grid is not all ads", () => {
  assert.equal(offsetDaysForConvertedKind("ig-post"), -7);
  assert.equal(offsetDaysForConvertedKind("carousel"), -5);
  assert.equal(offsetDaysForConvertedKind("story"), -2);
  assert.ok(offsetDaysForConvertedKind("carousel") !== offsetDaysForConvertedKind("story"));
});

test("pkce verifier is not the challenge", () => {
  const pkce = createPkce();
  assert.notEqual(pkce.verifier, pkce.challenge);
  assert.ok(pkce.verifier.length > 20);
});

test("canva presets map IG formats and brief stays zen", () => {
  assert.deepEqual(canvaSize("story"), { width: 1080, height: 1920 });
  assert.deepEqual(canvaSize("feed-portrait"), { width: 1080, height: 1350 });
  const brief = canvaBrief({ title: "茶會", hook: "最近是不是很久沒坐好", body: "淡水晚上", cta: "來坐一下" });
  assert.match(brief, /不要寺廟/);
  assert.doesNotMatch(brief, /誠摯邀請/);
});

test("wave drafts have no assignee and keep student hooks", () => {
  const draft = mockWaveDraft({ kind: "hero", name: "浮游禪光", schedule: "9/24 19:00", location: "淡水校園" });
  assert.equal("assignee" in draft, false);
  assert.match(draft.hook, /坐|快樂|晚上|位子/);
  const learned = mockWaveDraft({
    kind: "hero",
    name: "茶會",
    learnedHook: "課表排滿的時候，你還記得自己喜歡什麼嗎？",
  });
  assert.match(learned.hook, /課表排滿/);
});

test("drive query escape quotes", () => {
  assert.equal(driveQueryEscape("禪學社's"), "禪學社\\'s");
});
