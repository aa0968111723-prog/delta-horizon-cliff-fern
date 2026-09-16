import assert from "node:assert/strict";
import test from "node:test";
import {
  parseBeatSecond,
  reelsDurationSec,
  reelsEncodeSpec,
  reelsShotsFromScript,
  shotAt,
  wrapCaption,
} from "./reels-shots.ts";

test("tea-party reels shots follow 0–20 seconds and keep the hook", () => {
  const shots = reelsShotsFromScript(
    {
      hook: "最近是不是很久沒有好好坐下來？",
      beats: [
        { start: "0", end: "3", onScreen: "光", caption: "最近是不是很久沒有好好坐下來？", voice: "hook", transition: "切", assetHint: "燈" },
        { start: "3", end: "7", onScreen: "淡水", caption: "人可以慢", voice: "課表很滿", transition: "淡", assetHint: "河" },
        { start: "17", end: "20", onScreen: "時間", caption: "9/24 19:00 淡水校園", voice: "來坐一下", transition: "切", assetHint: "主視覺" },
      ],
    },
  );
  assert.equal(shots[0]?.startSec, 0);
  assert.equal(shots[shots.length - 1]?.endSec, 20);
  assert.match(shots[0]?.caption ?? "", /坐下來/);
  assert.equal(reelsDurationSec(shots), 20);
  assert.equal(shotAt(shots, 1).caption.includes("坐下來"), true);
  assert.equal(shotAt(shots, 4).caption, "人可以慢");
});

test("missing script still yields a 3–20s Reels, not a still", () => {
  const shots = reelsShotsFromScript(undefined, "可以自己來？");
  assert.equal(shots.length, 1);
  assert.ok(reelsDurationSec(shots) >= 3);
  assert.equal(reelsEncodeSpec(shots).width, 1080);
  assert.equal(reelsEncodeSpec(shots).height, 1920);
  assert.equal(parseBeatSecond("3秒"), 3);
});

test("wrapCaption keeps student lines readable on 9:16", () => {
  const lines = wrapCaption("最近是不是很久沒有好好坐下來？", 8, 3);
  assert.equal(lines[0]?.length, 8);
  assert.ok(wrapCaption("來坐一下").length >= 1);
});
