import assert from "node:assert/strict";
import test from "node:test";
import {
  agendaSorted,
  dueScheduled,
  firstPublishable,
  isDue,
  igNextReels,
  igStoryStrip,
  mergeCampaignWaves,
  scheduleItemsForWave,
  soonestScheduled,
  homeScheduled,
  waveFormatId,
  waveLabel,
  waveVisualVariation,
  heroScheduleItem,
  suggestWaves,
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

test("homeScheduled puts a due learned-Hook piece first, not seed 浮游禪光", () => {
  const now = 100;
  const rows = [
    { id: "seed", status: "scheduled", scheduledAt: 10, campaignId: "camp_light", title: "主視覺 · 浮游禪光" },
    { id: "tea", status: "scheduled", scheduledAt: 80, campaignId: "camp_tea", title: "主視覺 · 茶會" },
    { id: "piece", status: "scheduled", scheduledAt: 50, campaignId: "camp_hook", title: "Carousel · 可以自己來？" },
  ];
  const next = homeScheduled(rows, { eventId: "camp_tea", pieceIds: ["camp_hook"] }, now, 6);
  assert.equal(next[0]?.id, "piece");
  assert.ok(next.some((row) => row.id === "tea"));
  assert.ok(next.every((row) => row.id !== "seed"));
});

test("homeScheduled without pieces is just the tea-party cadence", () => {
  const rows = [
    { id: "seed", status: "scheduled", scheduledAt: 10, campaignId: "camp_light" },
    { id: "tea", status: "scheduled", scheduledAt: 80, campaignId: "camp_tea" },
  ];
  const next = homeScheduled(rows, { eventId: "camp_tea", pieceIds: [] }, 100, 6);
  assert.deepEqual(
    next.map((row) => row.id),
    ["tea"],
  );
});

test("igStoryStrip keeps 倒數 even when Feed waves fill the upcoming list", () => {
  const items = [
    ...Array.from({ length: 12 }, (_, i) => ({
      id: `wave_${i}`,
      status: "scheduled" as const,
      scheduledAt: i,
      kind: "ig-post",
    })),
    { id: "count", status: "scheduled" as const, scheduledAt: 80, kind: "countdown" },
    { id: "story", status: "scheduled" as const, scheduledAt: 90, kind: "story" },
    { id: "reels", status: "scheduled" as const, scheduledAt: 85, kind: "reels" },
  ];
  assert.deepEqual(
    igStoryStrip(items, 8).map((item) => item.id),
    ["count", "story"],
  );
  assert.deepEqual(
    igNextReels(items).map((item) => item.id),
    ["reels"],
  );
});

test("waveVisualVariation gives each tea-party wave a different axis", () => {
  assert.equal(waveVisualVariation("hero"), "composition");
  assert.equal(waveVisualVariation("warmup"), "mood");
  assert.notEqual(waveVisualVariation("hero"), waveVisualVariation("recap"));
});

test("countdown and 當日提醒 stills are 9:16 Stories, not 4:5 Feed", () => {
  assert.equal(waveFormatId("countdown"), "story");
  assert.equal(waveFormatId("dayof"), "story");
  assert.equal(waveFormatId("hero"), "feed-portrait");
  assert.equal(waveFormatId("emotion"), "feed-portrait");
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

test("firstPublishable prefers a due Reels over Threads copy-to-app", () => {
  const now = 100;
  const pick = firstPublishable(
    [
      { id: "line", status: "scheduled", scheduledAt: 10, kind: "line" },
      { id: "reels", status: "scheduled", scheduledAt: 40, kind: "reels" },
    ],
    now,
  );
  assert.equal(pick?.id, "reels");
});

test("firstPublishable prefers a due countdown Story over a due Reels", () => {
  const now = 100;
  const pick = firstPublishable(
    [
      { id: "reels", status: "scheduled", scheduledAt: 10, kind: "reels" },
      { id: "count", status: "scheduled", scheduledAt: 40, kind: "countdown" },
    ],
    now,
  );
  assert.equal(pick?.id, "count");
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

test("a 7-day tea-party still keeps 預熱 instead of jumping straight to ads", () => {
  const waves = suggestWaves(
    { date: "2026-09-23", type: "tea", name: "茶會" },
    new Date("2026-09-16T10:00:00+08:00"),
  );
  assert.ok(waves.some((wave) => wave.kind === "warmup"));
  assert.ok(waves.some((wave) => wave.kind === "emotion"));
  assert.ok(waves.some((wave) => wave.kind === "hero"));
  assert.equal(waves.filter((wave) => wave.kind === "warmup").length, 1);
});

test("浮游禪光 8 days out still includes 預熱", () => {
  const waves = suggestWaves(
    { date: "2026-09-24", type: "light", name: "浮游禪光" },
    new Date("2026-09-16T10:00:00+08:00"),
  );
  assert.ok(waves.some((wave) => wave.kind === "warmup"));
});

test("wave clocks stay 淡水 evening, not the host timezone 03:00", () => {
  const waves = suggestWaves(
    { date: "2026-09-23", type: "tea", name: "茶會" },
    new Date("2026-09-16T10:00:00+08:00"),
  );
  const hero = waves.find((wave) => wave.kind === "hero");
  const warmup = waves.find((wave) => wave.kind === "warmup");
  const dayof = waves.find((wave) => wave.kind === "dayof");
  assert.equal(new Date(hero?.scheduledAt ?? 0).toISOString(), "2026-09-17T11:00:00.000Z");
  assert.equal(new Date(warmup?.scheduledAt ?? 0).toISOString(), "2026-09-17T12:00:00.000Z");
  assert.equal(new Date(dayof?.scheduledAt ?? 0).toISOString(), "2026-09-23T08:00:00.000Z");
});
