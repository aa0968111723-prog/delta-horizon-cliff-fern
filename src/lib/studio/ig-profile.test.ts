import assert from "node:assert/strict";
import test from "node:test";
import { igFeedPostCount, igHighlights } from "./ig-profile.ts";

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

test("igFeedPostCount skips ideas and highlight kinds", () => {
  assert.equal(
    igFeedPostCount([
      { status: "done", contentKind: "ig-post" },
      { status: "published", contentKind: "carousel" },
      { status: "done", contentKind: "story" },
      { status: "idea", contentKind: "ig-post" },
    ]),
    2,
  );
});
