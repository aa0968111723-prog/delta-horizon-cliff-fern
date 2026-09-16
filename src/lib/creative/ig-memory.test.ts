import assert from "node:assert/strict";
import test from "node:test";
import { mergeIgPosts, prepareIgIngest } from "./ig-memory.ts";
import type { IgMemoryPost } from "./types.ts";

const local: IgMemoryPost = {
  id: "pub_1",
  source: "seed",
  mediaType: "image",
  caption: "最近是不是很久沒有好好坐下來？\n9/24 圖書館前",
  takenAt: Date.parse("2026-09-17T19:05:00+08:00"),
  assetIds: ["asset_1"],
  analysis: {
    hook: "最近是不是很久沒有好好坐下來？",
    visual: "剛發布",
    theme: "浮游禪光",
    captionLength: 20,
    cta: "弱",
    direction: "已進 Content Memory",
    improve: [],
  },
};

const live: IgMemoryPost = {
  id: "ig_88",
  source: "instagram",
  mediaType: "image",
  caption: "最近是不是很久沒有好好坐下來？\n9/24 圖書館前",
  takenAt: Date.parse("2026-09-17T19:06:00+08:00"),
  assetIds: [],
  saves: 41,
  comments: 12,
  reach: 860,
  permalink: "https://instagram.com/p/demo",
};

test("official insights merge onto the local published post", () => {
  const posts = mergeIgPosts([local], [live]);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].id, "ig_88");
  assert.equal(posts[0].saves, 41);
  assert.equal(posts[0].assetIds[0], "asset_1");
  assert.equal(posts[0].analysis?.theme, "浮游禪光");
});

test("same id still overlays metrics", () => {
  const posts = mergeIgPosts([{ ...live, saves: 2 }], [{ ...live, saves: 50, comments: 9 }]);
  assert.equal(posts[0].saves, 50);
  assert.equal(posts[0].comments, 9);
});

test("official insights refresh lastLearn and fill missing analysis", () => {
  const { posts, lastLearn } = prepareIgIngest([local], [live], 88);
  assert.equal(posts[0].saves, 41);
  assert.ok(posts[0].analysis?.visual);
  assert.ok(lastLearn);
  assert.equal(lastLearn?.at, 88);
  assert.ok(/坐下來|課表|休息|龜/.test(lastLearn?.hook ?? ""));
});

test("posts without metrics do not overwrite lastLearn", () => {
  const { lastLearn } = prepareIgIngest([local], [{ ...live, saves: undefined, comments: undefined, reach: undefined, likes: undefined, shares: undefined }]);
  assert.equal(lastLearn, null);
});
