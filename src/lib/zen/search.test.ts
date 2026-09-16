import assert from "node:assert/strict";
import test from "node:test";
import { SEED_MEMORY } from "./memory.ts";
import { creativeSearch, expandCreativeQuery, groupSearchHits, knowledgeFromHits, searchCreativeKnowledge, searchTerms } from "./search.ts";
import { applyConvertedSlot, applyPackToWaves, contentKindForWave, copyKindForWave, dueScheduleItems, emptyCampaign, fillKeptWaveRows, mergeSuiteIntoSchedule, nextWaveAngle, nextWaveVisual, packWithDirection, pickFocusDay, preferSuiteSchedule, previewBindForSchedule, projectForKeptWave, rhythmHint, scheduleItemForPreview, scheduleItemsFromCampaign, schedulePreviewAssetId, shiftScheduleDay, spreadSchedule, suggestWaves, suiteCoversWave, upcomingScheduleItems, waveOffsets, wrapOverlayHeadline } from "./schedule.ts";
import { canvaDraftNotes, canvaDraftTitle, canvaPresetForAspect, canvaPresetForKind } from "./canva-draft.ts";
import { convertFromPlan, CONVERT_TARGETS, aspectForTarget, briefFlagsForTarget, captionForTarget, contentKindForFormat, convertTargetForFormat } from "./convert.ts";
import { hitActionLabel, ideaFromHit, memorySourceFromHit } from "./from-hit.ts";
import { applyStudentRewrite } from "./review.ts";
import { migrateStatus } from "../studio/status.ts";
import { buildMockPlan } from "../ai/mock.ts";
import type { ScheduleItem } from "./types.ts";

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

test("preferSuiteSchedule drops unpublished wave placeholders covered by the format suite", () => {
  const waves = suggestWaves({ date: "2026-09-24", type: "tea", name: "茶會" });
  const campaign = emptyCampaign({
    id: "camp_tea",
    name: "茶會",
    date: "2026-09-24",
    waves,
  });
  const waveItems = scheduleItemsFromCampaign(campaign, "creating");
  const suite = [
    {
      id: "sch_suite_post",
      title: "IG Post · 茶會",
      contentKind: "ig-post" as const,
      status: "scheduled" as const,
      scheduledAt: Date.parse("2026-09-18T20:00:00+08:00"),
      publishedAt: null,
      projectId: "p1",
      campaignId: "camp_tea",
      captionPreview: "坐好",
    },
    {
      id: "sch_suite_car",
      title: "Carousel · 茶會",
      contentKind: "carousel" as const,
      status: "scheduled" as const,
      scheduledAt: Date.parse("2026-09-20T20:00:00+08:00"),
      publishedAt: null,
      projectId: "p2",
      campaignId: "camp_tea",
      captionPreview: "坐好",
      sequence: { kind: "carousel" as const, projectId: "p2", assetIds: ["a"], labels: ["1"] },
    },
    {
      id: "sch_suite_story",
      title: "Story · 茶會",
      contentKind: "story" as const,
      status: "scheduled" as const,
      scheduledAt: Date.parse("2026-09-19T20:00:00+08:00"),
      publishedAt: null,
      projectId: "p3",
      campaignId: "camp_tea",
      captionPreview: "坐好",
    },
  ];
  const next = preferSuiteSchedule([...waveItems, ...suite]);
  const titles = next.map((item) => item.title);
  assert.ok(titles.includes("IG Post · 茶會"));
  assert.ok(titles.includes("Carousel · 茶會"));
  assert.ok(titles.includes("Story · 茶會"));
  assert.equal(titles.some((title) => title.startsWith("主視覺")), false);
  assert.equal(titles.some((title) => title.startsWith("先被看見")), false);
  assert.equal(titles.some((title) => title.startsWith("活動介紹")), false);
  assert.equal(titles.some((title) => title.startsWith("今晚")), false);
  assert.ok(titles.some((title) => title.startsWith("預告")));
  assert.ok(titles.some((title) => title.startsWith("為什麼來")));
  assert.ok(titles.some((title) => title.startsWith("倒數")));
  assert.ok(titles.some((title) => title.startsWith("昨天晚上")));
  const onlyWaves = preferSuiteSchedule(waveItems);
  assert.equal(onlyWaves.length, 8);
  const published = waveItems.map((item) =>
    item.title.startsWith("先被看見") ? { ...item, status: "published" as const } : item,
  );
  const keptPublished = preferSuiteSchedule([...published, ...suite]);
  assert.ok(keptPublished.some((item) => item.title.startsWith("先被看見") && item.status === "published"));
  assert.equal(suiteCoversWave("camp_tea", "emotion", next), true);
  assert.equal(suiteCoversWave("camp_tea", "tease", next), false);

  const infoNight = Date.parse("2026-09-19T20:00:00+08:00");
  const merged = mergeSuiteIntoSchedule(waveItems, [
    {
      id: "sch_suite_post",
      title: "IG Post · 茶會",
      contentKind: "ig-post",
      status: "scheduled",
      scheduledAt: Date.parse("2026-09-16T20:00:00+08:00"),
      publishedAt: null,
      projectId: "p1",
      campaignId: "camp_tea",
      captionPreview: "坐好",
    },
    {
      id: "sch_suite_car",
      title: "Carousel · 茶會",
      contentKind: "carousel",
      status: "scheduled",
      scheduledAt: infoNight,
      publishedAt: null,
      projectId: "p2",
      campaignId: "camp_tea",
      captionPreview: "坐好",
    },
  ]);
  const carousel = merged.find((item) => item.id === "sch_suite_car");
  assert.equal(carousel?.scheduledAt, infoNight);
  assert.equal(merged.some((item) => item.title.startsWith("活動介紹")), false);
});

