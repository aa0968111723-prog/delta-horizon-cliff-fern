import assert from "node:assert/strict";
import test from "node:test";
import { buildPublishedPost, captionFromProject, mediaTypeFromKind } from "./publish.ts";

test("published post becomes IG memory without reviewer fields", () => {
  const post = buildPublishedPost({
    title: "下週茶會",
    caption: "最近是不是很久沒坐好？\n9/24 圖書館前\n帶一個朋友來就好。",
    kind: "carousel",
    publishedAt: 1,
  });
  assert.equal(post.mediaType, "carousel");
  assert.equal(post.analysis?.hook.includes("誠摯邀請"), false);
  assert.ok(post.analysis?.direction.includes("Content Memory"));
  assert.ok(post.analysis?.hook.includes("很久沒坐好"));
  assert.equal(post.analysis?.visual.includes("等官方 Insights"), false);
  assert.ok(post.analysis?.studentSim);
  assert.equal("assignee" in post, false);
});

test("published posts keep the Canva visual for the next create", () => {
  const post = buildPublishedPost({
    title: "下週茶會",
    caption: "最近是不是很久沒坐好？",
    kind: "carousel",
    assetIds: ["asset_canva_1"],
    mediaUrl: "https://export.canva.com/zen.png",
    publishedAt: 2,
  });
  assert.deepEqual(post.assetIds, ["asset_canva_1"]);
  assert.equal(post.mediaUrl, "https://export.canva.com/zen.png");
});

test("captionFromProject prefers the written caption", () => {
  const text = captionFromProject({
    name: "浮游禪光",
    copy: {
      eyebrow: "",
      headline: "標題",
      subhead: "",
      body: "正文",
      cta: "晚上來坐一下",
      handle: "@tkuzen",
      caption: "課表有了，人還在趕路。",
      hashtags: ["#淡江禪學社"],
      altText: "",
    },
  });
  assert.equal(text, "課表有了，人還在趕路。");
});

test("reels kind maps to reels media", () => {
  assert.equal(mediaTypeFromKind("reels"), "reels");
  assert.equal(mediaTypeFromKind("story"), "image");
});
