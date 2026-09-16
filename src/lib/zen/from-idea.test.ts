import assert from "node:assert/strict";
import test from "node:test";
import { buildMockPlan } from "../ai/mock.ts";
import { convertStaggerDays, formatSuitePlan, isCreateQuery, materializeCampaignFromPack, parseEventIdea } from "./from-idea.ts";

const now = new Date("2026-09-16T12:00:00+08:00");

test("parseEventIdea understands next-week tea night", () => {
  const parsed = parseEventIdea("下週有一場茶會", now);
  assert.equal(parsed.type, "tea");
  assert.equal(parsed.name, "茶會");
  assert.equal(parsed.date, "2026-09-23");
  assert.equal(parsed.time, "19:30");
  assert.equal(parsed.location, "淡江大學淡水校園");
});

test("parseEventIdea strips I-want filler from tea promo", () => {
  const parsed = parseEventIdea("我要宣傳茶會", now);
  assert.equal(parsed.type, "tea");
  assert.equal(parsed.name, "茶會");
});

test("isCreateQuery treats a tea brief as create and a find query as search", () => {
  assert.equal(isCreateQuery("下週有一場茶會"), true);
  assert.equal(isCreateQuery("幫我做新的茶會宣傳"), true);
  assert.equal(isCreateQuery("我要宣傳茶會"), true);
  assert.equal(isCreateQuery("找以前晚上的茶會照片"), false);
  assert.equal(isCreateQuery("找有龜龜的素材"), false);
});

test("parseEventIdea keeps floating light date", () => {
  const parsed = parseEventIdea("09/24 浮游禪光", now);
  assert.equal(parsed.type, "light");
  assert.equal(parsed.name, "浮游禪光");
  assert.equal(parsed.date, "2026-09-24");
});

test("materializeCampaignFromPack fills waves without owners", () => {
  const plan = buildMockPlan({
    eventName: "茶會",
    schedule: "2026-09-23 19:30",
    location: "淡江大學淡水校園",
    product: "茶會",
    offer: "",
    audience: "淡江大學學生",
    goal: "awareness",
    features: "坐下來",
    style: "",
    notes: "",
    wantPost: true,
    wantStory: true,
    wantCarousel: true,
    wantReels: true,
    brandName: "淡江大學禪學社",
    handle: "@tkuzen",
    voice: "",
    doSay: "",
    dontSay: "",
    forbiddenWords: [],
  });
  const campaign = materializeCampaignFromPack({
    idea: "下週有一場茶會",
    campaigns: [],
    pack: {
      campaignName: plan.campaignName,
      insight: plan.insight,
      studentContext: "淡江大學學生",
      foundCount: 3,
      citedSources: [],
      directions: plan.visualDirections ?? [],
      plan,
      copy: {
        hook: plan.hook,
        body: plan.captions[0]?.text ?? "",
        cta: plan.cta,
        hashtags: plan.hashtags,
        variants: plan.captions,
        studentReview: plan.studentReview ?? {
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
          knowsSignup: "",
          notes: [],
          rewriteHook: "",
        },
      },
    },
  });
  assert.equal(campaign.date, "2026-09-23");
  assert.equal(campaign.waves.length, 8);
  assert.ok(campaign.waves.every((wave) => (wave.copyPreview ?? "").length > 0));
  assert.ok(campaign.waves.every((wave) => !("assignee" in wave) && !("reviewer" in wave)));
});

test("convertStaggerDays keeps formats off the same night", () => {
  assert.equal(convertStaggerDays("post"), 0);
  assert.equal(convertStaggerDays("story"), 1);
  assert.equal(convertStaggerDays("threads"), 2);
  assert.equal(convertStaggerDays("carousel"), 3);
  assert.equal(convertStaggerDays("line"), 4);
  assert.equal(convertStaggerDays("reels"), 5);
  assert.equal(new Set(["post", "story", "threads", "carousel", "line", "reels"].map(convertStaggerDays)).size, 6);
});

