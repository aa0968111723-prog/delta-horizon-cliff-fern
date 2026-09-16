import { emptyBoilerplate } from "./boilerplate";
import { migrateBrief, migratePlan, migratePlanVersions } from "./brief";
import { buildLayout } from "./layout";
import type { AssetMeta, BrandKit, Layer, Project } from "./types";

export const SEED_BRAND_ID = "brand_zen";
export const SEED_PROJECT_ID = "proj_floating_light";
export const SEED_DRAFT_ID = "proj_sit_down";
export const SEED_LOGO_ID = "asset_zen_logo";
export const SEED_TURTLE_ID = "asset_turtle";
export const SEED_LIGHT_ID = "asset_tricolor";
export const SEED_TEA_ID = "asset_tea";
export const SEED_TAMSUI_ID = "asset_tamsui";
export const SEED_CAMPUS_ID = "asset_campus";

/** Old coffee-studio ids — migrated away in persist v7. */
export const LEGACY_SEED_BRAND_ID = "brand_nisshoku";
export const LEGACY_SEED_PROJECT_ID = "proj_yirgacheffe";
export const LEGACY_SEED_DRAFT_ID = "proj_weekend_pour";

const SEED_TIME = Date.parse("2026-09-12T19:00:00+08:00");

export const SEED_ASSETS: AssetMeta[] = [
  {
    id: SEED_LOGO_ID,
    name: "禪學社標誌",
    kind: "logo",
    category: "logo",
    mime: "image/svg+xml",
    width: 80,
    height: 80,
    tags: ["logo", "品牌", "禪學社"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/zen-mark.svg",
    source: "seed",
    licenseNotes: "社團自有標誌，僅限淡江禪學社網宣。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 2,
  },
  {
    id: SEED_TURTLE_ID,
    name: "龜龜",
    kind: "image",
    category: "illustration",
    mime: "image/svg+xml",
    width: 1080,
    height: 1080,
    tags: ["龜龜", "角色", "品牌"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/turtle.svg",
    source: "seed",
    licenseNotes: "社團角色。可入鏡，不要卡通化到失去品牌。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 1,
  },
  {
    id: SEED_LIGHT_ID,
    name: "三色光主視覺",
    kind: "image",
    category: "poster",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["三色光", "浮游禪光", "夜間", "海報"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/tricolor.svg",
    source: "seed",
    licenseNotes: "活動主視覺方向。三色光是氣氛不是霓虹。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 1,
  },
  {
    id: SEED_TEA_ID,
    name: "夜間茶會",
    kind: "image",
    category: "event",
    mime: "image/svg+xml",
    width: 1080,
    height: 1080,
    tags: ["茶會", "晚上", "同學互動"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/tea.svg",
    source: "seed",
    licenseNotes: "歷屆茶會氣氛參考。",
    licenseOwner: "淡江大學禪學社",
    favorite: false,
    lastUsedAt: Date.parse("2026-09-03T10:00:00+08:00"),
    useCount: 1,
  },
  {
    id: SEED_TAMSUI_ID,
    name: "淡水暮色",
    kind: "image",
    category: "tamsui",
    mime: "image/svg+xml",
    width: 1080,
    height: 1080,
    tags: ["淡水", "傍晚", "生活"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/tamsui.svg",
    source: "seed",
    licenseNotes: "淡水生活感，不是觀光明信片。",
    licenseOwner: "淡江大學禪學社",
    favorite: false,
    lastUsedAt: null,
    useCount: 0,
  },
  {
    id: SEED_CAMPUS_ID,
    name: "淡江校園光影",
    kind: "image",
    category: "campus",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["淡江", "校園", "背景"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/campus.svg",
    source: "seed",
    licenseNotes: "校園光影，可作限動或背景。",
    licenseOwner: "淡江大學禪學社",
    favorite: false,
    lastUsedAt: null,
    useCount: 0,
  },
];

export const SEED_BRAND: BrandKit = {
  id: SEED_BRAND_ID,
  name: "淡江大學禪學社",
  handle: "@tku.zen",
  website: "淡江大學禪學社",
  voice: "像社團的人在限動裡講話。先讓淡江學生覺得這篇在講自己，再帶出活動。禪是安定、專注、慢下來，不是宗教廣告。",
  doSay: "淡江學生、淡水、坐下來、喘口氣、認識自己、帶朋友來、時間地點講清楚",
  dontSay: "誠摯邀請您、蒞臨、覺醒、玄學、說教、限時瘋搶",
  forbiddenWords: ["誠摯邀請您", "蒞臨", "限時瘋搶", "錯過就沒有", "開啟人生新篇章"],
  colors: [
    { id: "c1", hex: "#2F5F56", role: "primary", label: "苔綠" },
    { id: "c2", hex: "#7EB8C9", role: "secondary", label: "水光" },
    { id: "c3", hex: "#F6F1E8", role: "background", label: "宣紙" },
    { id: "c4", hex: "#E0B07A", role: "accent", label: "暖光" },
    { id: "c5", hex: "#1C2422", role: "ink", label: "墨" },
  ],
  fontDisplay: "Noto Serif TC",
  fontBody: "Noto Sans TC",
  logoAssetId: SEED_LOGO_ID,
  logos: [
    { id: "logo_zen_primary", name: "主標誌", assetId: SEED_LOGO_ID, usage: "primary" },
    { id: "logo_zen_mark", name: "圖標", assetId: SEED_LOGO_ID, usage: "mark" },
  ],
  slogans: ["人到了就好。", "沒有人要你懂禪。"],
  ctas: ["來坐一下", "帶朋友一起來", "看活動時間"],
  imageStyle: {
    mood: "夜間暖光、空氣感、學生生活，不是廟宇",
    lighting: "三色光柔和疊加，或淡水傍晚自然光。避免硬閃與過度 AI 皮膚",
    paletteHint: "宣紙、苔綠、青／暖／玫瑰三色光",
    composition: "主視覺上半或滿版，下半留白給第一句 Hook",
    do: "龜龜、手、側臉、室內坐著、淡水不是明信片",
    dont: "金色佛光、合十廣告、擁擠大合照、每張都放勵志金句",
  },
  rules: {
    noCompetitorMarks: true,
    noWatermark: true,
    noLowRes: true,
    notes: "Logo 不壓臉。時間地點至少出現一次。不要一開頭就宗教詞。",
  },
  boilerplate: {
    ...emptyBoilerplate(),
    cta: "來坐一下",
    disclaimer: "任何人都可以來，不需要先懂禪。",
    hashtags: ["#淡江禪學社", "#淡江大學", "#淡水"],
    captionClose: "人到了就好。想帶朋友來也可以。",
  },
  updatedAt: SEED_TIME,
};

const copy = {
  eyebrow: "09 / 24",
  headline: "最近是不是\n很久沒坐下來？",
  subhead: "浮游禪光 · 淡江的一個晚上",
  body: "19:30 開始。燈會先亮。沒有人要你準備成另一個自己。",
  cta: "來坐一下",
  handle: "@tku.zen",
  caption:
    "最近是不是很久沒有好好坐下來？\n\n下週三晚上，浮游禪光。\n19:30，淡江校園。\n人到了就好，想帶朋友來也可以。",
  hashtags: ["#淡江禪學社", "#浮游禪光", "#淡江", "#淡水", "#慢下來"],
  altText: "夜間三色光下的主視覺，標題問最近是不是很久沒坐下來。",
};

function stabilize(layers: Layer[], prefix: string): Layer[] {
  return layers.map((layer, index) => ({
    ...layer,
    id: `${prefix}${index}`,
  }));
}

export function createSeedProject(): Project {
  const now = SEED_TIME;
  const page1 = buildLayout("feed-portrait", copy, SEED_BRAND, "product", { imageAssetId: SEED_LIGHT_ID });
  page1.layers = stabilize(page1.layers, "seed_ly_");
  page1.role = "cover";
  page1.templateId = "product";

  const page2 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "ISSUE",
      headline: "連休息\n都有點罪惡？",
      subhead: "開學以後行程被填滿。",
      body: "不是要你變得更努力，是想留一個晚上。",
      cta: "來坐一下",
    },
    SEED_BRAND,
    "quote",
  );
  page2.layers = stabilize(page2.layers, "seed_p2_ly_");
  page2.role = "problem";
  page2.templateId = "quote";

  const page3 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "FOCUS",
      headline: "燈先亮\n人慢慢到",
      subhead: "09/24 19:30 · 淡江校園",
      body: "三色光、可以坐著、可以帶朋友。",
      cta: "看活動時間",
    },
    SEED_BRAND,
    "editorial",
    { imageAssetId: SEED_TURTLE_ID },
  );
  page3.layers = stabilize(page3.layers, "seed_p3_ly_");
  page3.role = "detail";
  page3.templateId = "editorial";

  const page4 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "PROOF",
      headline: "第一次來\n也沒關係",
      subhead: "對禪完全不了解也可以。",
      body: "去年就有人問同一句。答案都是：可以。",
      cta: "帶朋友一起來",
    },
    SEED_BRAND,
    "product",
    { imageAssetId: SEED_TEA_ID },
  );
  page4.layers = stabilize(page4.layers, "seed_p4_ly_");
  page4.role = "proof";
  page4.templateId = "product";

  const page5 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "NOW",
      headline: "09/24\n19:30",
      subhead: "淡江校園 · 活動教室",
      body: "到了再找位子。不用準時到分。",
      cta: "來坐一下",
    },
    SEED_BRAND,
    "offer",
  );
  page5.layers = stabilize(page5.layers, "seed_p5_ly_");
  page5.role = "cta";
  page5.templateId = "offer";

  const page6 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "NOTE",
      headline: "人到了\n就好。",
      subhead: "淡江大學禪學社",
      body: "想帶朋友來也可以。",
      cta: "來坐一下",
    },
    SEED_BRAND,
    "quote",
  );
  page6.layers = stabilize(page6.layers, "seed_p6_ly_");
  page6.role = "close";
  page6.templateId = "quote";

  const slides = [page1, page2, page3, page4, page5, page6];

  const brief = migrateBrief({
    product: "浮游禪光夜間活動",
    eventName: "浮游禪光",
    schedule: "2026/09/24 19:30–21:30",
    location: "淡江校園・活動教室",
    offer: "任何人都可以來",
    audience: "淡江大學學生，尤其剛到淡水、想找一個能坐下的晚上的人",
    goal: "awareness",
    features: "三色光、可坐可帶朋友、不需要先懂禪",
    style: "學生生活感、夜間暖光、不要宗教",
    notes: "Hook 先問生活，再帶活動。時間地點要清楚。",
    deliverables: { post: true, story: true, carousel: true, reels: true },
  });

  const plan = migratePlan({
    campaignName: "浮游禪光",
    concept: "用「很久沒好好坐下來」對準開學後的淡江學生，再把浮游禪光變成一個晚上的位置。",
    insight: "學生要的不是一場宗教活動，是一個不用表演的晚上。",
    hook: "最近是不是很久沒有好好坐下來？",
    visualTheme: "夜間三色光、宣紙與苔綠，龜龜可入鏡。",
    visualDirection: "上半柔和光暈，下半留白給第一句。避免廟宇感。",
    templateId: "product",
    colorMood: "宣紙、苔綠、青／暖／玫瑰",
    eyebrow: copy.eyebrow,
    headline: copy.headline,
    subhead: copy.subhead,
    body: copy.body,
    cta: copy.cta,
    captions: [
      { style: "學生版", text: copy.caption },
      { style: "短版", text: "最近是不是很久沒有好好坐下來？\n09/24 19:30 浮游禪光。人到了就好。" },
    ],
    hashtags: copy.hashtags,
    storyBeats: ["第一句問生活", "燈的畫面", "時間地點＋來坐一下"],
    carouselPages: [
      { role: "cover", headline: copy.headline, subhead: copy.subhead, body: copy.caption, cta: copy.cta, visualNote: "光暈滿版，Hook 兩行。", templateId: "product" },
      { role: "problem", headline: "連休息\n都有點罪惡？", subhead: "開學以後", body: "行程被填滿。", cta: copy.cta, visualNote: "只留一句真話。", templateId: "quote" },
      { role: "detail", headline: "燈先亮\n人慢慢到", subhead: "09/24 19:30", body: "三色光、可以坐著。", cta: "看活動時間", visualNote: "時間地點清楚。", templateId: "editorial" },
      { role: "proof", headline: "第一次來\n也沒關係", subhead: "不懂禪也可以", body: "可以。", cta: "帶朋友一起來", visualNote: "現場感。", templateId: "product" },
      { role: "cta", headline: "09/24\n19:30", subhead: "淡江校園", body: "到了再找位子。", cta: copy.cta, visualNote: "只留時間地點 CTA。", templateId: "offer" },
      { role: "close", headline: "人到了\n就好。", subhead: "淡江大學禪學社", body: "想帶朋友來也可以。", cta: copy.cta, visualNote: "可截圖。", templateId: "quote" },
    ],
    assetNeeds: [
      { kind: "photo", title: "夜間現場或三色光", detail: "學生生活感，直式。", required: true },
      { kind: "illustration", title: "龜龜", detail: "可小入鏡。", required: false },
      { kind: "logo", title: "禪學社標誌", detail: "角落，不壓字。", required: true },
    ],
    checklist: ["第一句不是公文", "時間地點有出現", "不太宗教", "CTA 可讀", "Logo 沒壓主體"],
    altText: copy.altText,
    qaNotes: ["避免佛光與說教", "Hook 要像學生會停下來的那句"],
    generatedAt: now,
    source: "live",
    threadsPost: {
      caption: "最近是不是很久沒有好好坐下來？\n下週三 19:30，浮游禪光。人到了就好。",
      visualNote: "裁成 1:1，保留光暈與第一句。",
    },
    lineCopy: {
      title: "09/24 浮游禪光",
      body: "一個給淡江學生的晚上。不需要先懂禪。",
      cta: "來看時間",
    },
    reelsScript: [
      { start: 0, end: 3, visual: "捷運出站／風", caption: "很久沒坐下來？", voiceover: "最近是不是連休息都有點罪惡感。", transition: "切到室內光", assetHint: "淡水或捷運" },
      { start: 3, end: 7, visual: "三色光亮起", caption: "燈會先亮", voiceover: "下週三晚上。", transition: "疊字", assetHint: "三色光" },
      { start: 7, end: 12, visual: "有人坐下", caption: "人到了就好", voiceover: "沒有人要你懂禪。", transition: "慢推", assetHint: "茶會或現場" },
      { start: 12, end: 17, visual: "時間地點", caption: "09/24 19:30 淡江", voiceover: "帶朋友來也可以。", transition: "切卡片", assetHint: "主視覺" },
      { start: 17, end: 20, visual: "龜龜或 logo", caption: "來坐一下", voiceover: "來坐一下。", transition: "淡出", assetHint: "龜龜" },
    ],
  });

  return {
    id: SEED_PROJECT_ID,
    name: "浮游禪光",
    createdAt: now,
    updatedAt: now,
    brandId: SEED_BRAND_ID,
    templateId: "product",
    activeFormatId: "feed-portrait",
    status: "ready",
    campaignId: "camp_floating_light",
    contentKind: "carousel",
    contentStatus: "done",
    scheduledAt: Date.parse("2026-09-17T19:00:00+08:00"),
    publishedAt: null,
    brief,
    copy,
    plan,
    artboards: { "feed-portrait": page1 },
    slides: { "feed-portrait": slides },
    slideIndex: 0,
    snapshots: [
      {
        id: "snap_seed_v1",
        name: "初稿 · 六頁輪播",
        createdAt: now,
        kind: "manual",
        formatId: "feed-portrait",
        slideIndex: 0,
        artboard: structuredClone(page1),
        pages: structuredClone(slides),
      },
    ],
    planVersions: migratePlanVersions(undefined, plan),
    exports: [],
  };
}

