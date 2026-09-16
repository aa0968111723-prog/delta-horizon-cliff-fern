import assert from "node:assert/strict";
import test from "node:test";
import { SEED_IG_POSTS } from "../creative/memory-seed.ts";
import { featuredHookForNow, hookFitsSeason, seasonCreateNote } from "./featured.ts";
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
