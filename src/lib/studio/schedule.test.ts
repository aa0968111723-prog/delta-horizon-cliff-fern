import assert from "node:assert/strict";
import test from "node:test";
import { rhythmOf, rhythmWarnings, suggestScheduleForCampaign } from "./schedule.ts";
import type { Campaign, ContentItem } from "./types.ts";

const campaign: Campaign = {
  id: "c1",
  name: "浮游禪光",
  type: "tea",
  date: "2026-09-24",
  time: "19:00",
  location: "B302",
  oneLiner: "",
  description: "",
  theme: "",
  painPoints: ["stress"],
  cta: "直接來就好",
  signupUrl: "",
  coverAssetId: null,
  assetIds: [],
  strategy: {
    axis: "x",
    directions: [],
    chosenDirectionId: null,
    waves: [
      { id: "w1", role: "teaser", offsetDays: -7, contentType: "ig-post", title: "預熱", hook: "h", angle: "", contentId: null },
      { id: "w2", role: "life", offsetDays: -5, contentType: "ig-post", title: "生活", hook: "h", angle: "", contentId: null },
      { id: "w3", role: "keyvisual", offsetDays: -3, contentType: "carousel", title: "主視覺", hook: "h", angle: "", contentId: null },
      { id: "w4", role: "recap", offsetDays: 1, contentType: "recap", title: "回顧", hook: "h", angle: "", contentId: null },
    ],
    rhythmNote: "",
    generatedAt: 1,
    source: "mock",
  },
  createdAt: 1,
  updatedAt: 1,
};

function item(id: string, type: ContentItem["type"], at: number): ContentItem {
  return {
    id,
    campaignId: "c1",
    type,
    status: "scheduled",
    title: id,
    copy: { hook: "h", body: "", cta: "", hashtags: [], tone: "normal" },
    variants: [],
    imagePrompt: "",
    visualDirection: "",
    carousel: [],
    storyFrames: [],
    reels: [],
    threads: "",
    line: "",
    review: null,
    sources: [],
    projectId: null,
    coverAssetId: null,
    scheduledAt: at,
    publishedAt: null,
    metrics: null,
    createdAt: 1,
    updatedAt: 1,
    generatedBy: null,
  };
}

test("rhythmOf maps knowledge content to knowledge", () => {
  assert.equal(rhythmOf(item("k", "knowledge", 1), [campaign]), "knowledge");
});

test("rhythmWarnings fires after three promo posts in a row", () => {
  const day = Date.parse("2026-09-10T20:00:00+08:00");
  const contents = [
    item("a", "ig-post", day),
    item("b", "carousel", day + 86400000),
    item("c", "reels", day + 86400000 * 2),
  ];
  const warns = rhythmWarnings(contents, [campaign]);
  assert.ok(warns.length >= 1);
  assert.match(warns[0].message, /招生/);
});

test("suggestScheduleForCampaign skips waves that already have content", () => {
  const camp = {
    ...campaign,
    strategy: {
      ...campaign.strategy!,
      waves: campaign.strategy!.waves.map((w, i) => (i === 0 ? { ...w, contentId: "existing" } : w)),
    },
  };
  const plan = suggestScheduleForCampaign(camp, []);
  assert.equal(plan.length, 3);
  assert.ok(plan.every((p) => p.at > 0));
});