test("formatSuitePlan sequences carousel, story, and reels instead of reusing the post", () => {
  const plan = buildMockPlan({
    eventName: "茶會",
    schedule: "2026-09-23 19:30",
    location: "淡江大學淡水校園",
    product: "茶會",
    offer: "",
    audience: "淡江大學學生",
    goal: "awareness",
    features: "坐下來",
    style: "",
    notes: "",
    wantPost: true,
    wantStory: true,
    wantCarousel: true,
    wantReels: true,
    brandName: "淡江大學禪學社",
    handle: "@tkuzen",
    voice: "",
    doSay: "",
    dontSay: "",
    forbiddenWords: [],
  });
  const suite = formatSuitePlan({
    campaignName: plan.campaignName,
    insight: plan.insight,
    studentContext: "淡江大學學生",
    foundCount: 3,
    citedSources: [],
    directions: plan.visualDirections ?? [],
    plan,
    copy: {
      hook: plan.hook,
      body: plan.captions[0]?.text ?? "",
      cta: plan.cta,
      hashtags: plan.hashtags,
      variants: plan.captions,
      studentReview: plan.studentReview ?? {
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
        knowsSignup: "",
        notes: [],
        rewriteHook: "",
      },
    },
  });
  assert.equal(suite.length, 6);
  assert.equal(new Set(suite.map((step) => step.days)).size, 6);
  assert.equal(suite.find((step) => step.id === "carousel")?.mode, "sequence");
  assert.equal(suite.find((step) => step.id === "story")?.mode, "sequence");
  assert.equal(suite.find((step) => step.id === "reels")?.mode, "sequence");
  assert.equal(suite.find((step) => step.id === "carousel")?.reuseFrom, null);
  assert.equal(suite.find((step) => step.id === "line")?.reuseFrom, "threads");
  assert.equal(suite.filter((step) => step.mode === "generate").length, 2);
  assert.equal(suite.filter((step) => step.mode === "sequence").length, 3);
  assert.ok(suite.every((step) => step.caption.length > 0));
  assert.ok(suite.find((step) => step.id === "carousel")?.caption.startsWith(plan.hook));
  assert.ok(suite.find((step) => step.id === "story")?.caption.startsWith(plan.hook));
});

test("materializeCampaignFromPack reuses floating light date", () => {
  const plan = buildMockPlan({
    eventName: "浮游禪光",
    schedule: "2026-09-24 19:30",
    location: "淡江大學淡水校園",
    product: "浮游禪光",
    offer: "",
    audience: "淡江大學學生",
    goal: "awareness",
    features: "",
    style: "",
    notes: "",
    wantPost: true,
    wantStory: true,
    wantCarousel: true,
    wantReels: true,
    brandName: "淡江大學禪學社",
    handle: "@tkuzen",
    voice: "",
    doSay: "",
    dontSay: "",
    forbiddenWords: [],
  });
  const existing = materializeCampaignFromPack({
    idea: "09/24 浮游禪光",
    campaigns: [
      {
        id: "camp_floating_light",
        name: "浮游禪光",
        type: "light",
        date: "2026-09-24",
        time: "19:30",
        location: "淡江大學淡水校園",
        tagline: "最近是不是很久沒有好好坐下來？",
        description: "",
        theme: "",
        studentPain: "",
        cta: "晚上見",
        signupUrl: "",
        coverAssetId: null,
        relatedAssetIds: [],
        projectIds: [],
        waves: [],
        createdAt: 1,
        updatedAt: 1,
      },
    ],
    pack: {
      campaignName: plan.campaignName,
      insight: plan.insight,
      studentContext: "淡江大學學生",
      foundCount: 3,
      citedSources: [],
      directions: plan.visualDirections ?? [],
      plan,
      copy: {
        hook: plan.hook,
        body: plan.captions[0]?.text ?? "",
        cta: plan.cta,
        hashtags: plan.hashtags,
        variants: plan.captions,
        studentReview: plan.studentReview ?? {
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
          knowsSignup: "",
          notes: [],
          rewriteHook: "",
        },
      },
    },
  });
  assert.equal(existing.id, "camp_floating_light");
  assert.equal(existing.date, "2026-09-24");
  assert.equal(existing.waves.length, 8);
});
