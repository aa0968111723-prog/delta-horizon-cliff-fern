import assert from "node:assert/strict";
import test from "node:test";
import { dnaPromptIdea, igDnaBlock, learnFromPosts, scorePost } from "./insights.ts";
import { SEED_IG_POSTS } from "./memory.ts";
import { systemPrompt } from "./voice.ts";

test("learnFromPosts ranks high-save reels above announcement posts", () => {
  const learned = learnFromPosts(SEED_IG_POSTS);
  assert.equal(learned.winning[0]?.id, "ig_20251120");
  assert.ok(learned.winningHooks.some((h) => h.includes("淡水的晚上")));
  assert.ok(learned.losingHooks.some((h) => h.includes("本週社課")));
  assert.ok(scorePost(learned.winning[0]!) > scorePost(learned.losing[0]!));
});

test("igDnaBlock tells the model to use club IG not generic brand templates", () => {
  const block = igDnaBlock(SEED_IG_POSTS);
  assert.match(block, /IG DNA/);
  assert.match(block, /不要套一般品牌模板/);
  assert.match(block, /晚上見/);
});

test("systemPrompt injects IG DNA for copy campaign and image", () => {
  for (const kind of ["copy", "campaign", "image"] as const) {
    const prompt = systemPrompt(kind);
    assert.match(prompt, /Zen Club IG DNA/);
    assert.match(prompt, /連休息都覺得有罪惡感|淡水的晚上/);
  }
});

test("dnaPromptIdea asks for a new post not a copy", () => {
  assert.match(dnaPromptIdea(), /不要複製舊文/);
});

test("learnFromPosts compares question hooks against announcements", () => {
  const learned = learnFromPosts(SEED_IG_POSTS);
  assert.ok(learned.questionSaveRate > learned.announceSaveRate);
  assert.match(learned.whatWorks, /問句 Hook/);
  assert.match(learned.whatFails, /本週社課/);
});
