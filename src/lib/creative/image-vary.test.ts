import assert from "node:assert/strict";
import test from "node:test";
import { varyImagePrompt } from "./image-vary.ts";

test("image variations stay in living Chinese", () => {
  const prompt = varyImagePrompt("茶會主視覺，夜間圍坐", "compose");
  assert.ok(prompt.includes("換構圖"));
  assert.equal(prompt.includes("different composition"), false);
  assert.ok(varyImagePrompt("茶會", "mood").includes("淡水"));
  assert.ok(varyImagePrompt("茶會", "reels").includes("9:16"));
});
