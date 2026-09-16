import assert from "node:assert/strict";
import test from "node:test";
import { lessonsFromIg } from "./insights.ts";

test("empty metrics become honest next-step advice, not a dashboard", () => {
  const lessons = lessonsFromIg([]);
  assert.match(lessons.hook, /還沒有足夠/);
  assert.doesNotMatch(lessons.hook, /誠摯邀請/);
});

test("stronger saves and comments shape the next hook advice", () => {
  const lessons = lessonsFromIg([
    {
      mediaType: "image",
      caption: "龜龜今天也在。",
      metrics: { reach: 200, likes: 10, comments: 1, saves: 2 },
    },
    {
      mediaType: "carousel",
      caption: "來的人比想像中多。\n可以。",
      metrics: { reach: 2400, likes: 150, comments: 20, saves: 70 },
      analysis: "回顧比預告更有停留",
    },
  ]);
  assert.match(lessons.hook, /來的人比想像中多/);
  assert.match(lessons.carousel, /Carousel/);
  assert.match(lessons.activity, /來了以後|時間地點/);
});
