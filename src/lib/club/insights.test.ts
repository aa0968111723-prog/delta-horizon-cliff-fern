import assert from "node:assert/strict";
import test from "node:test";
import { lessonsFromIg, formatLessons, quotedHookFromLessons, lessonPrompt, nextCreateIdeaFromLessons, analysisFromLive, preferPublishedAnalysis } from "./insights.ts";

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

test("formatLessons and quotedHookFromLessons feed the next generate", () => {
  const posts = [
    {
      mediaType: "image",
      caption: "最近是不是連休息都覺得有罪惡感？\n下週茶會。",
      metrics: { reach: 1800, likes: 90, comments: 12, saves: 40 },
    },
  ];
  const lessons = lessonsFromIg(posts);
  const text = formatLessons(lessons);
  assert.match(text, /Hook：/);
  assert.equal(quotedHookFromLessons(text), "最近是不是連休息都覺得有罪惡感？");
  assert.match(lessonPrompt(posts), /Hook：/);
  assert.match(nextCreateIdeaFromLessons(posts, "茶會"), /連休息都覺得有罪惡感/);
  assert.match(nextCreateIdeaFromLessons(posts, "茶會"), /茶會/);
});

test("quotedHookFromLessons does not use a recap as the next promotional hook", () => {
  const recap = '比較有效的 Hook 像是「來的人比想像中多。有人問「我不會禪也可以嗎？」」。少用社團全名當第一句。';
  assert.equal(quotedHookFromLessons(recap), "我不會禪也可以嗎？");
  assert.equal(
    quotedHookFromLessons("延續這個比較讓人停下來的第一句：「來的人比想像中多。我不會禪也可以嗎？」。"),
    "來的人比想像中多。我不會禪也可以嗎？",
  );
});

test("analysisFromLive writes Content Memory, not a permalink", () => {
  const text = analysisFromLive({
    caption: "最近是不是連休息都覺得有罪惡感？\n下週茶會。",
    mediaType: "carousel",
    metrics: { reach: 1800, likes: 40, comments: 4, saves: 30 },
  });
  assert.match(text, /官方成效/);
  assert.match(text, /連休息都覺得有罪惡感/);
  assert.doesNotMatch(text, /instagram\.com/);
  assert.equal(
    preferPublishedAnalysis("剛發布 · ig-post · 茶會。Hook：坐一下", "官方 IG · 單張。還沒有足夠成效數字。"),
    "剛發布 · ig-post · 茶會。Hook：坐一下",
  );
});

test("nextCreateIdeaFromLessons prefers a just-published hook over a high-save recap", () => {
  const idea = nextCreateIdeaFromLessons(
    [
      {
        mediaType: "carousel",
        caption: "來的人比想像中多。\n可以。",
        metrics: { reach: 2400, likes: 150, comments: 20, saves: 70 },
      },
      {
        mediaType: "image",
        caption: "我不會禪也可以嗎？\n下週茶會。",
        analysis: "剛發布 · ig-post · 茶會。Hook：我不會禪也可以嗎？",
      },
    ],
    "茶會",
  );
  assert.match(idea, /我不會禪也可以嗎/);
  assert.match(idea, /茶會/);
  assert.doesNotMatch(idea, /來的人比想像中多/);
});
