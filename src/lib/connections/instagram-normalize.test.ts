import assert from "node:assert/strict";
import test from "node:test";
import { firstCaptionLine, normalizeInstagramMedia } from "./instagram-normalize.ts";

test("normalizes Instagram Graph media without retaining tokens", () => {
  const media = normalizeInstagramMedia({
    data: [
      {
        id: "ig-1",
        caption: "最近是不是很久沒有好好坐下來？\n\n#淡江禪學社",
        media_type: "CAROUSEL_ALBUM",
        permalink: "https://www.instagram.com/p/abc/",
        thumbnail_url: "https://example.com/ig.jpg",
        timestamp: "2026-09-01T12:00:00+08:00",
      },
    ],
    access_token: "must-not-survive",
  });
  assert.equal(media.length, 1);
  assert.equal(media[0]?.provider, "instagram");
  assert.equal(media[0]?.collection, "IG 內容記憶");
  assert.equal(media[0]?.title, "最近是不是很久沒有好好坐下來？");
  assert.equal(JSON.stringify(media).includes("must-not-survive"), false);
});

test("falls back to a generic title when caption is empty", () => {
  assert.equal(firstCaptionLine(""), "IG 貼文");
});
