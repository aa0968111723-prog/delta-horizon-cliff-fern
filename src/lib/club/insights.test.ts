import assert from "node:assert/strict";
import test from "node:test";
import { SEED_IG_POSTS } from "../creative/memory-seed.ts";
import { clubInsightsFromPosts, insightsPromptBlock } from "./insights.ts";

test("insights prefer high-save life posts over club invitations", () => {
  const insights = clubInsightsFromPosts(SEED_IG_POSTS);
  assert.equal(insights.winningHooks[0].includes("誠摯邀請"), false);
  assert.ok(insights.winningHooks.some((hook) => /期末|休息|課表/.test(hook)));
  assert.equal(insights.answers.length, 5);
  assert.ok(/寺廟金|僧袍/.test(insights.visualLesson));
  const block = insightsPromptBlock(insights);
  assert.equal(block.includes("Z 世代"), false);
  assert.ok(block.includes("Hook"));
  assert.ok(insights.avgCaption > 10);
});

test("too many event ads produces a mix warning", () => {
  const insights = clubInsightsFromPosts([
    { caption: "淡江大學禪學社誠摯邀請報名本週活動。", saves: 2, comments: 0, mediaType: "image" },
    { caption: "招生進行中，報名連結在這。", saves: 1, comments: 0, mediaType: "image" },
    { caption: "本週活動敬邀蒞臨。", saves: 1, comments: 0, mediaType: "image" },
  ]);
  assert.ok(/招生|廣告/.test(insights.mixLesson));
});
