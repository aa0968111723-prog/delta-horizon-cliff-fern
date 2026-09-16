import assert from "node:assert/strict";
import test from "node:test";
import { applyAssetToArtboard, coverImagePrompt, hookKind, reelsScriptText, shotListText } from "./reels-cover.ts";
import type { Artboard, ReelsScript } from "./types.ts";

const reels: ReelsScript = {
  hook: "最近是不是連休息都覺得有罪惡感？",
  cover: "宿舍窗邊一盞燈，紙白留白",
  beats: [
    {
      range: "0–3 秒",
      visual: "窗邊夜燈",
      caption: "停一下",
      voice: "（無旁白）",
      transition: "變慢",
      asset: "窗邊照片",
    },
  ],
  createdAt: 1,
  source: "mock",
};

test("cover prompt is 9:16 and has no text overlay request", () => {
  const prompt = coverImagePrompt(reels);
  assert.match(prompt, /9:16/);
  assert.match(prompt, /no text/);
  assert.match(prompt, /宿舍窗邊/);
  assert.doesNotMatch(prompt, /Buddha|temple|佛/i);
});

test("shot list includes cover and numbered shots", () => {
  const text = shotListText(reels);
  assert.match(text, /封面：宿舍窗邊/);
  assert.match(text, /1\. 0–3 秒/);
  assert.match(text, /字幕：停一下/);
});

test("reels script text is pasteable beats", () => {
  const text = reelsScriptText(reels);
  assert.match(text, /Hook：最近是不是連休息都覺得有罪惡感？/);
  assert.match(text, /畫面：窗邊夜燈/);
  assert.match(text, /旁白：（無旁白）/);
});

test("hookKind groups openings the way IG insights will use them", () => {
  assert.equal(hookKind("最近是不是連休息都覺得有罪惡感？"), "提問");
  assert.equal(hookKind("9/24（三）晚上七點"), "時間資訊");
  assert.equal(hookKind("來坐一下"), "行動邀請");
  assert.equal(hookKind("很久沒有好好坐下來"), "生活狀態");
  assert.equal(hookKind("淡水河的光"), "直述");
});

test("applyAssetToArtboard replaces image layer or becomes background", () => {
  const board: Artboard = {
    formatId: "reels-cover",
    background: { type: "solid", color: "#F7F1E8" },
    layers: [
      {
        id: "img",
        name: "cover",
        type: "image",
        x: 0,
        y: 0,
        w: 1080,
        h: 1920,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        fromLayout: true,
        assetId: "old",
        objectFit: "cover",
        crop: { x: 50, y: 50, zoom: 1 },
        filter: { brightness: 1, contrast: 1, saturate: 1, blur: 0, grayscale: 0 },
        radius: 0,
      },
    ],
  };
  const next = applyAssetToArtboard(board, "new-cover");
  assert.equal(next.layers[0] && next.layers[0].type === "image" ? next.layers[0].assetId : "", "new-cover");

  const empty: Artboard = { formatId: "reels-cover", background: { type: "solid", color: "#fff" }, layers: [] };
  const bg = applyAssetToArtboard(empty, "cover-2");
  assert.equal(bg.background.type, "image");
  assert.equal(bg.background.assetId, "cover-2");
});

test("applyAssetToArtboard turns 主視覺色塊 into the photo", () => {
  const board: Artboard = {
    formatId: "feed-portrait",
    background: { type: "solid", color: "#F7F1E8" },
    layers: [
      {
        id: "block",
        name: "主視覺色塊",
        type: "shape",
        x: 0,
        y: 0,
        w: 1080,
        h: 756,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        fromLayout: true,
        shape: "rect",
        fill: "#1A7A6D",
        radius: 0,
      },
      {
        id: "panel",
        name: "資訊底板",
        type: "shape",
        x: 0,
        y: 728,
        w: 1080,
        h: 624,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        fromLayout: true,
        shape: "rect",
        fill: "#F7F1E8",
        radius: 36,
      },
    ],
  };
  const next = applyAssetToArtboard(board, "asset_dusk");
  const hero = next.layers[0];
  assert.equal(hero?.type, "image");
  assert.equal(hero && hero.type === "image" ? hero.assetId : "", "asset_dusk");
  assert.equal(hero?.name, "主視覺");
  assert.equal(hero?.w, 1080);
  assert.equal(hero?.h, 756);
  assert.equal(
    next.layers.some((layer) => layer.name === "主視覺色塊"),
    false,
  );
  assert.equal(next.layers.some((layer) => layer.name === "資訊底板"), true);
});
