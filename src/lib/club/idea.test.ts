import assert from "node:assert/strict";
import test from "node:test";
import { parseIdea } from "./idea.ts";
import { featuredCampaignIdea, searchMemory } from "./memory.ts";

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

test("featured campaign idea still parses as 浮游禪光", () => {
  const parsed = parseIdea(featuredCampaignIdea(), FROM);
  assert.equal(parsed.eventName, "浮游禪光");
  assert.match(parsed.raw, /最近是不是很久沒有好好坐下來？/);
});

test("tea idea search query finds Drive, Canva, and IG memory", () => {
  const parsed = parseIdea("下週有一場茶會", FROM);
  const hits = searchMemory(parsed.searchQuery);
  assert.ok(hits.some((item) => item.source === "drive" && item.title.includes("茶會")));
  assert.ok(hits.some((item) => item.source === "canva"));
  assert.ok(hits.some((item) => item.source === "instagram"));
});
