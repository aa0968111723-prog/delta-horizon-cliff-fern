import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_CAMPAIGNS, DEFAULT_CONNECTIONS } from "./campaign-seed.ts";
import { briefFromCampaign, planFromCreativeWave, suggestedScheduleSlots } from "./creative-plan.ts";
import { buildLocalCreativeWave } from "./zen-prompt-engine.ts";
import { extractJsonObject, grokAvailable, grokCapRemaining, resetGrokCapForTests } from "../ai/grok.ts";
import { parseLiveWave } from "../ai/zen-wave.ts";

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

test("grok cap allows 24 live calls then blocks", () => {
  resetGrokCapForTests(0);
  assert.equal(grokCapRemaining().allowed, true);
  assert.equal(grokCapRemaining().remaining, 24);
  resetGrokCapForTests(24);
  assert.equal(grokCapRemaining().allowed, false);
  assert.equal(grokCapRemaining().remaining, 0);
  resetGrokCapForTests(0);
});

test("grokAvailable is false without XAI_API_KEY", () => {
  assert.equal(grokAvailable(), Boolean(process.env.XAI_API_KEY?.trim()));
});

test("parseLiveWave merges three directions and keeps campus CTA", () => {
  const json = JSON.stringify({
    directions: [
      {
        id: "direction-a",
        name: "生活感晨曦暖光",
        concept: "熱茶與窗邊微光",
        colorPalette: [{ name: "晨曦暖光", hex: "#D97736" }],
        composition: "手捧熱茶特寫留白",
        typography: "思源黑體",
        imagePrompt: "hands holding warm tea by a dorm window, morning light",
        headline: "最近是不是\n很久沒坐好",
        subhead: "09/24 活動中心",
        atmosphere: "明亮",
        aspectRatio: "4:5",
      },
      {
        id: "direction-b",
        name: "淡水夜青微光",
        concept: "下雨夜的安靜",
        colorPalette: [{ name: "淡水夜青", hex: "#1E3A4C" }],
        composition: "夜窗與宮燈",
        typography: "思源宋體",
        imagePrompt: "rainy tamsui night window with warm lamp",
        headline: "有時候需要的不是答案",
        subhead: "一個安靜的晚上",
        atmosphere: "安靜",
        aspectRatio: "4:5",
      },
      {
        id: "direction-c",
        name: "年輕手繪插畫感",
        concept: "克難坡喘氣後坐下",
        colorPalette: [{ name: "暖宣紙白", hex: "#F7F6F2" }],
        composition: "龜龜爬坡",
        typography: "手寫感",
        imagePrompt: "cute turtle catching breath after a campus hill",
        headline: "大學生活很自由",
        subhead: "但你最近真的有快樂嗎",
        atmosphere: "幽默",
        aspectRatio: "1:1",
      },
    ],
    hook: "最近是不是很久沒坐好",
    caption: "週四晚上活動中心，帶上想放空的心情。",
    cta: "主頁連結預約",
  });
  const wave = parseLiveWave(json, {
    topic: "09/24 浮游禪光",
    date: "2026-09-24 18:30",
    location: "活動中心",
    cta: "主頁連結預約",
  });
  assert.ok(wave);
  assert.equal(wave!.directions.length, 3);
  assert.equal(wave!.directions[0].id, "direction-a");
  assert.equal(wave!.directions[2].id, "direction-c");
  assert.equal(wave!.conversion.igPost.cta, "主頁連結預約");
  assert.ok(wave!.directions[0].headline.includes("最近是不是"));
});
