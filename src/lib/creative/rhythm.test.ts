import assert from "node:assert/strict";
import test from "node:test";
import { buildCampaignRhythm, contentTypeDeliverables } from "./rhythm.ts";
import type { Campaign } from "./types.ts";

function campaign(eventDate: string): Campaign {
  return {
    id: "campaign_test",
    name: "秋夜茶會",
    type: "茶會",
    eventDate,
    eventTime: "19:00–21:00",
    location: "淡江大學",
    oneLiner: "一起喝茶、坐坐。",
    description: "",
    theme: "慢下來",
    studentPain: "期中壓力",
    cta: "找朋友一起來",
    registrationUrl: "",
    assetIds: [],
    createdAt: 0,
    updatedAt: 0,
  };
}

test("long campaign rhythm mixes resonance, information, interaction and recap", () => {
  const items = buildCampaignRhythm(
    campaign("2026-10-01"),
    new Date("2026-09-16T00:00:00+08:00"),
  );
  assert.equal(items.length, 8);
  assert.deepEqual(
    items.map((item) => item.type),
    ["Story", "IG Post", "Carousel", "Threads", "互動投票", "倒數", "Story", "活動回顧"],
  );
  assert.ok(items.every((item) => item.status === "idea"));
  assert.ok(items.every((item) => item.campaignId === "campaign_test"));
});

test("short campaign rhythm stays useful without inventing a two-week runway", () => {
  const items = buildCampaignRhythm(
    campaign("2026-09-20"),
    new Date("2026-09-16T00:00:00+08:00"),
  );
  assert.deepEqual(items.map((item) => item.type), ["IG Post", "Carousel", "倒數", "Story", "活動回顧"]);
});

test("content types map to existing Studio deliverables", () => {
  assert.deepEqual(contentTypeDeliverables("Carousel"), {
    post: false,
    carousel: true,
    story: false,
    reels: false,
  });
  assert.equal(contentTypeDeliverables("互動投票").story, true);
  assert.equal(contentTypeDeliverables("Reels").reels, true);
});
