import assert from "node:assert/strict";
import test from "node:test";
import {
  igFeedPostCount,
  igGridProjects,
  igHighlights,
  igPeekMode,
  indexOfId,
  storyPeekChrome,
  isHighlightKind,
  isIgFeedKind,
  storyPreviewProjects,
} from "./ig-profile.ts";

const copy = {
  eyebrow: "",
  headline: "限動倒數",
  subhead: "",
  body: "",
  cta: "來坐一下",
  handle: "@tku.zen",
  caption: "",
  hashtags: [],
  altText: "",
};

test("igHighlights picks story-like work as profile circles", () => {
  const highlights = igHighlights([
    { id: "a", name: "社課限動", contentKind: "story", status: "done", copy: { ...copy, headline: "社課" } },
    { id: "b", name: "貼文", contentKind: "ig-post", status: "done", copy },
    { id: "c", name: "倒數", contentKind: "countdown", status: "making", copy: { ...copy, headline: "明天晚上" } },
    { id: "d", name: "想法", contentKind: "story", status: "idea", copy },
  ]);
  assert.deepEqual(
    highlights.map((item) => item.label),
    ["社課", "明天晚上"],
  );
});

test("isHighlightKind keeps stories off the feed grid count", () => {
  assert.equal(isHighlightKind("story"), true);
  assert.equal(isHighlightKind("reels"), true);
  assert.equal(isHighlightKind("ig-post"), false);
});

test("isIgFeedKind keeps LINE and Threads off the Instagram grid", () => {
  assert.equal(isIgFeedKind("ig-post"), true);
  assert.equal(isIgFeedKind("carousel"), true);
  assert.equal(isIgFeedKind("knowledge"), true);
  assert.equal(isIgFeedKind("story"), false);
  assert.equal(isIgFeedKind("reels"), false);
  assert.equal(isIgFeedKind("line"), false);
  assert.equal(isIgFeedKind("threads"), false);
});

test("storyPreviewProjects skips ideas and feed posts", () => {
  const rows = storyPreviewProjects([
    { status: "done" as const, contentKind: "story" as const },
    { status: "idea" as const, contentKind: "story" as const },
    { status: "making" as const, contentKind: "reels" as const },
    { status: "done" as const, contentKind: "ig-post" as const },
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.contentKind, "story");
  assert.equal(rows[1]?.contentKind, "reels");
});

test("igFeedPostCount skips ideas, highlights, LINE and Threads", () => {
  assert.equal(
    igFeedPostCount([
      { status: "done", contentKind: "ig-post" },
      { status: "published", contentKind: "carousel" },
      { status: "done", contentKind: "story" },
      { status: "idea", contentKind: "ig-post" },
      { status: "done", contentKind: "line" },
      { status: "published", contentKind: "threads" },
    ]),
    2,
  );
});

test("igPeekMode routes stories to 9:16 and posts to the feed", () => {
  assert.equal(igPeekMode("story"), "story");
  assert.equal(igPeekMode("reels"), "story");
  assert.equal(igPeekMode("ig-post"), "feed");
  assert.equal(igPeekMode("carousel"), "feed");
  assert.equal(igPeekMode("line"), null);
  assert.equal(igPeekMode("threads"), null);
});

test("indexOfId starts the story viewer on the tapped highlight", () => {
  const rows = [{ id: "story-a" }, { id: "story-b" }, { id: "reels-c" }];
  assert.equal(indexOfId(rows, "reels-c"), 2);
  assert.equal(indexOfId(rows, "missing"), 0);
  assert.equal(indexOfId(rows, null), 0);
});

test("storyPeekChrome names the page, not 1/1 of stories", () => {
  assert.equal(
    storyPeekChrome({ kind: "story", storyIndex: 0, storyCount: 1, pageIndex: 0, pageCount: 3 }),
    "限動預覽 · 限時動態 · 第 1/3 頁",
  );
  assert.equal(
    storyPeekChrome({ kind: "story", storyIndex: 0, storyCount: 1, pageIndex: 1, pageCount: 3 }),
    "限動預覽 · 限時動態 · 第 2/3 頁",
  );
  assert.equal(
    storyPeekChrome({ kind: "reels", storyIndex: 1, storyCount: 3, pageIndex: 0, pageCount: 1 }),
    "限動預覽 · Reels · 2/3 則 · 第 1/1 頁",
  );
});

test("igGridProjects only returns Instagram feed posts", () => {
  const rows = igGridProjects([
    { status: "done" as const, contentKind: "ig-post" as const },
    { status: "done" as const, contentKind: "story" as const },
    { status: "making" as const, contentKind: "line" as const },
    { status: "published" as const, contentKind: "carousel" as const },
  ]);
  assert.deepEqual(
    rows.map((row) => row.contentKind),
    ["ig-post", "carousel"],
  );
});
