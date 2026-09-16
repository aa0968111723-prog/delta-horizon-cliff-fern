import assert from "node:assert/strict";
import test from "node:test";
import { mergeCampaignWaves, scheduleItemsForWave, soonestScheduled, waveLabel, waveVisualVariation } from "./schedule.ts";

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
