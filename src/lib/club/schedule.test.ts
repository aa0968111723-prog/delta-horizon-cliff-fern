import assert from "node:assert/strict";
import test from "node:test";
import { buildCampaignRhythm } from "./schedule.ts";

test("tea ceremony rhythm is not a wall of ads", () => {
  const waves = buildCampaignRhythm({ eventDate: "2026-09-24", eventType: "浮游禪光", leadDays: 10 });
  assert.ok(waves.length >= 6);
  const purposes = waves.map((w) => w.purpose);
  assert.ok(purposes.includes("life") || purposes.includes("emotion"));
  assert.ok(purposes.includes("recap"));
  const ads = purposes.filter((p) => p === "hero" || p === "info" || p === "reason");
  assert.ok(ads.length < purposes.length, "rhythm should mix life/interact/knowledge");
  assert.ok(waves.every((w) => !w.hook.includes("誠摯邀請您")));
});

test("short lead compresses into a dense sequence", () => {
  const waves = buildCampaignRhythm({ eventDate: "2026-09-20", eventType: "社課", leadDays: 3 });
  assert.ok(waves.length <= 6);
  assert.ok(waves.some((w) => w.purpose === "countdown" || w.purpose === "dayof"));
});
