import assert from "node:assert/strict";
import test from "node:test";
import { buildMockPlan } from "./mock.ts";
import type { BriefInput } from "./schema.ts";

const base: BriefInput = {
  eventName: "週末手沖體驗",
  schedule: "週六下午",
  location: "大安門市",
  product: "手沖席",
  offer: "兩人座預約制",
  audience: "附近想慢慢喝的人",
  goal: "traffic",
  features: "兩人座、預約、現場手沖",
  style: "安靜",
  notes: "",
  wantPost: true,
  wantStory: true,
  wantCarousel: true,
  wantReels: false,
  brandName: "日食咖啡",
  handle: "@nisshoku.coffee",
  voice: "沉靜",
  doSay: "單品",
  dontSay: "爆款",
  forbiddenWords: ["爆款", "錯過就沒有"],
  slogans: "這個月只烘一個產地。",
  preferredCtas: "到店手沖／查看地點",
};

test("buildMockPlan is structured Traditional Chinese and marked mock", () => {
  const plan = buildMockPlan(base);
  assert.equal(plan.source, "mock");
  assert.equal(plan.campaignName, "週末手沖體驗");
  assert.ok(plan.concept.includes("附近想慢慢喝的人"));
  assert.ok(plan.visualTheme.length > 4);
  assert.ok(plan.headline.length > 0);
  assert.ok(plan.cta.length >= 2);
  assert.ok(plan.captions[0]?.text.includes("週六下午"));
  assert.ok(plan.hashtags.some((tag) => tag.includes("日食")));
  assert.equal(plan.carouselPages.length, 6);
  assert.deepEqual(
    plan.carouselPages.map((page) => page.role),
    ["cover", "problem", "detail", "proof", "cta", "close"],
  );
  assert.ok(plan.assetNeeds.some((need) => need.kind === "photo"));
  assert.ok(plan.checklist.length >= 4);
  assert.equal(plan.storyBeats.length, 3);
  assert.equal(plan.templateId, "product");
});

test("buildMockPlan uses the learned IG hook for 禪學社", () => {
  const plan = buildMockPlan({
    eventName: "茶會",
    schedule: "下週三 19:00",
    location: "淡江大學淡水校園",
    product: "茶會",
    offer: "",
    audience: "淡江大一新生",
    goal: "traffic",
    features: "坐下、茶",
    style: "生活感",
    notes: "",
    wantPost: true,
    wantStory: true,
    wantCarousel: true,
    wantReels: true,
    brandName: "淡江大學禪學社",
    handle: "@tamkang.zen",
    voice: "自然",
    doSay: "坐下來",
    dontSay: "誠摯邀請",
    forbiddenWords: ["誠摯邀請"],
    memoryHint: "品牌記憶：霧園。過去表現較好的 Hook：「課表排滿的時候，你還記得自己喜歡什麼嗎？」收藏 22",
  });
  assert.match(plan.hook, /課表排滿/);
  assert.match(plan.copyPacks?.[0]?.hook ?? "", /課表排滿/);
  assert.match(plan.directions?.[0]?.headline ?? "", /課表排滿/);
});

test("buildMockPlan strips forbidden words", () => {
  const plan = buildMockPlan({
    ...base,
    eventName: "爆款手沖",
    wantCarousel: false,
    wantStory: false,
  });
  const blob = `${plan.concept}\n${plan.hook}\n${plan.captions.map((c) => c.text).join("\n")}`;
  assert.equal(blob.includes("爆款"), false);
  assert.equal(plan.carouselPages.length, 1);
  assert.equal(plan.source, "mock");
});
