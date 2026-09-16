import assert from "node:assert/strict";
import test from "node:test";
import {
  createSearchFromVision,
  ideaForVisionAction,
  staysOnImageStudio,
  visionActionOf,
} from "./vision-action.ts";

test("vision labels map to Story / Carousel / restyle, not a generic chat", () => {
  assert.equal(visionActionOf("做成限動"), "story");
  assert.equal(visionActionOf("做成 Carousel"), "carousel");
  assert.equal(visionActionOf("做成 Reels Cover"), "reels");
  assert.equal(visionActionOf("做成 Threads 圖"), "threads");
  assert.equal(visionActionOf("保留內容重新設計"), "redesign");
  assert.equal(visionActionOf("生成相似視覺"), "similar");
  assert.equal(visionActionOf("延續這個風格"), "continue-style");
});

test("做成限動 keeps the still instead of dropping it for a text-only kit", () => {
  assert.deepEqual(
    createSearchFromVision({
      action: "story",
      idea: "我要宣傳茶會",
      assetId: "asset_tamsui",
    }),
    { mode: "from-image", idea: "我要宣傳茶會", asset: "asset_tamsui", into: "story" },
  );
  assert.deepEqual(
    createSearchFromVision({
      action: "carousel",
      idea: "下週有一場茶會",
      remoteId: "drv_tea_2025",
    }),
    { mode: "from-drive", idea: "下週有一場茶會", remote: "drv_tea_2025", into: "carousel" },
  );
  assert.equal(staysOnImageStudio("reels"), true);
  assert.equal(staysOnImageStudio("story"), false);
});

test("ideaForVisionAction does not send the whole vision paragraph as the activity name", () => {
  const dumped = "畫面是現場／校園空氣（Google Drive / 2025 茶會現場），不是禪風海報。";
  assert.equal(ideaForVisionAction("story", "我要宣傳茶會\n畫面：現場"), "我要宣傳茶會");
  assert.match(ideaForVisionAction("redesign", "茶會"), /保留畫面內容/);
  assert.doesNotMatch(ideaForVisionAction("story", dumped), /禪風海報/);
});
