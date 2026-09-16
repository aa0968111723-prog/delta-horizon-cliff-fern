import assert from "node:assert/strict";
import test from "node:test";
import { abstractInspiration, INSPIRATION_SEEDS, inspirationCreateNotes, inspirationFeed, kindFromInspiration, seasonInspiration } from "./inspiration.ts";

test("inspiration abstracts form instead of copying a campaign name", () => {
  assert.ok(INSPIRATION_SEEDS.length >= 3);
  for (const seed of INSPIRATION_SEEDS) {
    const abs = abstractInspiration(seed);
    assert.ok(abs.composition.length > 8);
    assert.ok(seed.zenClub.hook.length > 6);
    assert.equal(seed.zenClub.hook.includes("誠摯邀請"), false);
  }
});

test("seasonInspiration follows Tamkang calendar and leads the feed", () => {
  const orientation = seasonInspiration(new Date("2026-09-16T12:00:00+08:00"));
  assert.match(orientation.watch, /開學/);
  assert.match(orientation.zenClub.hook, /淡水/);
  assert.equal(orientation.zenClub.hook.includes("誠摯邀請"), false);
  const midterm = seasonInspiration(new Date("2026-10-25T12:00:00+08:00"));
  assert.match(midterm.watch, /期中/);
  assert.match(midterm.zenClub.hook, /休息/);
  const feed = inspirationFeed(new Date("2026-09-16T12:00:00+08:00"));
  assert.equal(feed[0]?.id, "season-orientation");
  assert.ok(feed.length > INSPIRATION_SEEDS.length);
});

test("inspiration create notes keep form and refuse copying", () => {
  const seed = INSPIRATION_SEEDS[0]!;
  const notes = inspirationCreateNotes(seed);
  assert.match(notes, /不要抄/);
  assert.match(notes, /構圖/);
  assert.match(notes, /轉成淡江禪學社/);
  assert.equal(kindFromInspiration(seed), "carousel");
  assert.equal(kindFromInspiration(INSPIRATION_SEEDS[1]!), "reels");
});
