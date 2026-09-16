import assert from "node:assert/strict";
import test from "node:test";
import { pagePreviewSrc } from "./preview.ts";

test("page 0 keeps the packed hero", () => {
  assert.equal(
    pagePreviewSrc({
      kind: "carousel",
      src: "blob:hero",
      hook: "最近是不是很久沒坐下來？",
      heading: "Page 1 Hook",
      body: "最近是不是很久沒坐下來？",
      page: 0,
    }),
    "blob:hero",
  );
});

test("later carousel and story pages get sized frames, not the same hero", () => {
  const carousel = pagePreviewSrc({
    kind: "carousel",
    src: "blob:hero",
    hook: "坐一下",
    heading: "Page 2",
    body: "大學生活很自由，但你最近真的有比較快樂嗎？",
    page: 1,
  });
  const story = pagePreviewSrc({
    kind: "story",
    src: "blob:hero",
    hook: "坐一下",
    heading: "張 2",
    body: "今晚先坐",
    page: 2,
  });
  assert.equal(carousel.startsWith("data:image/svg+xml"), true);
  assert.equal(story.startsWith("data:image/svg+xml"), true);
  assert.equal(carousel.includes("blob:hero"), false);
  assert.match(decodeURIComponent(story), /viewBox="0 0 1080 1920"/);
  assert.match(decodeURIComponent(carousel), /viewBox="0 0 1080 1350"/);
  assert.match(decodeURIComponent(carousel), /大學生活很自由/);
});
