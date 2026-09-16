import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyBrief,
  formatsFromBrief,
  migrateBrief,
  migratePlan,
  migratePlanVersions,
} from "./brief.ts";

test("migrateBrief maps product to eventName and fills deliverables", () => {
  const next = migrateBrief({
    product: "週末手沖",
    audience: "附近住戶",
    goal: "traffic",
  });
  assert.equal(next.eventName, "週末手沖");
  assert.equal(next.product, "週末手沖");
  assert.equal(next.schedule, "");
  assert.equal(next.deliverables.post, true);
  assert.equal(next.deliverables.carousel, false);
  assert.equal(next.goal, "traffic");
});

test("emptyBrief has a usable default post deliverable", () => {
  const brief = emptyBrief();
  assert.equal(brief.eventName, "");
  assert.equal(brief.deliverables.post, true);
  assert.equal(brief.goal, "awareness");
});

test("formatsFromBrief picks feed, story and reels from flags", () => {
  const brief = migrateBrief({
    eventName: "活動",
    audience: "客人",
    deliverables: { post: false, story: true, carousel: true, reels: true, threads: false, line: false },
  });
  assert.deepEqual(formatsFromBrief(brief, "feed-square"), ["feed-square", "story", "reels-cover"]);
});

test("migratePlan fills concept, visualTheme, checklist and source", () => {
  const plan = migratePlan({
    campaignName: "九月單品",
    insight: "不要折扣口氣",
    hook: "這個月只烘一個產地。",
    visualDirection: "上圖下文",
    colorMood: "亞麻",
    captions: [{ style: "敘事", text: "文案" }],
    hashtags: ["#日食"],
    qaNotes: ["Logo 不壓杯緣"],
    generatedAt: 1,
  });
  assert.ok(plan);
  assert.equal(plan.concept, "不要折扣口氣");
  assert.equal(plan.visualTheme, "亞麻");
  assert.equal(plan.headline, "這個月只烘一個產地。");
  assert.deepEqual(plan.checklist, ["Logo 不壓杯緣"]);
  assert.equal(plan.source, "live");
  assert.equal(plan.cta, "了解更多");
});

test("migratePlanVersions hydrates from a fallback plan", () => {
  const plan = migratePlan({
    campaignName: "初稿",
    captions: [],
    generatedAt: 42,
    source: "mock",
  });
  const versions = migratePlanVersions(undefined, plan);
  assert.equal(versions.length, 1);
  assert.equal(versions[0].source, "mock");
  assert.equal(versions[0].plan.campaignName, "初稿");
});
