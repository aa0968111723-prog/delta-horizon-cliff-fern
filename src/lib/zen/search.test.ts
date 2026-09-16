import assert from "node:assert/strict";
import test from "node:test";
import { SEED_MEMORY } from "./memory.ts";
import { creativeSearch, expandCreativeQuery, groupSearchHits, knowledgeFromHits, searchCreativeKnowledge, searchTerms } from "./search.ts";
import { applyPackToWaves, contentKindForWave, copyKindForWave, emptyCampaign, nextWaveAngle, nextWaveVisual, rhythmHint, scheduleItemsFromCampaign, schedulePreviewAssetId, suggestWaves, waveOffsets } from "./schedule.ts";
import { canvaDraftNotes, canvaDraftTitle, canvaPresetForAspect, canvaPresetForKind } from "./canva-draft.ts";
import { convertFromPlan, CONVERT_TARGETS, aspectForTarget, briefFlagsForTarget, captionForTarget, contentKindForFormat, convertTargetForFormat } from "./convert.ts";
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
  assert.equal(aspectForTarget("story"), "9:16");
  assert.equal(aspectForTarget("line"), "1:1");
  assert.equal(contentKindForFormat("reels-cover"), "reels");
  assert.equal(convertTargetForFormat("story"), "story");
});

test("expandCreativeQuery adds tea night terms", () => {
  const { expanded, terms } = expandCreativeQuery("找以前晚上的茶會照片");
  assert.ok(expanded.includes("茶會"));
  assert.ok(expanded.includes("night"));
  assert.ok(terms.includes("茶會"));
  assert.ok(terms.includes("晚上"));
  assert.equal(searchTerms("找有龜龜的素材").includes("龜龜"), true);
  const grouped = groupSearchHits([
    { id: "1", source: "drive", title: "a", subtitle: "", tags: [] },
    { id: "2", source: "canva", title: "b", subtitle: "", tags: [] },
  ]);
  assert.equal(grouped[0]?.source, "drive");
});

test("natural language search finds tea night and ranks turtle first", () => {
  const input = {
    assets: [
      {
        id: "asset_tea_night",
        name: "夜晚茶會",
        kind: "image" as const,
        category: "photo" as const,
        mime: "image/svg+xml",
        width: 1,
        height: 1,
        tags: ["茶會", "晚上", "同學互動"],
        createdAt: 1,
        updatedAt: 1,
        source: "seed" as const,
        licenseNotes: "",
        licenseOwner: "",
        favorite: false,
        lastUsedAt: null,
        useCount: 0,
      },
      {
        id: "asset_turtle",
        name: "龜龜",
        kind: "image" as const,
        category: "mascot" as const,
        mime: "image/svg+xml",
        width: 1,
        height: 1,
        tags: ["龜龜", "吉祥物"],
        createdAt: 1,
        updatedAt: 1,
        source: "seed" as const,
        licenseNotes: "",
        licenseOwner: "",
        favorite: false,
        lastUsedAt: null,
        useCount: 0,
      },
      {
        id: "asset_club_mark",
        name: "禪學社標誌",
        kind: "logo" as const,
        category: "logo" as const,
        mime: "image/svg+xml",
        width: 1,
        height: 1,
        tags: ["logo", "龜龜"],
        createdAt: 1,
        updatedAt: 1,
        source: "seed" as const,
        licenseNotes: "",
        licenseOwner: "",
        favorite: false,
        lastUsedAt: null,
        useCount: 0,
      },
    ],
    campaigns: [],
    igPosts: [],
    memory: SEED_MEMORY,
  };
  const tea = creativeSearch("找以前晚上的茶會照片", input);
  assert.ok(tea.some((hit) => hit.title.includes("茶會")));
  assert.ok(tea[0]?.title.includes("茶") || (tea[0]?.tags ?? []).includes("茶會"));
  const turtle = creativeSearch("找有龜龜的素材", input);
  assert.ok(turtle[0]?.title.includes("龜龜"));
  assert.ok(turtle.length >= 2);
});

