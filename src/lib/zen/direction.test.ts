import assert from "node:assert/strict";
import test from "node:test";
import { applyDirectionToPlan, ensureRewriteDiffers } from "./direction.ts";
import { contentKindForWave } from "./schedule.ts";
import { proposedHook } from "./review.ts";

test("applyDirectionToPlan follows the picked visual, not a temple poster", () => {
  const plan = {
    campaignName: "茶會",
    concept: "坐下來",
    insight: "喘口氣",
    hook: "最近是不是很久沒有好好坐下來？",
    visualTheme: "舊",
    visualDirection: "舊",
    templateId: "editorial" as const,
    colorMood: "舊",
    eyebrow: "",
    headline: "舊標",
    subhead: "舊副",
    body: "正文",
    cta: "來坐一下",
    captions: [],
    hashtags: [],
    storyBeats: [],
    carouselPages: [],
    assetNeeds: [],
    checklist: [],
    altText: "",
    qaNotes: [],
    generatedAt: 1,
    source: "mock" as const,
    copyPacks: [{ tone: "student" as const, hook: "舊", body: "x", cta: "來坐一下", hashtags: [] }],
  };
  const next = applyDirectionToPlan(plan, {
    id: "b",
    name: "方向 B · 朋友位",
    concept: "空一個位子",
    palette: "霧園紙色",
    composition: "杯子",
    typeDirection: "口語",
    prompt: "tea cups",
    headline: "可以自己來？",
    subhead: "也可以揪人",
  });
  assert.match(next.visualDirection, /朋友位/);
  assert.equal(next.hook, "可以自己來？");
  assert.equal(next.copyPacks?.[0]?.hook, "可以自己來？");
  assert.equal("assignee" in next, false);
});

test("ensureRewriteDiffers never repeats the current hook", () => {
  const review = ensureRewriteDiffers(
    {
      wouldStop: "",
      understandable: "",
      tooReligious: "",
      tooSerious: "",
      tooLiterary: "",
      tooAi: "",
      tooLong: "",
      knowsWhat: "",
      knowsWhenWhere: "",
      wouldBringFriend: "",
      knowsHowToSignup: "",
      rewriteHook: "最近是不是連休息都覺得有罪惡感？",
      notes: [],
    },
    "最近是不是連休息都覺得有罪惡感？",
  );
  assert.notEqual(review.rewriteHook, "最近是不是連休息都覺得有罪惡感？");
  assert.doesNotMatch(review.rewriteHook, /誠摯/);
  assert.ok(review.rewriteHook.length > 8);
});

test("wave kinds mix life and promo so the grid is not all ads", () => {
  assert.equal(contentKindForWave("warmup"), "member-story");
  assert.equal(contentKindForWave("hero"), "carousel");
  assert.equal(contentKindForWave("reason"), "knowledge");
  assert.equal(contentKindForWave("recap"), "recap");
});

test("proposedHook leaves 誠摯邀請 behind", () => {
  assert.doesNotMatch(proposedHook("淡江大學禪學社誠摯邀請您"), /誠摯/);
});
