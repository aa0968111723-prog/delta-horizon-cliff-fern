import assert from "node:assert/strict";
import test from "node:test";
import { creativeSearch, expandCreativeQuery, groupSearchHits } from "./search.ts";
import { applyPackToWaves, copyKindForWave, emptyCampaign, nextWaveAngle, nextWaveVisual, scheduleItemsFromCampaign, suggestWaves } from "./schedule.ts";
import { canvaDraftNotes, canvaDraftTitle, canvaPresetForKind } from "./canva-draft.ts";
import { convertFromPlan, CONVERT_TARGETS, briefFlagsForTarget, captionForTarget } from "./convert.ts";
import { hitActionLabel, ideaFromHit, memorySourceFromHit } from "./from-hit.ts";
import { applyStudentRewrite } from "./review.ts";
import { migrateStatus } from "../studio/status.ts";
import { buildMockPlan } from "../ai/mock.ts";

test("migrateStatus maps old studio statuses", () => {
  assert.equal(migrateStatus("draft"), "creating");
  assert.equal(migrateStatus("ready"), "done");
  assert.equal(migrateStatus("exported"), "published");
  assert.equal(migrateStatus("idea"), "idea");
});

test("suggestWaves has no owner fields and covers recap", () => {
  const waves = suggestWaves({ date: "2026-09-24", type: "light", name: "浮游禪光" });
  assert.equal(waves.length, 8);
  assert.equal(waves.at(-1)?.kind, "recap");
  assert.ok(waves.every((w) => w.projectId === null));
});