test("waveOffsets compress when the event is soon and recruit starts earlier", () => {
  const soon = waveOffsets({ date: "2026-09-24", type: "tea", now: new Date("2026-09-20T12:00:00+08:00") });
  assert.equal(soon.tease, -5);
  assert.equal(soon.recap, 1);
  assert.notEqual(soon.emotion, soon["key-visual"]);
  assert.notEqual(soon.emotion, soon.info);
  const recruit = waveOffsets({ date: "2026-10-20", type: "recruit", now: new Date("2026-09-16T12:00:00+08:00") });
  assert.equal(recruit.tease, -18);
  const light = waveOffsets({ date: "2026-10-20", type: "light", now: new Date("2026-09-16T12:00:00+08:00") });
  assert.equal(light.tease, -14);
  assert.equal(contentKindForWave("tease"), "knowledge");
  assert.equal(contentKindForWave("reason"), "member-story");
  assert.equal(contentKindForWave("day-of"), "story");
  assert.match(rhythmHint([{ contentKind: "ig-post" }, { contentKind: "carousel" }, { contentKind: "ig-post" }]), /招生/);
});

test("spreadSchedule keeps two knowledge teasers off the same night", () => {
  const night = Date.parse("2026-09-15T20:00:00+08:00");
  const item = (id: string, title: string) => ({
    id,
    title,
    contentKind: "knowledge" as const,
    status: "idea" as const,
    scheduledAt: night,
    publishedAt: null,
    projectId: null,
    campaignId: "c",
    captionPreview: title,
  });
  const next = spreadSchedule([item("sch_wave_a", "預告 · 浮游禪光"), item("sch_wave_b", "預告 · 開學茶會")]);
  assert.equal(next[0]?.scheduledAt, night);
  assert.ok((next[1]?.scheduledAt ?? 0) >= night + 86_400_000);
});