export function createSeedDraft(): Project {
  const now = Date.parse("2026-09-14T10:00:00+08:00");
  const draftCopy = {
    eyebrow: "NOW",
    headline: "先喘一口氣",
    subhead: "限動草稿",
    body: "",
    cta: "來坐一下",
    handle: "@tku.zen",
    caption: "",
    hashtags: ["#淡江禪學社"],
    altText: "",
  };
  const artboard = buildLayout("story", draftCopy, SEED_BRAND, "offer", { imageAssetId: SEED_TAMSUI_ID });
  artboard.layers = artboard.layers.map((layer, index) => ({ ...layer, id: `seed_draft_ly_${index}` }));
  return {
    id: SEED_DRAFT_ID,
    name: "限動草稿・坐下來",
    createdAt: now,
    updatedAt: now,
    brandId: SEED_BRAND_ID,
    templateId: "offer",
    activeFormatId: "story",
    status: "draft",
    campaignId: "camp_floating_light",
    contentKind: "story",
    contentStatus: "idea",
    scheduledAt: Date.parse("2026-09-22T21:00:00+08:00"),
    publishedAt: null,
    brief: migrateBrief({
      product: "浮游禪光限動",
      eventName: "浮游禪光",
      schedule: "活動前兩天晚上",
      location: "淡江校園",
      offer: "",
      audience: "淡江學生",
      goal: "traffic",
      features: "倒數、時間地點",
      style: "短、口語",
      notes: "尚未定稿。",
      deliverables: { post: false, story: true, carousel: false, reels: false },
    }),
    copy: draftCopy,
    plan: null,
    artboards: { story: artboard },
    slides: { story: [artboard] },
    slideIndex: 0,
    snapshots: [],
    planVersions: [],
    exports: [],
  };
}

export const SEED_PROJECT = createSeedProject();