test("creativeSearch finds turtle and floating light across sources", () => {
  const hits = creativeSearch("龜龜", {
    assets: [
      {
        id: "asset_turtle",
        name: "龜龜",
        kind: "image",
        category: "mascot",
        mime: "image/svg+xml",
        width: 1,
        height: 1,
        tags: ["龜龜"],
        createdAt: 1,
        updatedAt: 1,
        source: "seed",
        licenseNotes: "",
        licenseOwner: "",
        favorite: false,
        lastUsedAt: null,
        useCount: 0,
      },
    ],
    campaigns: [
      {
        id: "camp_floating_light",
        name: "浮游禪光",
        type: "light",
        date: "2026-09-24",
        time: "19:30",
        location: "淡江",
        tagline: "坐好",
        description: "",
        theme: "三色光",
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
    igPosts: [],
    memory: [
      {
        id: "m1",
        source: "drive",
        title: "龜龜角色",
        subtitle: "Google Drive / 品牌",
        tags: ["龜龜"],
        kind: "Logo",
      },
    ],
  });
  assert.ok(hits.some((h) => h.title.includes("龜龜")));
  const light = creativeSearch("浮游禪光", {
    assets: [],
    campaigns: [
      {
        id: "camp_floating_light",
        name: "浮游禪光",
        type: "light",
        date: "2026-09-24",
        time: "19:30",
        location: "淡江",
        tagline: "坐好",
        description: "",
        theme: "三色光",
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
    igPosts: [],
    memory: [],
  });
  assert.equal(light[0]?.source, "campaign");
});

test("convertFromPlan always returns carousel story reels threads line", () => {
  const out = convertFromPlan({
    campaignName: "茶會",
    concept: "",
    insight: "想找一個晚上",
    hook: "最近是不是很久沒坐好？",
    visualTheme: "",
    visualDirection: "",
    templateId: "quote",
    colorMood: "",
    eyebrow: "",
    headline: "坐好",
    subhead: "9/19 淡水",
    body: "茶",
    cta: "晚上見",
    captions: [{ style: "短版", text: "坐好" }],
    hashtags: [],
    storyBeats: [],
    carouselPages: [],
    assetNeeds: [],
    checklist: [],
    altText: "",
    qaNotes: [],
    generatedAt: 1,
    source: "mock",
  });
  assert.equal(out.carousel.length, 6);
  assert.ok(out.story.length >= 3);
  assert.equal(out.reels.length, 5);
  assert.ok(out.threads.includes("坐好"));
  assert.ok(out.line.includes("茶會"));
});

test("convert targets map six formats to canvas and calendar kinds", () => {
  assert.equal(CONVERT_TARGETS.length, 6);
  assert.deepEqual(
    CONVERT_TARGETS.map((t) => t.id),
    ["post", "carousel", "story", "reels", "threads", "line"],
  );
  assert.equal(CONVERT_TARGETS.find((t) => t.id === "story")?.formatId, "story");
  assert.equal(briefFlagsForTarget("carousel").carousel, true);
  assert.equal(briefFlagsForTarget("carousel").post, false);
  const converted = convertFromPlan({
    campaignName: "茶會",
    concept: "",
    insight: "想找一個晚上",
    hook: "最近是不是很久沒坐好？",
    visualTheme: "",
    visualDirection: "",
    templateId: "quote",
    colorMood: "",
    eyebrow: "",
    headline: "坐好",
    subhead: "9/19 淡水",
    body: "茶",
    cta: "晚上見",
    captions: [{ style: "短版", text: "坐好" }],
    hashtags: [],
    storyBeats: [],
    carouselPages: [],
    assetNeeds: [],
    checklist: [],
    altText: "",
    qaNotes: [],
    generatedAt: 1,
    source: "mock",
  });
  assert.match(captionForTarget(converted, "post"), /坐好/);
});

test("expandCreativeQuery adds tea night terms", () => {
  const { expanded } = expandCreativeQuery("找以前晚上的茶會照片");
  assert.ok(expanded.includes("茶會"));
  assert.ok(expanded.includes("night"));
  const grouped = groupSearchHits([
    { id: "1", source: "drive", title: "a", subtitle: "", tags: [] },
    { id: "2", source: "canva", title: "b", subtitle: "", tags: [] },
  ]);
  assert.equal(grouped[0]?.source, "drive");
});

test("ideaFromHit turns each source into a creation brief", () => {
  assert.match(
    ideaFromHit({ id: "1", source: "instagram", title: "坐好", subtitle: "2025-09-18", tags: [] }),
    /延續這則 IG/,
  );
  assert.match(
    ideaFromHit({ id: "2", source: "canva", title: "茶會", subtitle: "Canva", tags: [] }),
    /品牌 DNA/,
  );
  assert.match(
    ideaFromHit({ id: "3", source: "drive", title: "晚上茶會", subtitle: "Drive", tags: [] }),
    /Drive 素材/,
  );
  assert.match(
    ideaFromHit({ id: "4", source: "campaign", title: "浮游禪光", subtitle: "9/24", tags: [] }),
    /完整宣傳/,
  );
  assert.equal(
    hitActionLabel({ id: "2", source: "canva", title: "茶會", subtitle: "", tags: [] }),
    "用這個設計生成",
  );
  assert.equal(memorySourceFromHit({ id: "4", source: "campaign", title: "x", subtitle: "", tags: [] }), "brand");
  assert.equal(memorySourceFromHit({ id: "3", source: "drive", title: "x", subtitle: "", tags: [] }), "drive");
});

test("scheduleItemsFromCampaign maps waves without owners", () => {
  const waves = suggestWaves({ date: "2026-09-24", type: "light", name: "浮游禪光" });
  waves[0] = { ...waves[0], copyPreview: "最近是不是很久沒坐好？" };
  const items = scheduleItemsFromCampaign(
    {
      id: "camp_x",
      name: "浮游禪光",
      type: "light",
      date: "2026-09-24",
      time: "19:30",
      location: "淡江",
      tagline: "坐好",
      description: "",
      theme: "",
      studentPain: "",
      cta: "晚上見",
      signupUrl: "",
      coverAssetId: null,
      relatedAssetIds: [],
      projectIds: [],
      waves,
      createdAt: 1,
      updatedAt: 1,
    },
    "scheduled",
  );
  assert.equal(items.length, 8);
  assert.equal(items[0]?.id, `sch_${waves[0].id}`);
  assert.equal(items[0]?.status, "scheduled");
  assert.equal(items[0]?.captionPreview, "最近是不是很久沒坐好？");
  assert.equal(items.find((row) => row.title.startsWith("今晚"))?.contentKind, "story");
  assert.ok(items.every((row) => row.campaignId === "camp_x"));
  assert.ok(items.every((row) => !("assignee" in row) && !("reviewer" in row)));
});

test("applyStudentRewrite swaps the first sentence", () => {
  const next = applyStudentRewrite({
    hook: "淡江大學禪學社誠摯邀請您",
    body: "淡江大學禪學社誠摯邀請您來坐。",
    cta: "晚上見",
    hashtags: [],
    variants: [{ style: "一般版", text: "淡江大學禪學社誠摯邀請您來坐。" }],
    studentReview: {
      wouldStop: "不會",
      understandable: "",
      tooReligious: "太宗教",
      tooSerious: "",
      tooLiterary: "",
      tooAi: "",
      tooLong: "",
      knowsWhat: "",
      knowsWhenWhere: "",
      wouldBringFriend: "",
      knowsSignup: "",
      notes: [],
      rewriteHook: "最近是不是連休息都覺得有罪惡感？",
    },
  });
  assert.equal(next.hook, "最近是不是連休息都覺得有罪惡感？");
  assert.match(next.body, /連休息/);
  assert.ok(next.studentReview.notes.some((line) => line.includes("原第一句")));
});

test("applyPackToWaves fills every wave without owners", () => {
  const plan = buildMockPlan({
    eventName: "浮游禪光",
    schedule: "9/24 19:30",
    location: "淡江大學淡水校園",
    product: "浮游禪光",
    offer: "",
    audience: "淡江大學學生",
    goal: "awareness",
    features: "三色光",
    style: "空氣",
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
  const camp = emptyCampaign({ name: "浮游禪光", date: "2026-09-24", tagline: "舊句" });
  camp.waves = suggestWaves({ date: "2026-09-24", type: "light", name: "浮游禪光" });
  const next = applyPackToWaves(camp, {
    campaignName: plan.campaignName,
    insight: plan.insight,
    studentContext: "淡江大學學生",
    foundCount: 3,
    citedSources: [],
    directions: plan.visualDirections,
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
        wouldBringFriend: "可以找朋友。",
        knowsSignup: "",
        notes: [],
        rewriteHook: "最近是不是連休息都覺得有罪惡感？",
      },
    },
  });
  assert.equal(next.waves.length, 8);
  assert.ok(next.waves.every((wave) => (wave.copyPreview ?? "").length > 0));
  assert.ok(next.tagline.includes("休息") || next.tagline.includes("坐好"));
  assert.ok(next.waves.every((wave) => !("assignee" in wave)));
});

test("nextWaveAngle and nextWaveVisual rotate without owners", () => {
  const first = nextWaveAngle("emotion", 0);
  const second = nextWaveAngle("emotion", first.index);
  assert.notEqual(first.angle, second.angle);
  const visual = nextWaveVisual("我要宣傳茶會", 0);
  assert.ok(visual.direction.imagePrompt.length > 10);
  assert.equal(visual.index, 1);
});

test("copy kinds include Q&A poll and member stories", async () => {
  const { COPY_KIND_IDS } = await import("./voice.ts");
  assert.ok(COPY_KIND_IDS.includes("qa"));
  assert.ok(COPY_KIND_IDS.includes("poll"));
  assert.ok(COPY_KIND_IDS.includes("member"));
  assert.equal(copyKindForWave("day-of"), "story");
  assert.equal(copyKindForWave("emotion"), "emotion");
});

test("canva draft title includes hook and stays short", () => {
  const title = canvaDraftTitle("浮游禪光", "最近是不是很久沒有好好坐下來？");
  assert.match(title, /浮游禪光/);
  assert.ok(title.length <= 50);
  assert.equal(canvaPresetForKind("story"), "instagramStory");
  assert.equal(canvaPresetForKind("reels"), "instagramReel");
  assert.match(canvaDraftNotes({ hook: "坐好", cta: "晚上見", signupUrl: "https://forms" }), /報名/);
});
