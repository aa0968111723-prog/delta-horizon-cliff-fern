import assert from "node:assert/strict";
import test from "node:test";
import { SEED_IG_POSTS } from "../creative/memory-seed.ts";
import {
  clubInsightsFromPosts,
  insightsPromptBlock,
  lastLearnFromInsights,
  lastLearnFromPosts,
  lastLearnPromptBlock,
  nextCreateFromLearn,
} from "./insights.ts";

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
  const learned = lastLearnFromPosts(SEED_IG_POSTS, "課表有了，人還在趕路。", 1);
  assert.equal(learned.hook, "課表有了，人還在趕路。");
  assert.ok(learned.mixLesson.length > 4);
  assert.ok(/茶會圍坐|龜|黃昏/.test(learned.visualLesson ?? ""));
  assert.equal(learned.at, 1);
  const nextBlock = lastLearnPromptBlock(learned);
  assert.ok(nextBlock.includes("不要重複同一句"));
  assert.ok(nextBlock.includes("課表有了"));
  assert.ok(nextBlock.includes("畫面") || /停/.test(nextBlock));
  const nextQuery = nextCreateFromLearn(learned);
  assert.ok(nextQuery.startsWith("下一篇不要重複"));
  assert.equal(nextQuery.includes("年輕人"), false);
  assert.ok(/畫面|停/.test(nextQuery));
  const fromThisPost = lastLearnFromPosts(SEED_IG_POSTS, "淡江大學禪學社誠摯邀請您", 2, {
    caption: "淡江大學禪學社誠摯邀請您蒞臨本週活動。",
    mediaType: "image",
  });
  assert.ok(/生活|官方/.test(fromThisPost.hookLesson));
});

test("insights lastLearn follows the highest-save post, not the newest invite", () => {
  const learned = lastLearnFromInsights(SEED_IG_POSTS, 9);
  assert.ok(/期末|休息/.test(learned.hook));
  assert.equal(learned.hook.includes("誠摯邀請"), false);
  assert.equal(learned.at, 9);
  assert.ok(learned.visualLesson);
});

test("posts without analysis still teach a visual after annotate", () => {
  const learned = lastLearnFromInsights([
    {
      id: "ig_live",
      source: "instagram",
      mediaType: "image",
      caption: "龜龜今天也在圖書館前發呆。",
      takenAt: 1,
      assetIds: [],
      saves: 90,
      comments: 4,
    },
  ]);
  assert.ok(/龜/.test(learned.hook + (learned.visualLesson ?? "")));
});

test("too many event ads produces a mix warning", () => {
  const insights = clubInsightsFromPosts([
    { caption: "淡江大學禪學社誠摯邀請報名本週活動。", saves: 2, comments: 0, mediaType: "image" },
    { caption: "招生進行中，報名連結在這。", saves: 1, comments: 0, mediaType: "image" },
    { caption: "本週活動敬邀蒞臨。", saves: 1, comments: 0, mediaType: "image" },
  ]);
  assert.ok(/招生|廣告/.test(insights.mixLesson));
});
