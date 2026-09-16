import assert from "node:assert/strict";
import test from "node:test";
import { campaignImageIdea, campaignToBrief } from "./brief-from-campaign.ts";
import type { Campaign, ContentItem } from "./types.ts";

const campaign: Campaign = {
  id: "c1",
  name: "浮游禪光茶會",
  type: "茶會",
  eventDate: "2026-09-24",
  eventTime: "19:00–21:00",
  location: "淡江大學校園",
  oneLiner: "下課後喘口氣",
  description: "不用先懂禪",
  theme: "忙亂裡留空間",
  studentPain: "期中報告很多",
  cta: "找朋友一起來",
  registrationUrl: "",
  assetIds: [],
  createdAt: 1,
  updatedAt: 1,
};

test("campaign brief carries student context and does not invent registration", () => {
  const brief = campaignToBrief(campaign);
  assert.equal(brief.eventName, "浮游禪光茶會");
  assert.match(brief.audience ?? "", /期中報告很多/);
  assert.equal(brief.offer, "找朋友一起來");
  assert.match(brief.notes ?? "", /報名方式尚未填/);
  assert.equal(brief.deliverables?.reels, true);
});

test("content-item brief narrows deliverables for Story", () => {
  const item: ContentItem = {
    id: "i1",
    campaignId: campaign.id,
    title: "先留一個晚上",
    angle: "預告但不塞滿",
    type: "Story",
    status: "idea",
    plannedAt: "2026-09-23T19:00:00.000Z",
    publishedAt: null,
    projectId: null,
    createdAt: 1,
    updatedAt: 1,
  };
  const brief = campaignToBrief(campaign, item);
  assert.equal(brief.deliverables?.story, true);
  assert.equal(brief.deliverables?.carousel, false);
  assert.match(brief.notes ?? "", /先留一個晚上/);
});

test("image idea includes the student situation, not a product pitch", () => {
  const idea = campaignImageIdea(campaign);
  assert.match(idea, /浮游禪光茶會/);
  assert.match(idea, /期中報告很多/);
  assert.doesNotMatch(idea, /優惠|限時瘋搶/);
});
