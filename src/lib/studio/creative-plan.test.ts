import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_CAMPAIGNS, DEFAULT_CONNECTIONS } from "./campaign-seed.ts";
import { briefFromCampaign, planFromCreativeWave, suggestedScheduleSlots } from "./creative-plan.ts";
import { buildLocalCreativeWave } from "./zen-prompt-engine.ts";
import { extractJsonObject } from "../ai/grok.ts";

test("briefFromCampaign maps tea party into a studio brief", () => {
  const brief = briefFromCampaign(DEFAULT_CAMPAIGNS[0]);
  assert.equal(brief.eventName, "09/24 浮游禪光");
  assert.ok(brief.schedule.includes("2026-09-24"));
  assert.equal(brief.location, DEFAULT_CAMPAIGNS[0].location);
  assert.equal(brief.goal, "awareness");
  assert.equal(brief.deliverables.carousel, true);
  assert.equal(brief.deliverables.reels, true);
});

test("planFromCreativeWave lands headline, carousel and captions on the plan", () => {
  const wave = buildLocalCreativeWave({
    topic: "09/24 浮游禪光 迎新茶會",
    date: "09/24 (四) 18:30",
    location: "淡江活動中心",
    cta: "主頁連結預約",
  });
  const plan = planFromCreativeWave({
    topic: "09/24 浮游禪光 迎新茶會",
    direction: wave.directions[0],
    conversion: wave.conversion,
    source: "mock",
    campaign: DEFAULT_CAMPAIGNS[0],
  });
  assert.equal(plan.source, "mock");
  assert.equal(plan.campaignName, "09/24 浮游禪光");
  assert.ok(plan.headline.includes("最近是不是"));
  assert.ok(plan.carouselPages.length >= 5);
  assert.equal(plan.carouselPages[0].role, "cover");
  assert.ok(plan.captions[0]?.text.includes("活動中心") || plan.captions[0]?.text.includes("淡江"));
  assert.ok(plan.hashtags.some((tag) => tag.includes("禪學社")));
  assert.ok(plan.visualDirection.includes("Prompt"));
});

test("suggestedScheduleSlots walks backward from event date", () => {
  const slots = suggestedScheduleSlots("2026-09-24");
  assert.match(slots.carousel, /^2026-09-18 20:00$/);
  assert.match(slots.reels, /^2026-09-23 18:00$/);
});

test("extractJsonObject reads fenced JSON", () => {
  const parsed = extractJsonObject('```json\n{"hook":"坐下來"}\n```') as { hook: string };
  assert.equal(parsed.hook, "坐下來");
});

test("demo connections never pretend to store OAuth tokens", () => {
  assert.equal(DEFAULT_CONNECTIONS.length, 3);
  for (const conn of DEFAULT_CONNECTIONS) {
    assert.equal(conn.status, "demo");
    assert.ok(conn.honesty.includes("token") || conn.honesty.includes("OAuth") || conn.honesty.includes("密鑰") || conn.honesty.includes("示範"));
  }
});
