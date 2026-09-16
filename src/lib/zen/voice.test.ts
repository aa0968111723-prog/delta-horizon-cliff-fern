import assert from "node:assert/strict";
import test from "node:test";
import { captionFromCopyStyle, completeCopyVariants, COPY_STYLES, matchingCopyStyle } from "./voice.ts";

test("completeCopyVariants always fills the six IG tones", () => {
  const variants = completeCopyVariants({
    hook: "最近是不是很久沒有好好坐下來？",
    body: "最近是不是很久沒有好好坐下來？\n\n9/24 晚上，淡江校園。",
    cta: "晚上見",
    variants: [{ style: "一般版", text: "最近是不是很久沒有好好坐下來？\n9/24 浮游禪光。" }],
  });
  assert.deepEqual(
    variants.map((row) => row.style),
    COPY_STYLES.map((row) => row.label),
  );
  assert.equal(variants.length, 6);
  const short = variants.find((row) => row.style === "短版")!.text;
  const normal = variants.find((row) => row.style === "一般版")!.text;
  assert.ok(short.startsWith("最近是不是很久沒有好好坐下來？"));
  assert.ok(short.length < normal.length);
  assert.match(variants.find((row) => row.style === "幽默版")!.text, /報告先放旁邊/);
  assert.match(variants.find((row) => row.style === "學生版")!.text, /朋友/);
});

test("captionFromCopyStyle keeps a live variant and matchingCopyStyle finds it", () => {
  const pack = {
    hook: "大學生活很自由，但你最近真的有比較快樂嗎？",
    body: "大學生活很自由，但你最近真的有比較快樂嗎？\n\n不是講座。",
    cta: "晚上見",
    variants: [{ style: "短版", text: "大學生活很自由，但你最近真的有比較快樂嗎？\n晚上見" }],
  };
  const short = captionFromCopyStyle(pack, "short");
  assert.equal(short, pack.variants[0]!.text);
  assert.equal(matchingCopyStyle(short, completeCopyVariants(pack)), "短版");
  assert.equal(matchingCopyStyle("手改的文案", completeCopyVariants(pack)), null);
});
