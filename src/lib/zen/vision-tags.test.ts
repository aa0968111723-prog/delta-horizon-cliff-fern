import assert from "node:assert/strict";
import test from "node:test";
import { ideaFromVision, tagsFromVision } from "./vision-tags.ts";

test("tagsFromVision keeps turtle / tea / student tags without inventing religion", () => {
  const tags = tagsFromVision(
    {
      content: "龜龜在茶會角落，淡水夜燈",
      colors: "霧園、琥珀",
      tooReligious: false,
      tooOld: false,
      tooAi: true,
      fitsTamkang: true,
      suggestions: ["延續這個風格", "做成限動", "做成 Carousel"],
    },
    ["上傳"],
  );
  assert.ok(tags.includes("龜龜"));
  assert.ok(tags.includes("茶會"));
  assert.ok(tags.includes("學生感"));
  assert.ok(tags.includes("可做限動"));
  assert.ok(!tags.includes("宗教"));
});

test("ideaFromVision keeps the source idea and says not to copy the old work", () => {
  const idea = ideaFromVision(
    {
      content: "歷屆茶會海報，三色光與留白",
      colors: "霧園、靜水、琥珀點",
    },
    "延續「龜龜」的風格，做新的活動，不要複製舊作品。",
  );
  assert.match(idea, /延續「龜龜」/);
  assert.match(idea, /不要複製舊作品/);
  assert.match(idea, /畫面：/);
  assert.match(idea, /不要寺廟海報/);
});
