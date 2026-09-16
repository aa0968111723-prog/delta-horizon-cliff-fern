import assert from "node:assert/strict";
import test from "node:test";
import { learnFromIg } from "./insights.ts";
import { nextKindAfter, offsetDaysForConvertedKind, rhythmHint } from "./rhythm.ts";
import { createPkce } from "../connect/pkce.ts";
import { canvaPreset, canvaBrief } from "../connect/canva-format.ts";
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
      source: "local",
    },
  ]);
  assert.match(learning.bestHookShape, /坐下來/);
  assert.match(learning.promptBlock, /過去表現/);
  assert.ok(learning.lessons.some((l) => l.id === "hook"));
  assert.doesNotMatch(learning.promptBlock, /Assignee|Reviewer/);
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
  assert.equal(canvaPreset("story"), "instagramStory");
  assert.equal(canvaPreset("feed-portrait"), "instagramPost");
  const brief = canvaBrief({ title: "茶會", hook: "最近是不是很久沒坐好", body: "淡水晚上", cta: "來坐一下" });
  assert.match(brief, /不要寺廟/);
  assert.doesNotMatch(brief, /誠摯邀請/);
});

test("wave drafts have no assignee and keep student hooks", () => {
  const draft = mockWaveDraft({ kind: "hero", name: "浮游禪光", schedule: "9/24 19:00", location: "淡水校園" });
  assert.equal("assignee" in draft, false);
  assert.match(draft.hook, /坐|快樂|晚上|位子/);
});

test("drive query escape quotes", () => {
  assert.equal(driveQueryEscape("禪學社's"), "禪學社\\'s");
});
