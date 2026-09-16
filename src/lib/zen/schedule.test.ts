import assert from "node:assert/strict";
import test from "node:test";
import {
  agendaSorted,
  dueScheduled,
  firstPublishable,
  isDue,
  mergeCampaignWaves,
  scheduleItemsForWave,
  soonestScheduled,
  waveLabel,
  waveVisualVariation,
  heroScheduleItem,
} from "./schedule.ts";

test("soonestScheduled surfaces the next tea-party IG post, not a later LINE draft", () => {
  const items = [
    { id: "line", status: "scheduled", scheduledAt: 90, title: "LINE · 茶會" },
    { id: "ig", status: "scheduled", scheduledAt: 10, title: "IG Post · 茶會", imageAssetId: "asset_hero" },
    { id: "old", status: "published", scheduledAt: 1, title: "已發" },
    { id: "carousel", status: "scheduled", scheduledAt: 20, title: "Carousel · 茶會", imageAssetId: "asset_hero" },
  ];
  const next = soonestScheduled(items, 2);
  assert.deepEqual(
    next.map((item) => item.id),
    ["ig", "carousel"],
  );
});

test("waveVisualVariation gives each tea-party wave a different axis", () => {
  assert.equal(waveVisualVariation("hero"), "composition");
  assert.equal(waveVisualVariation("warmup"), "mood");
  assert.notEqual(waveVisualVariation("hero"), waveVisualVariation("recap"));
});

test("mergeCampaignWaves keeps ids so tea-party calendar rows upsert", () => {
  const merged = mergeCampaignWaves(
    [{ id: "wave_old", kind: "hero", title: "主視覺 · 舊", scheduledAt: 1, projectId: null, notes: "", imageAssetId: "asset_a", caption: "舊 caption" }],
    [{ id: "wave_new", kind: "hero", title: "主視覺 · 茶會", scheduledAt: 2, projectId: "proj", notes: "主視覺進 Feed。" }],
  );
  assert.equal(merged[0]?.id, "wave_old");
  assert.equal(merged[0]?.title, "主視覺 · 茶會");
  assert.equal(merged[0]?.imageAssetId, "asset_a");
  assert.equal(merged[0]?.caption, "舊 caption");
});

test("scheduleItemsForWave matches 主視覺 rows for one campaign", () => {
  const rows = [
    { id: "a", campaignId: "camp_1", title: `${waveLabel("hero")} · 茶會` },
    { id: "b", campaignId: "camp_1", title: `${waveLabel("warmup")} · 茶會` },
    { id: "c", campaignId: "camp_2", title: `${waveLabel("hero")} · 浮游禪光` },
  ];
  assert.deepEqual(
    scheduleItemsForWave(rows, "camp_1", "hero").map((row) => row.id),
    ["a"],
  );
});

test("isDue is only scheduled rows whose time has passed", () => {
  const now = 100;
  assert.equal(isDue({ status: "scheduled", scheduledAt: 90 }, now), true);
  assert.equal(isDue({ status: "scheduled", scheduledAt: 100 }, now), true);
  assert.equal(isDue({ status: "scheduled", scheduledAt: 110 }, now), false);
  assert.equal(isDue({ status: "published", scheduledAt: 1 }, now), false);
  assert.equal(isDue({ status: "idea", scheduledAt: 1 }, now), false);
});

test("dueScheduled lists overdue tea-party rows soonest first", () => {
  const now = 50;
  const due = dueScheduled(
    [
      { id: "later", status: "scheduled", scheduledAt: 80 },
      { id: "overdue", status: "scheduled", scheduledAt: 10 },
      { id: "done", status: "published", scheduledAt: 1 },
    ],
    now,
  );
  assert.deepEqual(
    due.map((row) => row.id),
    ["overdue"],
  );
});

test("agendaSorted lifts overdue rows above later LINE drafts", () => {
  const now = 50;
  const rows = agendaSorted(
    [
      { id: "line", status: "scheduled", scheduledAt: 90 },
      { id: "hero", status: "scheduled", scheduledAt: 10 },
      { id: "old", status: "published", scheduledAt: 1 },
    ],
    now,
  );
  assert.deepEqual(
    rows.map((row) => row.id),
    ["hero", "old", "line"],
  );
});

test("firstPublishable prefers a due carousel over a due Story", () => {
  const now = 100;
  const pick = firstPublishable(
    [
      { id: "story", status: "scheduled", scheduledAt: 10, kind: "story" },
      { id: "hero", status: "scheduled", scheduledAt: 40, kind: "carousel" },
      { id: "later", status: "scheduled", scheduledAt: 200, kind: "ig-post" },
    ],
    now,
  );
  assert.equal(pick?.id, "hero");
});

test("firstPublishable falls back to a due Story, then the next Feed post", () => {
  const now = 100;
  const dueStory = firstPublishable(
    [
      { id: "story", status: "scheduled", scheduledAt: 10, kind: "story" },
      { id: "later", status: "scheduled", scheduledAt: 200, kind: "carousel" },
    ],
    now,
  );
  assert.equal(dueStory?.id, "story");
  const upcoming = firstPublishable(
    [
      { id: "idea", status: "idea", scheduledAt: 10, kind: "line" },
      { id: "carousel", status: "scheduled", scheduledAt: 200, kind: "carousel" },
    ],
    now,
  );
  assert.equal(upcoming?.id, "carousel");
});

test("heroScheduleItem finds the 主視覺 row for a tea-party campaign", () => {
  const hero = heroScheduleItem(
    [
      { id: "w", campaignId: "camp_1", title: `${waveLabel("warmup")} · 茶會`, kind: "member-story" },
      { id: "h", campaignId: "camp_1", title: `${waveLabel("hero")} · 茶會`, kind: "carousel" },
    ],
    "camp_1",
  );
  assert.equal(hero?.id, "h");
});
