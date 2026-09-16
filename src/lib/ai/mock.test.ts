import assert from "node:assert/strict";
import test from "node:test";
import { composeMemoryHint } from "../zen/memory-hook.ts";
import { igSearchHookBlock } from "../zen/search.ts";
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
  brandName: "淡江大學禪學社",
  handle: "@tku.zen",
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
  assert.ok(plan.hashtags.some((tag) => tag.includes("淡江大學禪學社")));
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

test("buildMockPlan uses a live tea-party IG caption over older seed metrics", () => {
  const block = igSearchHookBlock(
    [
      {
        id: "ig_tea",
        caption: "可以自己來？\n下週茶會。",
        date: "2025-11-02",
        kind: "carousel",
        source: "instagram",
      },
    ],
    "下週有一場茶會",
  );
  const plan = buildMockPlan({
    ...base,
    eventName: "茶會",
    product: "茶會",
    audience: "淡江大一新生",
    brandName: "淡江大學禪學社",
    memoryHint: composeMemoryHint([
      block,
      "過去表現較好的 Hook：「課表排滿的時候，你還記得自己喜歡什麼嗎？」收藏 22",
    ]),
  });
  assert.match(plan.hook, /可以自己來/);
});

test("zen mock caption is a student post, not a brief dump", () => {
  const plan = buildMockPlan({
    ...base,
    eventName: "茶會",
    product: "茶會",
    audience: "淡江大一新生",
    brandName: "淡江大學禪學社",
    slogans: "",
    preferredCtas: "來坐一下",
    features: "下週有一場茶會\n一句介紹：\n學生痛點：開學後行程變滿\n主題：",
  });
  const blob = plan.captions.map((row) => row.text).join("\n");
  assert.doesNotMatch(blob, /一句介紹|學生痛點|這次看點/);
  assert.match(plan.hook, /[？?]/);
  assert.match(blob, /想找人一起/);
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

test("mock campaign reuses a field-note hook and remember line", () => {
  const plan = buildMockPlan({
    ...base,
    eventName: "浮游禪光",
    features: "一起坐坐",
    audience: "剛開學的淡江學生",
    brandMemory: "已學到的規律：現場：「浮游禪光」覺得像淡江的 Hook「下課後先不要急著回完所有訊息」、現場：「浮游禪光」實際來的人／反應：住宿生比較多、現場：「浮游禪光」下次要記得：時間放 Caption 最上面",
  });
  assert.equal(plan.hook, "下課後先不要急著回完所有訊息");
  assert.match(plan.insight, /住宿生比較多/);
  assert.equal(plan.checklist[0], "現場筆記：時間放 Caption 最上面");
  assert.doesNotMatch(plan.hook, /Insights|觀看次數/);
});
