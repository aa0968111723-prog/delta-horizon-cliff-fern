import assert from "node:assert/strict";
import test from "node:test";
import {
  abstractInspiration,
  campusResearch,
  INSPIRATION_SEEDS,
  inspirationCreateNotes,
  inspirationFeed,
  kindFromInspiration,
  parseResearchSeeds,
  seasonInspiration,
  withResearch,
} from "./inspiration.ts";

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

test("campusResearch follows the Tamkang season and stays off invitation copy", () => {
  const orientation = campusResearch(new Date("2026-09-16T12:00:00+08:00"));
  assert.equal(orientation.length, 3);
  assert.ok(orientation.every((seed) => seed.id.startsWith("research-orientation-")));
  assert.ok(orientation.every((seed) => !seed.zenClub.hook.includes("誠摯邀請")));
  assert.match(orientation[0]!.watch, /大學生社群研究/);
  assert.match(orientation[0]!.zenClub.why, /不要抄/);
  const midterm = campusResearch(new Date("2026-10-25T12:00:00+08:00"));
  assert.ok(midterm.every((seed) => seed.id.startsWith("research-midterm-")));
  assert.notEqual(midterm[0]!.zenClub.hook, orientation[0]!.zenClub.hook);
});

test("parseResearchSeeds falls back and strips invitation hooks", () => {
  const now = new Date("2026-09-16T12:00:00+08:00");
  const empty = parseResearchSeeds({}, "orientation", now);
  assert.equal(empty.length, 3);
  assert.equal(empty[0]?.id, "research-orientation-1");
  const live = parseResearchSeeds(
    {
      items: [
        { title: "抄來的", hook: "淡江大學禪學社誠摯邀請您", composition: "滿版海報" },
        { title: "河風", hook: "捷運門打開的時候，風比你想的大。", visual: "淡水出口" },
      ],
    },
    "orientation",
    now,
  );
  assert.equal(live.length, 2);
  assert.equal(live[0]?.id, "research-live-orientation-1");
  assert.equal(live[0]?.zenClub.hook.includes("誠摯邀請"), false);
  assert.match(live[1]!.zenClub.hook, /捷運/);
});

test("withResearch prepends new cards without duplicating the season feed", () => {
  const now = new Date("2026-09-16T12:00:00+08:00");
  const feed = inspirationFeed(now);
  const extra = campusResearch(now);
  const merged = withResearch(feed, extra);
  assert.equal(merged[0]?.id, extra[0]?.id);
  assert.equal(merged.length, feed.length + extra.length);
  assert.equal(withResearch(merged, extra).length, merged.length);
});
