import assert from "node:assert/strict";
import test from "node:test";
import {
  extractHashtags,
  firstCaptionLine,
  hashtagsFromInstagramMemory,
  normalizeInstagramInsights,
  normalizeInstagramMedia,
} from "./instagram-normalize.ts";

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

test("extracts ranked hashtags from IG content memory", () => {
  assert.deepEqual(extractHashtags("最近是不是很久沒有好好坐下來？\n#淡江禪學社 #浮游禪光"), ["#淡江禪學社", "#浮游禪光"]);
  const tags = hashtagsFromInstagramMemory([
    {
      id: "1",
      provider: "instagram",
      title: "茶會",
      mimeType: "IMAGE",
      isFolder: false,
      modifiedAt: "",
      webUrl: "",
      thumbnailUrl: "",
      parentId: "instagram",
      snippet: "#淡江禪學社 夜間茶會 #浮游禪光",
      syncedAt: 1,
    },
    {
      id: "2",
      provider: "instagram",
      title: "招生",
      mimeType: "IMAGE",
      isFolder: false,
      modifiedAt: "",
      webUrl: "",
      thumbnailUrl: "",
      parentId: "instagram",
      snippet: "開學 #淡江禪學社",
      syncedAt: 1,
    },
  ]);
  assert.equal(tags[0], "#淡江禪學社");
  assert.ok(tags.includes("#浮游禪光"));
});

test("normalizes official insights without inventing missing metrics", () => {
  const rows = normalizeInstagramInsights({
    data: [
      { name: "reach", period: "day", values: [{ value: 42 }], title: "觸及" },
      { name: "views", period: "day", values: [{ value: "not-a-number" }] },
    ],
    access_token: "must-not-survive",
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.metric, "reach");
  assert.equal(rows[0]?.value, 42);
  assert.equal(JSON.stringify(rows).includes("must-not-survive"), false);
});
