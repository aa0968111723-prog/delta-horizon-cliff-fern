import assert from "node:assert/strict";
import test from "node:test";
import { parseIdea } from "./idea.ts";
import { featuredCampaignIdea, searchMemory } from "./memory.ts";
import { nextCreateIdeaFromLessons } from "./insights.ts";

const FROM = new Date("2026-09-16T12:00:00+08:00");

test("parseIdea understands 下週有一場茶會", () => {
  const parsed = parseIdea("下週有一場茶會", FROM);
  assert.equal(parsed.eventName, "茶會");
  assert.equal(parsed.searchQuery, "茶會");
  assert.equal(parsed.date, "2026-09-23");
  assert.equal(parsed.time, "19:30");
  assert.match(parsed.location, /淡江/);
  assert.match(parsed.audience, /淡江大學學生/);
  assert.equal(parsed.audience.includes("Z 世代"), false);
});

test("parseIdea keeps 浮游禪光 and explicit dates", () => {
  const parsed = parseIdea("09/24 浮游禪光", FROM);
  assert.equal(parsed.eventName, "浮游禪光");
  assert.equal(parsed.searchQuery, "浮游禪光");
  assert.equal(parsed.date, "2026-09-24");
});

test("lesson idea still parses as 浮游禪光 on the event date", () => {
  const idea = nextCreateIdeaFromLessons(
    [
      {
        mediaType: "image",
        caption: "有時候我們需要的不是答案，只是一個安靜的晚上。",
        metrics: { reach: 1800, likes: 90, comments: 12, saves: 40 },
      },
    ],
    "09/24 浮游禪光",
  );
  const parsed = parseIdea(idea, FROM);
  assert.equal(parsed.eventName, "浮游禪光");
  assert.equal(parsed.date, "2026-09-24");
  assert.match(idea, /安靜的晚上/);
});

test("night tea NL keeps tea and night in the search query", () => {
  const parsed = parseIdea("找以前晚上的茶會照片", FROM);
  assert.match(parsed.searchQuery, /茶會/);
  assert.match(parsed.searchQuery, /晚上/);
  assert.equal(parsed.eventName, "茶會");
});

test("tea idea search query finds Drive, Canva, and IG memory", () => {
  const parsed = parseIdea("下週有一場茶會", FROM);
  const hits = searchMemory(parsed.searchQuery);
  assert.ok(hits.some((item) => item.source === "drive" && item.title.includes("茶會")));
  assert.ok(hits.some((item) => item.source === "canva"));
  assert.ok(hits.some((item) => item.source === "instagram"));
});
