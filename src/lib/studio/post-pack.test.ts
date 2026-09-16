import assert from "node:assert/strict";
import test from "node:test";
import { remainingConvertTargets } from "./convert-copy.ts";
import { CONTENT_KIND_META, inferContentKind } from "./status.ts";
import {
  IG_CAPTION_LIMIT,
  IG_PREVIEW_CHARS,
  THREADS_LIMIT,
  igPostText,
  linePostText,
  packChannelForKind,
  packStats,
  packText,
  threadsPostText,
} from "./post-pack.ts";
import type { CopyDeck } from "./types.ts";

const copy: CopyDeck = {
  eyebrow: "09/24",
  headline: "很久沒有\n好好坐下來了吧",
  subhead: "9/24（三）19:00 · 商管 B302",
  body: "不用準備什麼",
  cta: "來坐一下",
  handle: "@tku.zen",
  caption: "最近是不是連休息都覺得有罪惡感？\n\n9/24 晚上七點，商管 B302。",
  hashtags: ["#淡江大學", "#淡江禪學社", "#靜心"],
  altText: "",
};

test("igPostText appends hashtags once", () => {
  const text = igPostText(copy);
  assert.match(text, /休息都覺得有罪惡感/);
  assert.match(text, /#淡江禪學社/);
  assert.equal(text.match(/#淡江禪學社/g)?.length, 1);
  assert.equal(igPostText({ caption: `${copy.caption}\n\n${copy.hashtags.join(" ")}`, hashtags: copy.hashtags }), `${copy.caption}\n\n${copy.hashtags.join(" ")}`);
});

test("threads text is the caption, not a poster layout", () => {
  const text = threadsPostText(copy);
  assert.match(text, /休息/);
  assert.ok(text.length <= THREADS_LIMIT);
});

test("LINE pack text puts headline, time and CTA on a pasteable block", () => {
  const text = linePostText(copy);
  assert.match(text, /很久沒有/);
  assert.match(text, /來坐一下/);
});

test("packStats flags IG preview and overflow", () => {
  const short = packStats("第一次來，會經歷什麼？", IG_CAPTION_LIMIT);
  assert.equal(short.hasMore, false);
  assert.equal(short.over, false);
  const long = packStats("字".repeat(IG_PREVIEW_CHARS + 10), IG_CAPTION_LIMIT);
  assert.equal(long.hasMore, true);
  assert.equal(long.preview.length, IG_PREVIEW_CHARS);
  const over = packStats("超".repeat(IG_CAPTION_LIMIT + 1), IG_CAPTION_LIMIT);
  assert.equal(over.over, true);
  assert.equal(over.remaining, -1);
});

test("pack channel follows the content kind", () => {
  assert.equal(packChannelForKind("threads"), "threads");
  assert.equal(packChannelForKind("line"), "line");
  assert.equal(packChannelForKind("ig-post"), "ig");
  assert.equal(packText(copy, "ig"), igPostText(copy));
});

test("LINE canvases are landscape, not square", () => {
  assert.equal(CONTENT_KIND_META.line.formatId, "feed-landscape");
  assert.equal(inferContentKind("feed-landscape", 1), "line");
});

test("remainingConvertTargets skips the current kind", () => {
  const ids = remainingConvertTargets("ig-post").map((item) => item.id);
  assert.equal(ids.includes("ig-post"), false);
  assert.deepEqual(ids, ["carousel", "story", "threads", "line", "reels"]);
});