test("soon tea waves do not stack promo kinds on one night", () => {
  const waves = suggestWaves({ date: "2026-09-24", type: "tea", name: "茶會", now: new Date("2026-09-20T12:00:00+08:00") });
  const items = scheduleItemsFromCampaign(emptyCampaign({ id: "camp_soon", waves }));
  const byDay = new Map<string, string[]>();
  for (const row of items) {
    const day = new Date(row.scheduledAt).toDateString();
    byDay.set(day, [...(byDay.get(day) ?? []), row.contentKind]);
  }
  for (const kinds of byDay.values()) {
    const promos = kinds.filter((kind) => kind === "ig-post" || kind === "carousel" || kind === "poster");
    assert.ok(promos.length <= 1, String(kinds));
  }
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

test("previewBindForSchedule overlays a wave onto its campaign visual, not leftover art", () => {
  const tea = emptyCampaign({
    id: "camp_tea",
    name: "開學茶會",
    tagline: "來坐一下，不用先懂禪。",
    coverAssetId: "asset_tea_night",
    relatedAssetIds: ["asset_tea_night", "asset_campus"],
    projectIds: ["proj_welcome_tea"],
  });
  const light = emptyCampaign({
    id: "camp_light",
    name: "浮游禪光",
    tagline: "最近是不是很久沒有好好坐下來？",
    coverAssetId: "asset_trilight",
    projectIds: ["proj_floating_light"],
  });
  const item: ScheduleItem = {
    id: "sch_wave_tea",
    title: "預告 · 開學茶會",
    contentKind: "knowledge",
    status: "idea",
    scheduledAt: 1,
    publishedAt: null,
    projectId: null,
    campaignId: tea.id,
    captionPreview: "來坐一下，不用先懂禪。",
  };
  const bind = previewBindForSchedule(item, [light, tea]);
  assert.equal(bind.overlay, true);
  assert.equal(bind.assetId, "asset_tea_night");
  assert.equal(bind.headline, "來坐一下，不用先懂禪。");
  assert.equal(bind.projectId, "proj_welcome_tea");
  assert.equal(bind.formatId, "feed-portrait");
  assert.equal(bind.campaignName, "開學茶會");
  assert.doesNotMatch(bind.headline, /很久沒有好好坐下來/);
  assert.equal(wrapOverlayHeadline(bind.headline), "來坐一下，\n不用先懂禪。");
});

test("previewBindForSchedule keeps a suite sequence on its own project", () => {
  const bind = previewBindForSchedule(
    {
      id: "sch_car",
      title: "主視覺",
      contentKind: "carousel",
      status: "scheduled",
      scheduledAt: 1,
      publishedAt: null,
      projectId: "proj_car",
      campaignId: "camp_light",
      captionPreview: "最近是不是很久沒有好好坐下來？",
      sequence: { kind: "carousel", labels: ["1"], assetIds: ["asset_p1"], projectId: "proj_car" },
    },
    [],
  );
  assert.equal(bind.overlay, false);
  assert.equal(bind.assetId, "asset_p1");
  assert.equal(bind.projectId, "proj_car");
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

test("fillKeptWaveRows writes copy and reuses suite projects on leftover rhythm waves", () => {
  const plan = buildMockPlan({
    eventName: "茶會",
    schedule: "9/24 19:30",
    location: "淡江大學淡水校園",
    product: "茶會",
    offer: "",
    audience: "淡江大學學生",
    goal: "awareness",
    features: "茶",
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
  const pack = {
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
        wouldBringFriend: "可以找朋友一起來。",
        knowsSignup: "",
        notes: [],
        rewriteHook: "最近是不是連休息都覺得有罪惡感？",
      },
    },
  };
  const picked = packWithDirection(pack, "dir_b").directions?.at(0);
  assert.ok(picked);
  assert.equal(picked.id, "dir_b");
  const waves = suggestWaves({ date: "2026-09-24", type: "tea", name: "茶會" });
  const campaign = emptyCampaign({ id: "camp_tea", name: "茶會", date: "2026-09-24", waves });
  const merged = mergeSuiteIntoSchedule(scheduleItemsFromCampaign(campaign, "creating"), [
    {
      id: "sch_suite_post",
      title: "IG Post · 茶會",
      contentKind: "ig-post",
      status: "scheduled",
      scheduledAt: Date.parse("2026-09-18T20:00:00+08:00"),
      publishedAt: null,
      projectId: "p-post",
      campaignId: "camp_tea",
      captionPreview: "post",
    },
    {
      id: "sch_suite_car",
      title: "Carousel · 茶會",
      contentKind: "carousel",
      status: "scheduled",
      scheduledAt: Date.parse("2026-09-20T20:00:00+08:00"),
      publishedAt: null,
      projectId: "p-car",
      campaignId: "camp_tea",
      captionPreview: "car",
    },
    {
      id: "sch_suite_story",
      title: "Story · 茶會",
      contentKind: "story",
      status: "scheduled",
      scheduledAt: Date.parse("2026-09-19T20:00:00+08:00"),
      publishedAt: null,
      projectId: "p-story",
      campaignId: "camp_tea",
      captionPreview: "story",
    },
  ]);
  const filled = fillKeptWaveRows({
    items: merged,
    campaign,
    pack,
    directionId: "dir_b",
    projects: { "ig-post": "p-post", carousel: "p-car", story: "p-story" },
  });
  const tease = filled.items.find((item) => item.title.startsWith("預告"));
  const recap = filled.items.find((item) => item.title.startsWith("昨天晚上"));
  const countdown = filled.items.find((item) => item.title.startsWith("倒數"));
  assert.ok((tease?.captionPreview ?? "").length > 4);
  assert.equal(tease?.projectId, "p-post");
  assert.equal(tease?.status, "scheduled");
  assert.equal(recap?.projectId, "p-car");
  assert.equal(countdown?.projectId, "p-story");
  assert.equal(projectForKeptWave("tease", { "ig-post": "p-post" }), "p-post");
  assert.equal(filled.campaign.waves.find((wave) => wave.kind === "key-visual")?.notes, picked.imagePrompt);
  assert.equal(filled.campaign.waves.find((wave) => wave.kind === "tease")?.status, "scheduled");
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

test("dueScheduleItems are unpublished IG slots whose time has passed", () => {
  const now = Date.parse("2026-09-16T20:00:00+08:00");
  const row = (id: string, extra: Partial<ScheduleItem>): ScheduleItem => ({
    id,
    title: id,
    contentKind: "ig-post",
    status: "scheduled",
    scheduledAt: now - 1000,
    publishedAt: null,
    projectId: null,
    campaignId: null,
    captionPreview: "最近是不是連休息都覺得有罪惡感？",
    ...extra,
  });
  const due = dueScheduleItems(
    [
      row("past", {}),
      row("later", { scheduledAt: now + 60_000 }),
      row("done", { status: "published", publishedAt: now }),
      row("line", { contentKind: "line" }),
      row("story", { contentKind: "story", scheduledAt: now - 2000 }),
    ],
    now,
  );
  assert.deepEqual(
    due.map((item) => item.id),
    ["story", "past"],
  );
  const upcoming = upcomingScheduleItems(
    [row("past", {}), row("later", { scheduledAt: now + 60_000 }), row("done", { status: "published", publishedAt: now })],
    now,
  );
  assert.deepEqual(
    upcoming.map((item) => item.id),
    ["later"],
  );
  const allDue = dueScheduleItems(
    [row("past", {}), row("story", { contentKind: "story", scheduledAt: now - 2000 }), row("later", { scheduledAt: now + 60_000 })],
    now,
    0,
  );
  assert.equal(allDue.length, 2);
});

test("shiftScheduleDay keeps the same hour while moving one calendar day", () => {
  const night = Date.parse("2026-09-16T20:00:00+08:00");
  assert.equal(shiftScheduleDay(night, 1), night + 86_400_000);
  assert.equal(shiftScheduleDay(night, -1), night - 86_400_000);
});

test("applyConvertedSlot rewrites the unpublished suite slot instead of adding a twin", () => {
  const now = Date.parse("2026-09-17T20:00:00+08:00");
  const suite: ScheduleItem = {
    id: "sch_story",
    title: "Story · 浮游禪光",
    contentKind: "story",
    status: "scheduled",
    scheduledAt: now,
    publishedAt: null,
    projectId: "proj_old",
    campaignId: "camp_floating_light",
    captionPreview: "舊文案",
    sequence: { kind: "story", labels: ["1"], assetIds: ["a"], projectId: "proj_old" },
  };
  const wave: ScheduleItem = {
    id: "sch_wave_story",
    title: "今晚 · 浮游禪光",
    contentKind: "story",
    status: "idea",
    scheduledAt: now + 86_400_000,
    publishedAt: null,
    projectId: null,
    campaignId: "camp_floating_light",
    captionPreview: "節奏",
  };
  const { placed, items } = applyConvertedSlot([suite, wave], {
    id: "sch_new",
    title: "最近是不是連休息都覺得有罪惡感？ · Story",
    contentKind: "story",
    status: "scheduled",
    scheduledAt: now + 3 * 86_400_000,
    publishedAt: null,
    projectId: "proj_new",
    campaignId: "camp_floating_light",
    captionPreview: "最近是不是連休息都覺得有罪惡感？\n晚上見",
    sequence: { kind: "story", labels: ["1", "2"], assetIds: ["n1", "n2"], projectId: "proj_new" },
  });
  assert.equal(placed.id, "sch_story");
  assert.equal(placed.scheduledAt, now);
  assert.match(placed.captionPreview, /連休息都覺得有罪惡感/);
  assert.equal(placed.projectId, "proj_new");
  assert.equal(items.filter((row) => row.contentKind === "story" && !row.id.startsWith("sch_wave")).length, 1);
  assert.equal(items.find((row) => row.id === "sch_wave_story")?.captionPreview, "節奏");
});

test("applyConvertedSlot places a new night when that format is not on the calendar yet", () => {
  const now = Date.parse("2026-09-16T20:00:00+08:00");
  const { placed, items } = applyConvertedSlot([], {
    id: "sch_threads",
    title: "Threads",
    contentKind: "threads",
    status: "scheduled",
    scheduledAt: now,
    publishedAt: null,
    projectId: "proj_t",
    campaignId: "camp_floating_light",
    captionPreview: "短版",
  });
  assert.equal(placed.id, "sch_threads");
  assert.equal(items.length, 1);
  assert.equal(placed.captionPreview, "短版");
});

test("pickFocusDay lands on the cursor day inside the month list", () => {
  const start = Date.parse("2026-09-01T00:00:00+08:00");
  const days = Array.from({ length: 30 }, (_, i) => start + i * 86_400_000);
  const cursor = Date.parse("2026-09-16T12:00:00+08:00");
  const focus = pickFocusDay({ days, cursor });
  const focusDate = new Date(focus);
  assert.equal(focusDate.getMonth() + 1, 9);
  assert.equal(focusDate.getDate(), 16);
});

test("scheduleItemForPreview binds the format on screen, not the first unpublished slot", () => {
  const now = Date.parse("2026-09-16T20:00:00+08:00");
  const row = (id: string, extra: Partial<ScheduleItem>): ScheduleItem => ({
    id,
    title: id,
    contentKind: "ig-post",
    status: "scheduled",
    scheduledAt: now,
    publishedAt: null,
    projectId: null,
    campaignId: "camp_floating_light",
    captionPreview: id,
    ...extra,
  });
  const items = [
    row("sch_post", { contentKind: "ig-post", projectId: "proj_post" }),
    row("sch_car", { contentKind: "carousel", projectId: "proj_car", sequence: { kind: "carousel", labels: ["1"], assetIds: ["a"], projectId: "proj_car" } }),
    row("sch_story", { contentKind: "story", projectId: "proj_story" }),
  ];
  const car = scheduleItemForPreview({
    items,
    previewScheduleId: "sch_post",
    contentKind: "carousel",
    projectId: "proj_car",
    sequenceProjectId: "proj_car",
  });
  assert.equal(car?.id, "sch_car");
  const story = scheduleItemForPreview({
    items,
    previewScheduleId: "sch_car",
    contentKind: "story",
  });
  assert.equal(story?.id, "sch_story");
  const after = scheduleItemForPreview({
    items: items.map((item) => (item.id === "sch_car" ? { ...item, status: "published" } : item)),
    previewScheduleId: "sch_car",
    contentKind: "carousel",
  });
  assert.equal(after, undefined);
  const unbound = scheduleItemForPreview({
    items: [
      row("sch_post", { contentKind: "ig-post", projectId: "proj_post" }),
      row("sch_car", { contentKind: "carousel", projectId: "proj_car" }),
      row("sch_wave_story", { contentKind: "story", projectId: null }),
    ],
    previewScheduleId: "sch_car",
    contentKind: "story",
    projectId: "proj_new_story",
    sequenceProjectId: "proj_new_story",
  });
  assert.equal(unbound, undefined);
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
