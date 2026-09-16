import assert from "node:assert/strict";
import test from "node:test";
import type { AssetMeta, ReelsBeat } from "../studio/types.ts";
import {
  beatIndexAt,
  beatRole,
  formatReelsScript,
  normalizeReelsBeats,
  reelsCoverPrompt,
  reelsDuration,
  suggestAssetsForBeat,
} from "./reels.ts";

const beats: ReelsBeat[] = [
  { from: 0, to: 3, visual: "滑 IG", caption: "停一下", voiceover: "", transition: "硬切", assetHint: "自拍手機畫面" },
  { from: 3, to: 7, visual: "圖書館", caption: "坐太久", voiceover: "停不下來", transition: "慢推", assetHint: "校園夜景素材" },
  { from: 7, to: 12, visual: "社辦門口", caption: "浮游禪光", voiceover: "", transition: "跟拍", assetHint: "社辦 / 教室照片" },
  { from: 12, to: 17, visual: "茶杯", caption: "坐著就好", voiceover: "", transition: "疊化", assetHint: "歷屆活動照片" },
  { from: 17, to: 20, visual: "時間卡", caption: "9/24 B302", voiceover: "直接來就好", transition: "定格", assetHint: "龜龜 + 三色光" },
];

test("normalizeReelsBeats snaps to 0–3 / 3–7 / 7–12 / 12–17 / 17–20", () => {
  const next = normalizeReelsBeats([
    { from: 1, to: 2, visual: "a", caption: "a", voiceover: "", transition: "", assetHint: "" },
    { from: 2, to: 9, visual: "b", caption: "b", voiceover: "", transition: "", assetHint: "" },
  ]);
  assert.equal(next.length, 5);
  assert.deepEqual(
    next.map((b) => [b.from, b.to]),
    [
      [0, 3],
      [3, 7],
      [7, 12],
      [12, 17],
      [17, 20],
    ],
  );
  assert.equal(next[4]?.visual, "b");
});

test("beatIndexAt follows the 20s playhead", () => {
  assert.equal(beatIndexAt(beats, 0), 0);
  assert.equal(beatIndexAt(beats, 3), 1);
  assert.equal(beatIndexAt(beats, 12.5), 3);
  assert.equal(beatIndexAt(beats, 19.9), 4);
  assert.equal(reelsDuration(beats), 20);
  assert.equal(beatRole(0).label, "Hook");
  assert.equal(beatRole(4).label, "CTA");
});

test("formatReelsScript is a shootable checklist", () => {
  const script = formatReelsScript(beats);
  assert.match(script, /0–3s {2}Hook/);
  assert.match(script, /畫面：滑 IG/);
  assert.match(script, /17–20s {2}CTA/);
  assert.match(script, /直接來就好/);
});

test("reelsCoverPrompt is 9:16 and has no on-image text", () => {
  const prompt = reelsCoverPrompt("夜晚宮燈大道", "最近是不是很久沒有好好坐下來？");
  assert.match(prompt, /9:16/);
  assert.match(prompt, /no text/);
  assert.match(prompt, /宮燈/);
});

test("suggestAssetsForBeat ranks turtle / campus / tamsui hints", () => {
  const assets: AssetMeta[] = [
    { id: "gugu", name: "龜龜", category: "mascot", tags: ["吉祥物"], kind: "image", mime: "image/svg+xml", width: 1, height: 1, createdAt: 1, updatedAt: 1, source: "seed", licenseNotes: "", licenseOwner: "", favorite: false, lastUsedAt: null, useCount: 0, insight: null, externalRef: null },
    { id: "campus", name: "宮燈大道", category: "campus", tags: ["淡江", "夜晚"], kind: "image", mime: "image/svg+xml", width: 1, height: 1, createdAt: 1, updatedAt: 1, source: "seed", licenseNotes: "", licenseOwner: "", favorite: false, lastUsedAt: null, useCount: 0, insight: null, externalRef: null },
    { id: "logo", name: "Logo", category: "logo", tags: [], kind: "logo", mime: "image/svg+xml", width: 1, height: 1, createdAt: 1, updatedAt: 1, source: "seed", licenseNotes: "", licenseOwner: "", favorite: false, lastUsedAt: null, useCount: 0, insight: null, externalRef: null },
  ];
  const cta = suggestAssetsForBeat(beats[4]!, assets);
  assert.equal(cta[0]?.id, "gugu");
  const scene = suggestAssetsForBeat(beats[1]!, assets);
  assert.equal(scene[0]?.id, "campus");
});
