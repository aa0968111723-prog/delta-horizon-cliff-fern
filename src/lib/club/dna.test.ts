import assert from "node:assert/strict";
import test from "node:test";
import { clubDnaFromMemory, dnaPromptBlock } from "./dna.ts";

test("club DNA prefers high-save IG hooks over generic brand lines", () => {
  const dna = clubDnaFromMemory({
    igPosts: [
      { caption: "淡江大學禪學社本週活動。", saves: 2, mediaType: "image", analysis: { hook: "本週活動", visual: "", theme: "", captionLength: 12, cta: "", direction: "", improve: [] } },
      { caption: "開學第一週，有人課表還沒齊。", saves: 41, mediaType: "image", analysis: { hook: "開學第一週，有人課表還沒齊。", visual: "茶會圍坐", theme: "", captionLength: 16, cta: "", direction: "", improve: [] } },
    ],
    memory: [{ title: "夜間茶會", summary: "", sourceLabel: "Google Drive / 2025 茶會", tags: ["茶會"] }],
  });
  assert.equal(dna.winningHooks[0], "開學第一週，有人課表還沒齊。");
  assert.ok(dna.notes.includes("2025 茶會"));
  const block = dnaPromptBlock(dna);
  assert.equal(block.includes("誠摯邀請"), true);
  assert.equal(block.includes("Z 世代"), false);
  assert.ok(dna.lessons.length > 0);
});
