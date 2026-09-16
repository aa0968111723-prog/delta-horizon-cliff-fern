import assert from "node:assert/strict";
import test from "node:test";
import { copyTonesOf, preferredCopyVariant, STUDENT_COPY_TONES } from "./copy-tones.ts";
import type { CopyPack } from "./types.ts";

function pack(tones: CopyPack["variants"]): CopyPack {
  return {
    variants: tones,
    studentReview: [],
    revisedCaption: "",
    threads: "",
    line: "",
    storyFrames: [],
    carouselPages: [],
    reelsScript: [],
    generatedAt: 1,
    source: "mock",
  };
}

test("preferred variant uses 校園口語 before legacy 學生版", () => {
  const next = preferredCopyVariant(pack([
    { tone: "短版", hook: "短", body: "短文", cta: "看", hashtags: [] },
    { tone: "學生版", hook: "舊學生", body: "舊", cta: "來", hashtags: [] },
    { tone: "校園口語", hook: "下課了嗎", body: "新", cta: "揪一下", hashtags: [] },
  ]));
  assert.equal(next?.tone, "校園口語");
  assert.equal(next?.hook, "下課了嗎");
});

test("preferred variant falls back to 學生版 for older packs", () => {
  const next = preferredCopyVariant(pack([
    { tone: "短版", hook: "短", body: "短文", cta: "看", hashtags: [] },
    { tone: "學生版", hook: "舊學生", body: "舊", cta: "來", hashtags: [] },
  ]));
  assert.equal(next?.tone, "學生版");
});

test("tone chips surface the three student voices first", () => {
  assert.deepEqual([...STUDENT_COPY_TONES], ["校園口語", "清楚資訊", "傳給朋友"]);
  const tones = copyTonesOf(pack([
    { tone: "幽默版", hook: "哈", body: "哈", cta: "來", hashtags: [] },
    { tone: "傳給朋友", hook: "要不要", body: "短", cta: "揪", hashtags: [] },
    { tone: "校園口語", hook: "口語", body: "口語", cta: "來", hashtags: [] },
  ]));
  assert.deepEqual(tones.slice(0, 2), ["校園口語", "傳給朋友"]);
  assert.equal(tones.at(-1), "幽默版");
});
