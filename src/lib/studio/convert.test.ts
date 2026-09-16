import assert from "node:assert/strict";
import test from "node:test";
import { CONVERT_TARGETS, convertCopy } from "./convert-copy.ts";
import type { CopyDeck } from "./types.ts";

const copy: CopyDeck = {
  eyebrow: "09/24",
  headline: "很久沒有\n好好坐下來了吧",
  subhead: "9/24（三）19:00",
  body: "商管大樓 B302",
  cta: "來坐一下",
  handle: "@tku.zen",
  caption: "最近是不是連休息都覺得有罪惡感？\n\n9/24 晚上七點，商管 B302。",
  hashtags: ["#淡江大學", "#淡江禪學社", "#靜心", "#淡水", "#大學生活"],
  altText: "",
};

test("convert targets cover the one-click formats", () => {
  assert.deepEqual(
    CONVERT_TARGETS.map((t) => t.id),
    ["carousel", "story", "threads", "line", "reels"],
  );
});

test("threads copy is shorter and keeps the caption as the main text", () => {
  const next = convertCopy(copy, "threads");
  assert.ok(next.caption.includes("休息"));
  assert.ok(next.hashtags.length <= 4);
  assert.equal(next.eyebrow, "");
});

test("LINE copy puts the headline on one line", () => {
  const next = convertCopy(copy, "line");
  assert.equal(next.headline.includes("\n"), false);
  assert.ok(next.caption.includes("來坐一下"));
});

test("reels copy keeps a REELS eyebrow and a one-line headline", () => {
  const next = convertCopy(copy, "reels");
  assert.equal(next.eyebrow, "REELS");
  assert.equal(next.headline, "很久沒有");
});