test("searchCreativeKnowledge cites Drive Canva and IG for tea", () => {
  const world = searchCreativeKnowledge("下週有一場茶會", {
    assets: [
      {
        id: "asset_tea_night",
        name: "夜晚茶會",
        kind: "image" as const,
        category: "photo" as const,
        mime: "image/svg+xml",
        width: 1,
        height: 1,
        tags: ["茶會", "晚上"],
        createdAt: 1,
        updatedAt: 1,
        source: "seed" as const,
        licenseNotes: "",
        licenseOwner: "",
        favorite: false,
        lastUsedAt: null,
        useCount: 0,
      },
    ],
    campaigns: [],
    igPosts: [
      {
        id: "ig_tea",
        mediaType: "image",
        caption: "茶會晚上，來坐一下不用先懂禪。",
        postedAt: 1,
        assetId: "asset_tea_night",
        likes: 10,
        comments: 1,
        saves: 8,
        reach: 400,
        hook: "來坐一下",
      },
    ],
    memory: SEED_MEMORY,
  });
  assert.ok(world.foundCount >= 3);
  assert.ok(world.sources.some((src) => src.source === "drive" && src.label.includes("茶會")));
  assert.ok(world.sources.some((src) => src.source === "canva"));
  assert.ok(world.sources.some((src) => src.source === "instagram"));
  assert.match(world.notes, /Google Drive/);
  const cited = knowledgeFromHits(world.hits);
  assert.equal(cited.foundCount, world.foundCount);
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
  assert.equal(items.find((row) => row.title.startsWith("預告"))?.contentKind, "knowledge");
  assert.equal(items.find((row) => row.title.startsWith("為什麼來"))?.contentKind, "member-story");
  assert.ok(items.every((row) => row.campaignId === "camp_x"));
  assert.ok(items.every((row) => !("assignee" in row) && !("reviewer" in row)));
});

test("waveOffsets compress when the event is soon and recruit starts earlier", () => {
  const soon = waveOffsets({ date: "2026-09-24", type: "tea", now: new Date("2026-09-20T12:00:00+08:00") });
  assert.equal(soon.tease, -4);
  assert.equal(soon.recap, 1);
  const recruit = waveOffsets({ date: "2026-10-20", type: "recruit", now: new Date("2026-09-16T12:00:00+08:00") });
  assert.equal(recruit.tease, -18);
  const light = waveOffsets({ date: "2026-10-20", type: "light", now: new Date("2026-09-16T12:00:00+08:00") });
  assert.equal(light.tease, -14);
  assert.equal(contentKindForWave("tease"), "knowledge");
  assert.equal(contentKindForWave("reason"), "member-story");
  assert.equal(contentKindForWave("day-of"), "story");
  assert.match(rhythmHint([{ contentKind: "ig-post" }, { contentKind: "carousel" }, { contentKind: "ig-post" }]), /招生/);
});

test("schedulePreviewAssetId uses campaign cover and related thumbs", () => {
  const camp = emptyCampaign({
    id: "camp_preview",
    coverAssetId: "asset_cover",
    relatedAssetIds: ["asset_cover", "asset_story"],
  });
  assert.equal(
    schedulePreviewAssetId({ campaignId: camp.id, contentKind: "ig-post" }, [camp]),
    "asset_cover",
  );
  assert.equal(
    schedulePreviewAssetId({ campaignId: camp.id, contentKind: "story" }, [camp]),
    "asset_story",
  );
  assert.equal(schedulePreviewAssetId({ campaignId: null, contentKind: "ig-post" }, [camp]), null);
  assert.equal(
    schedulePreviewAssetId(
      {
        campaignId: camp.id,
        contentKind: "carousel",
        sequence: { assetIds: ["asset_p1", "asset_p2"] },
      },
      [camp],
    ),
    "asset_p1",
  );
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
  assert.equal(copyKindForWave("tease"), "knowledge");
  assert.equal(copyKindForWave("reason"), "member");
});

test("canva draft title includes hook and stays short", () => {
  const title = canvaDraftTitle("浮游禪光", "最近是不是很久沒有好好坐下來？");
  assert.match(title, /浮游禪光/);
  assert.ok(title.length <= 50);
  assert.equal(canvaPresetForKind("story"), "instagramStory");
  assert.equal(canvaPresetForKind("reels"), "instagramReel");
  assert.equal(canvaPresetForAspect("9:16"), "instagramStory");
  assert.equal(canvaPresetForAspect("4:5"), "instagramPost");
  assert.match(canvaDraftNotes({ hook: "坐好", cta: "晚上見", signupUrl: "https://forms" }), /報名/);
});
