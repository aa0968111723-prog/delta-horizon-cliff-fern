import assert from "node:assert/strict";
import test from "node:test";
import { SEED_IG_POSTS } from "../creative/memory-seed.ts";
import { compactSeasonSteer, featuredHookForNow, hookFitsSeason, learnCardForNow, seasonCreateNote, sameLivingHook } from "./featured.ts";
import { academicMoment } from "./season.ts";

test("期末高收藏句不能當開學的今天推薦", () => {
  assert.equal(hookFitsSeason("期末不是要你更努力。", "start"), false);
  assert.equal(hookFitsSeason("最近是不是很久沒有好好坐下來？", "start"), true);
  assert.equal(hookFitsSeason("開學第一週，有人課表還沒齊。", "start"), true);
});

test("浮游禪光在開學週推薦坐好，不推薦期末", () => {
  const season = academicMoment(new Date("2026-09-16T12:00:00+08:00"));
  const featured = featuredHookForNow({
    season,
    campaign: {
      name: "浮游禪光",
      oneLiner: "一個不用表演的晚上。",
      theme: "坐下來",
      studentPain: "連休息都有罪惡感；剛到淡水還沒找到自己的晚上。",
    },
    posts: SEED_IG_POSTS,
  });
  assert.equal(featured.hook.includes("期末"), false);
  assert.match(featured.hook, /坐|淡水|課表|朋友/);
  assert.match(featured.query, /浮游禪光/);
  assert.match(featured.query, /第一句/);
  const note = seasonCreateNote(season, "期末不是要你更努力。");
  assert.match(note, /開學/);
  assert.match(note, /過季/);
  const steer = compactSeasonSteer(season, "期末不是要你更努力。");
  assert.match(steer, /開學/);
  assert.match(steer, /不要沿用/);
  assert.equal(steer.includes("大一剛到淡水"), false);
});

test("開學的學到卡不把期末句當成今天的第一句", () => {
  const season = academicMoment(new Date("2026-09-16T12:00:00+08:00"));
  const card = learnCardForNow({
    season,
    lastLearn: {
      hook: "期末不是要你更努力。",
      hookLesson: "問句和生活判斷句比較會被收藏。",
      mixLesson: "生活與陪伴文撐住停留。",
      visualLesson: "淡水黃昏比較停。",
      at: Date.parse("2026-06-10T20:00:00+08:00"),
    },
    now: Date.parse("2026-09-16T12:00:00+08:00"),
  });
  assert.ok(card);
  assert.equal(card.stale, true);
  assert.equal(card.quote.includes("期末"), false);
  assert.match(card.quote, /坐|淡水|課表|朋友/);
  assert.match(card.label, /別沿用/);
  assert.match(card.detail, /期末/);
  assert.match(card.detail, /開學/);
});

test("合季的學到卡沿用那句", () => {
  const season = academicMoment(new Date("2026-09-16T12:00:00+08:00"));
  const card = learnCardForNow({
    season,
    lastLearn: {
      hook: "最近是不是很久沒有好好坐下來？",
      hookLesson: "問句比較會停。",
      mixLesson: "生活文撐住停留。",
      at: Date.parse("2026-09-16T12:00:00+08:00") - 60_000,
    },
    now: Date.parse("2026-09-16T12:00:00+08:00"),
  });
  assert.ok(card);
  assert.equal(card.stale, false);
  assert.match(card.quote, /坐/);
  assert.equal(card.label, "剛才學到");
});

test("期末週可以沿用期末那句的節奏", () => {
  const season = academicMoment(new Date("2026-12-20T12:00:00+08:00"));
  assert.equal(season.id, "finals");
  const featured = featuredHookForNow({
    season,
    campaign: {
      name: "期末茶會",
      oneLiner: "一個不用表演的晚上。",
      theme: "坐下來",
      studentPain: "報告、考試",
    },
    posts: SEED_IG_POSTS,
  });
  assert.equal(hookFitsSeason(featured.hook, "finals"), true);
});

test("坐好 and 坐下來 count as the same living hook", () => {
  assert.equal(sameLivingHook("最近是不是很久沒有好好坐下來？", "最近是不是很久沒坐好"), true);
  assert.equal(sameLivingHook("最近是不是很久沒有好好坐下來？", "剛到淡水的時候，好像什麼都還沒開始。"), false);
});

test("發過坐好之後，今天推薦換成別的生活切入", () => {
  const season = academicMoment(new Date("2026-09-16T12:00:00+08:00"));
  const published = "最近是不是很久沒有好好坐下來？";
  const featured = featuredHookForNow({
    season,
    campaign: {
      name: "浮游禪光",
      oneLiner: "一個不用表演的晚上。",
      theme: "坐下來",
      studentPain: "連休息都有罪惡感；剛到淡水還沒找到自己的晚上。",
    },
    posts: SEED_IG_POSTS,
    avoidHooks: [published],
  });
  assert.equal(sameLivingHook(featured.hook, published), false);
  assert.equal(featured.hook.includes("坐好"), false);
  assert.match(featured.why, /換切入|生活/);
  assert.match(featured.hook, /淡水|朋友|課表|休息|風|快樂/);
});
