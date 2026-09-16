import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyBrand } from "../studio/brand.ts";
import { lessonsFromInsights, lessonsFromLocalWork, mergeLearnedPatterns } from "./learning.ts";
import type { Campaign, ContentItem } from "./types.ts";

const campaign: Campaign = {
  id: "c1",
  name: "浮游禪光",
  type: "茶會",
  eventDate: "2026-09-24",
  eventTime: "19:00",
  location: "淡江校園",
  oneLiner: "下課後喘口氣",
  description: "",
  theme: "",
  studentPain: "剛開學課表很滿",
  cta: "保留這個晚上",
  registrationUrl: "",
  assetIds: [],
  createdAt: 1,
  updatedAt: 1,
};

const story: ContentItem = {
  id: "i1",
  campaignId: "c1",
  title: "社員故事",
  angle: "真實聲音",
  type: "社員故事",
  status: "complete",
  plannedAt: "2026-09-20",
  publishedAt: null,
  projectId: null,
  createdAt: 1,
  updatedAt: 1,
};

test("insights lessons stay empty when Instagram returned no rows", () => {
  assert.deepEqual(lessonsFromInsights([]), []);
  assert.deepEqual(lessonsFromInsights(undefined), []);
});

test("insights lessons only quote official numbers", () => {
  const lessons = lessonsFromInsights([
    { metric: "reach", label: "觸及", value: 128, period: "day" },
  ]);
  assert.match(lessons[0] ?? "", /觸及：128/);
  assert.match(lessons[0] ?? "", /不是模擬成效/);
});

test("local learning records student context and completed story types without inventing IG metrics", () => {
  const brand = createEmptyBrand("淡江大學禪學社");
  const lessons = lessonsFromLocalWork({
    brand,
    assets: [],
    campaigns: [campaign],
    contentItems: [story],
    insights: null,
  });
  assert.equal(lessons.some((item) => /課表很滿/.test(item)), true);
  assert.equal(lessons.some((item) => /社員故事/.test(item)), true);
  assert.equal(lessons.some((item) => /Insights/.test(item)), false);
});

test("mergeLearnedPatterns keeps newest unique lines", () => {
  assert.deepEqual(
    mergeLearnedPatterns(["先說學生生活"], ["先說學生生活", "時間地點集中"]),
    ["先說學生生活", "時間地點集中"],
  );
});
