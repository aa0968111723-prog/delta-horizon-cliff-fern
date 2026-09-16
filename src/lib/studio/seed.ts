import { emptyBoilerplate } from "./boilerplate";
import { migrateBrief, migratePlan, migratePlanVersions } from "./brief";
import { kindFromFormat } from "./content";
import { buildLayout } from "./layout";
import { DEFAULT_SHADOW } from "./layers";
import { suggestWaves } from "../zen/schedule.ts";
import type {
  AssetMeta,
  BrandKit,
  ClubCampaign,
  ConnectionMeta,
  IgMemoryPost,
  Layer,
  LineLayer,
  Project,
  RemoteFile,
  ScheduleItem,
} from "./types";

export const SEED_BRAND_ID = "brand_tamkang_zen";
export const SEED_PROJECT_ID = "proj_floating_light";
export const SEED_DRAFT_ID = "proj_sit_down";
export const SEED_CAMPAIGN_ID = "camp_floating_light";
export const SEED_LOGO_ID = "asset_zen_mark";
export const SEED_TURTLE_ID = "asset_turtle";
export const SEED_LIGHT_ID = "asset_trilight";
export const SEED_TAMSUI_ID = "asset_tamsui";
export const SEED_CAMPUS_ID = "asset_campus";

const SEED_TIME = Date.parse("2026-09-10T00:00:00+08:00");
const EVENT_DATE = "2026-09-24";

export const DEFAULT_CONNECTIONS: ConnectionMeta[] = [
  { provider: "drive", status: "disconnected", accountLabel: "", lastSyncAt: null },
  { provider: "canva", status: "disconnected", accountLabel: "", lastSyncAt: null },
  { provider: "instagram", status: "disconnected", accountLabel: "", lastSyncAt: null },
];

export const SEED_ASSETS: AssetMeta[] = [
  {
    id: SEED_LOGO_ID,
    name: "禪光標誌",
    kind: "logo",
    category: "logo",
    mime: "image/svg+xml",
    width: 80,
    height: 80,
    tags: ["logo", "品牌", "三色光"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/zen-mark.svg",
    source: "seed",
    licenseNotes: "社團標誌，僅限淡江禪學社網宣。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 2,
  },
  {
    id: SEED_TURTLE_ID,
    name: "龜龜",
    kind: "image",
    category: "mascot",
    mime: "image/svg+xml",
    width: 80,
    height: 80,
    tags: ["龜龜", "角色", "吉祥物"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/turtle.svg",
    source: "seed",
    licenseNotes: "社團角色，可進 IG 小位置，不要當宗教符號。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 1,
  },
  {
    id: SEED_LIGHT_ID,
    name: "三色光",
    kind: "image",
    category: "background",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["三色光", "夜晚", "主視覺"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/trilight.svg",
    source: "seed",
    licenseNotes: "抽象光點，作夜晚活動底。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 1,
  },
  {
    id: SEED_TAMSUI_ID,
    name: "淡水暮色",
    kind: "image",
    category: "tamsui",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["淡水", "河岸", "晚上"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/tamsui.svg",
    source: "seed",
    licenseNotes: "幾何淡水，可作生活向背景。",
    licenseOwner: "淡江大學禪學社",
    favorite: false,
    lastUsedAt: Date.parse("2026-09-12T10:00:00+08:00"),
    useCount: 1,
  },
  {
    id: SEED_CAMPUS_ID,
    name: "校園夜燈",
    kind: "image",
    category: "campus",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["校園", "淡江", "活動"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/campus.svg",
    source: "seed",
    licenseNotes: "校園幾何，可作活動回顧底。",
    licenseOwner: "淡江大學禪學社",
    favorite: false,
    lastUsedAt: null,
    useCount: 0,
  },
];

export const SEED_BRAND: BrandKit = {
  id: SEED_BRAND_ID,
  name: "淡江大學禪學社",
  handle: "@tamkang.zen",
  website: "",
  voice: "像社團的人在傳訊息。自然、有生活感、偶爾口語。先讓淡江學生覺得被看見，再提活動。",
  doSay: "坐下來、喘口氣、淡水晚上、找朋友一起來、認識自己、課業壓力、宿舍、捷運",
  dontSay: "誠摯邀請、宗教、玄學、開示、錯過就沒有、Z 世代、年輕人",
  forbiddenWords: ["誠摯邀請", "錯過就沒有", "開啟全新篇章", "心靈雞湯"],
  colors: [
    { id: "c1", hex: "#1C2422", role: "primary", label: "墨松" },
    { id: "c2", hex: "#3D5A73", role: "secondary", label: "淡水暮" },
    { id: "c3", hex: "#EEF2EC", role: "background", label: "霧園" },
    { id: "c4", hex: "#2F6F6A", role: "accent", label: "靜水" },
    { id: "c5", hex: "#1C2422", role: "ink", label: "文字" },
  ],
  fontDisplay: "Noto Serif TC",
  fontBody: "Noto Sans TC",
  logoAssetId: SEED_LOGO_ID,
  logos: [
    { id: "logo_zen_primary", name: "主標誌", assetId: SEED_LOGO_ID, usage: "primary" },
    { id: "logo_zen_mark", name: "圖標", assetId: SEED_LOGO_ID, usage: "mark" },
  ],
  slogans: ["先坐下來。", "這好像跟我的生活有關。"],
  ctas: ["來坐一下", "找朋友一起來", "看時間地點"],
  imageStyle: {
    mood: "空氣感、年輕、夜晚但不陰、有一點光",
    lighting: "淡水夜色、窗邊、三色光點，避免硬閃與寺廟金光",
    paletteHint: "霧園、靜水、淡水暮、一點琥珀光",
    composition: "畫面要有停留感，字不要堆滿。龜龜可在角落。",
    do: "夜晚、校園角落、茶、坐姿局部、朋友感、三色光、龜龜",
    dont: "木魚特寫、香爐、過度宗教、過度 AI 光滑、老氣海報",
  },
  rules: {
    noCompetitorMarks: true,
    noWatermark: true,
    noLowRes: true,
    notes: "不要做成宗教廣告。時間地點要清楚。不要連續招生。",
  },
  boilerplate: {
    ...emptyBoilerplate(),
    cta: "來坐一下",
    disclaimer: "",
    hashtags: ["#淡江禪學社", "#淡江", "#淡水"],
    captionClose: "想找人一起的話，把這則傳給他。",
  },
  mascot: "龜龜",
  motifs: ["龜龜", "三色光", "淡水夜晚", "坐下來", "茶"],
  likes: ["生活感", "留白", "學生語氣", "夜晚暖光"],
  dislikes: ["說教", "華麗佛學詞", "企業活動海報", "過度詩意"],
  audienceNotes:
    "只寫淡江學生：大一新生、住宿與通勤、剛到淡水的人、想交朋友或暫時喘口氣的人。他們多半對禪不熟。",
  updatedAt: SEED_TIME,
};

const copy = {
  eyebrow: "09 / 24",
  headline: "最近是不是\n很久沒坐好",
  subhead: "浮游禪光 · 淡水晚上",
  body: "不是來聽課。就是找一個晚上，把身體先放下來。",
  cta: "來坐一下",
  handle: "@tamkang.zen",
  caption:
    "最近是不是很久沒有好好坐下來？\n\n開學以後行程一直往前加，捷運上也可以滑完一整個晚上。\n9/24 我們在淡水校園做一場浮游禪光。燈是三色的，人不用很多，來坐一下就好。\n\n時間地點在下面。想找人一起的話，把這則傳給他。",
  hashtags: ["#淡江禪學社", "#淡江", "#淡水", "#浮游禪光", "#開學"],
  altText: "三色光點在深色夜底上，標題問最近是不是很久沒坐好。",
};

function stabilize(layers: Layer[], prefix: string): Layer[] {
  return layers.map((layer, index) => ({
    ...layer,
    id: `${prefix}${index}`,
  }));
}

export function createSeedCampaign(): ClubCampaign {
  const waves = suggestWaves(
    { date: EVENT_DATE, type: "light", name: "浮游禪光" },
    new Date(SEED_TIME),
  ).map((wave) =>
    wave.kind === "hero" ? { ...wave, projectId: SEED_PROJECT_ID } : wave,
  );
  return {
    id: SEED_CAMPAIGN_ID,
    name: "浮游禪光",
    type: "light",
    date: EVENT_DATE,
    time: "19:00–21:00",
    location: "淡江大學淡水校園 · 禪學社",
    oneLiner: "最近是不是很久沒有好好坐下來？",
    description:
      "用燈、坐、和一點茶，把開學後的吵雜放慢。不需要會禪，也不用正襟危坐。",
    theme: "夜晚、光、朋友、喘口氣",
    studentPain: "開學後行程變滿，休息會心虛。",
    cta: "來坐一下",
    signupUrl: "",
    imageAssetId: SEED_LIGHT_ID,
    assetIds: [SEED_LIGHT_ID, SEED_TURTLE_ID, SEED_TAMSUI_ID],
    waves,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  };
}

export const SEED_CAMPAIGNS: ClubCampaign[] = [createSeedCampaign()];

export function createSeedProject(): Project {
  const now = SEED_TIME;
  const page1 = buildLayout("feed-portrait", copy, SEED_BRAND, "quote", {
    imageAssetId: SEED_LIGHT_ID,
  });
  page1.layers = stabilize(page1.layers, "seed_ly_");
  page1.role = "cover";
  page1.templateId = "quote";

  const page2 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "CAMPUS",
      headline: "課表很滿\n人也可以空",
      subhead: "捷運上滑完一晚，不一定比較好過。",
      body: "淡江的自由很好，可是沒人告訴你怎麼慢下來。",
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
      eyebrow: "NIGHT",
      headline: "燈、坐\n一點茶",
      subhead: "9/24 19:00 · 淡水校園",
      body: "不需要會禪。來的時候穿你平常的衣服就好。",
      cta: "看時間地點",
    },
    SEED_BRAND,
    "editorial",
    { imageAssetId: SEED_TAMSUI_ID },
  );
  const line: LineLayer = {
    id: "seed_p3_line",
    name: "分隔線",
    type: "line",
    x: 72,
    y: 820,
    w: 220,
    h: 32,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    fromLayout: false,
    stroke: "#2F6F6A",
    strokeWidth: 3,
    shadow: { ...DEFAULT_SHADOW },
  };
  page3.layers = [...stabilize(page3.layers, "seed_p3_ly_"), line];
  page3.role = "detail";
  page3.templateId = "editorial";

  const page4 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "WITH",
      headline: "可以自己來\n也可以揪人",
      subhead: "龜龜會在現場。人不用很多。",
      body: "適合剛到淡水、還在找地方放自己的人。",
      cta: "找朋友一起來",
    },
    SEED_BRAND,
    "product",
    { imageAssetId: SEED_TURTLE_ID },
  );
  page4.layers = stabilize(page4.layers, "seed_p4_ly_");
  page4.role = "proof";
  page4.templateId = "product";

  const page5 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "09/24",
      headline: "來坐一下",
      subhead: "19:00–21:00 · 淡江大學禪學社",
      body: "不用準備什麼。到了就有位子。",
      cta: "看時間地點",
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
      headline: "先坐下來。",
      subhead: "淡江大學禪學社",
      body: "想找人一起的話，把這則傳給他。",
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
    product: "浮游禪光",
    eventName: "浮游禪光",
    schedule: "2026/09/24 19:00–21:00",
    location: "淡江大學淡水校園 · 禪學社",
    offer: "免費參加，找朋友一起來",
    audience: "淡江大一新生、住宿與通勤生、剛到淡水、想交朋友或喘口氣的人",
    goal: "traffic",
    features: "三色光、坐下來、茶、不用會禪",
    style: "生活感、夜晚、年輕",
    notes: "不要宗教語氣。Hook 先問生活。",
    deliverables: { post: true, story: true, carousel: true, reels: true },
  });

  const plan = migratePlan({
    campaignName: "浮游禪光",
    concept: "用一個淡水晚上，讓開學後的身體先坐下來。燈是三色的，活動不是課程。",
    insight: "學生缺的不是更多活動資訊，是被允許慢。",
    hook: "最近是不是很久沒有好好坐下來？",
    visualTheme: "深夜底、三色光、霧園字區。",
    visualDirection: "夜色滿版光點，下半留白給問句。龜龜可在角落。",
    templateId: "quote",
    colorMood: "霧園、靜水、琥珀光",
    eyebrow: copy.eyebrow,
    headline: copy.headline,
    subhead: copy.subhead,
    body: copy.body,
    cta: copy.cta,
    captions: [
      { style: "學生版", text: copy.caption },
      { style: "短版", text: "最近是不是很久沒坐好。\n9/24 浮游禪光，淡水晚上。來坐一下。" },
    ],
    hashtags: copy.hashtags,
    storyBeats: ["問句：很久沒坐好？", "燈與座位", "時間地點"],
    carouselPages: [
      {
        role: "cover",
        headline: copy.headline,
        subhead: "浮游禪光 · 淡水晚上",
        body: "最近是不是很久沒有好好坐下來？",
        cta: "來坐一下",
        visualNote: "三色光夜底，標題兩行。",
        templateId: "quote",
      },
      {
        role: "problem",
        headline: "課表很滿\n人也可以空",
        subhead: "捷運上滑完一晚，不一定比較好過。",
        body: "淡江的自由很好，可是沒人告訴你怎麼慢下來。",
        cta: "來坐一下",
        visualNote: "只留一句真的猶豫。",
        templateId: "quote",
      },
      {
        role: "detail",
        headline: "燈、坐\n一點茶",
        subhead: "9/24 19:00",
        body: "不需要會禪。",
        cta: "看時間地點",
        visualNote: "內容三件事：燈、坐、茶。",
        templateId: "editorial",
      },
      {
        role: "proof",
        headline: "可以自己來\n也可以揪人",
        subhead: "龜龜會在現場。",
        body: "適合剛到淡水的人。",
        cta: "找朋友一起來",
        visualNote: "朋友感，不要團體照擺拍。",
        templateId: "product",
      },
      {
        role: "cta",
        headline: "來坐一下",
        subhead: "19:00–21:00 · 禪學社",
        body: "不用準備什麼。",
        cta: "看時間地點",
        visualNote: "只留時間地點 CTA。",
        templateId: "offer",
      },
      {
        role: "close",
        headline: "先坐下來。",
        subhead: "淡江大學禪學社",
        body: "想找人一起的話，把這則傳給他。",
        cta: "來坐一下",
        visualNote: "可截圖。",
        templateId: "quote",
      },
    ],
    assetNeeds: [
      { kind: "background", title: "三色光夜底", detail: "抽象光點，不要寺廟。", required: true },
      { kind: "logo", title: "禪光標誌", detail: "淺底或小角。", required: true },
      { kind: "illustration", title: "龜龜", detail: "角落即可。", required: false },
    ],
    checklist: [
      "標題是問句，不是社團全名",
      "9/24 與地點有出現",
      "沒有宗教詞",
      "CTA 是來坐一下或找朋友",
      "Logo 沒壓光點",
    ],
    altText: copy.altText,
    qaNotes: ["避免木魚與香爐", "時間地點要能被截圖帶走"],
    generatedAt: now,
    source: "live",
    threadsPost: "最近是不是很久沒有好好坐下來？\n9/24 晚上在淡水校園有一場浮游禪光。燈是三色的，人不用很多。",
    lineCopy: "【9/24 浮游禪光】\n最近很久沒坐好的話，來坐一下。\n19:00 淡江大學禪學社",
    storyFrames: ["很久沒坐好？", "9/24 浮游禪光", "19:00 淡水校園", "來坐一下"],
  });

  return {
    id: SEED_PROJECT_ID,
    name: "浮游禪光 · Carousel",
    createdAt: now,
    updatedAt: now,
    brandId: SEED_BRAND_ID,
    templateId: "quote",
    activeFormatId: "feed-portrait",
    status: "ready",
    contentKind: "carousel",
    contentStatus: "scheduled",
    scheduledAt: Date.parse("2026-09-17T19:00:00+08:00"),
    publishedAt: null,
    campaignId: SEED_CAMPAIGN_ID,
    sourceRefs: [
      { kind: "brand", label: "Brand Memory / 龜龜與三色光" },
      { kind: "memory", label: "歷屆夜晚活動語氣" },
    ],
    brief,
    copy,
    plan,
    artboards: {
      "feed-portrait": page1,
    },
    slides: {
      "feed-portrait": slides,
    },
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
  const now = Date.parse("2026-09-12T10:00:00+08:00");
  const draftCopy = {
    eyebrow: "WEEK ONE",
    headline: "先允許自己\n慢一點",
    subhead: "開學第一週，不用一次認識完。",
    body: "",
    cta: "收藏這句",
    handle: "@tamkang.zen",
    caption: "",
    hashtags: ["#淡江禪學社", "#淡江"],
    altText: "",
  };
  const artboard = buildLayout("story", draftCopy, SEED_BRAND, "quote", {
    imageAssetId: SEED_TAMSUI_ID,
  });
  artboard.layers = artboard.layers.map((layer, index) => ({
    ...layer,
    id: `seed_draft_ly_${index}`,
  }));
  return {
    id: SEED_DRAFT_ID,
    name: "開學 · 允許慢一點",
    createdAt: now,
    updatedAt: now,
    brandId: SEED_BRAND_ID,
    templateId: "quote",
    activeFormatId: "story",
    status: "draft",
    contentKind: kindFromFormat("story", false),
    contentStatus: "creating",
    scheduledAt: null,
    publishedAt: null,
    campaignId: null,
    sourceRefs: [],
    brief: migrateBrief({
      product: "開學生活貼",
      eventName: "開學允許慢一點",
      schedule: "開學第一週",
      location: "淡水校園",
      offer: "",
      audience: "剛到淡水的大一、還在認路的人",
      goal: "ugc",
      features: "生活感、不是招生",
      style: "短、像訊息",
      notes: "不要活動海報感。",
      deliverables: { post: false, story: true, carousel: false, reels: false },
    }),
    copy: draftCopy,
    plan: null,
    artboards: {
      story: artboard,
    },
    slides: {
      story: [artboard],
    },
    slideIndex: 0,
    snapshots: [],
    planVersions: [],
    exports: [],
  };
}

export const SEED_SCHEDULE: ScheduleItem[] = [
  {
    id: "sch_hero",
    projectId: SEED_PROJECT_ID,
    campaignId: SEED_CAMPAIGN_ID,
    kind: "carousel",
    title: "浮游禪光主視覺",
    scheduledAt: Date.parse("2026-09-17T19:00:00+08:00"),
    publishedAt: null,
    status: "scheduled",
    caption: "最近是不是很久沒有好好坐下來？\n9/24 晚上，淡水校園。來坐一下。",
    hashtags: ["#淡江禪學社", "#浮游禪光", "#淡水"],
  },
  {
    id: "sch_story",
    projectId: SEED_DRAFT_ID,
    campaignId: null,
    kind: "story",
    title: "開學允許慢一點",
    scheduledAt: Date.parse("2026-09-16T21:00:00+08:00"),
    publishedAt: null,
    status: "creating",
  },
];

export const SEED_REMOTE_FILES: RemoteFile[] = [
  {
    id: "drv_tea_2025",
    provider: "drive",
    name: "2025 茶會現場",
    mime: "image/jpeg",
    tags: ["茶會", "晚上", "同學", "互動"],
    summary: "歷屆晚上茶會，很多人圍坐。連接 Drive 後會換成真實檔案。",
  },
  {
    id: "drv_plan_light",
    provider: "drive",
    name: "浮游禪光企劃",
    mime: "application/pdf",
    tags: ["浮游禪光", "企劃", "燈"],
    summary: "活動流程與燈的配置。",
  },
  {
    id: "canva_tea",
    provider: "canva",
    name: "茶會 IG 主視覺",
    mime: "application/canva",
    tags: ["茶會", "Canva", "主視覺"],
    summary: "歷屆茶會版型，三色光。延續 DNA，不要直接複製。",
  },
  {
    id: "canva_recruit",
    provider: "canva",
    name: "招新版型",
    mime: "application/canva",
    tags: ["招生", "template"],
    summary: "招生活動版型。每年換學生情境，不要整張沿用。",
  },
];

export const SEED_IG_MEMORY: IgMemoryPost[] = [
  {
    id: "ig_local_1",
    caption: "最近是不是很久沒有好好坐下來？",
    date: "2026-09-17",
    kind: "carousel",
    likes: 86,
    comments: 7,
    saves: 21,
    reach: 420,
    impressions: 510,
    source: "local",
    projectId: SEED_PROJECT_ID,
    assetId: SEED_LIGHT_ID,
  },
  {
    id: "ig_mem_tea",
    caption: "有時候我們需要的不是答案，只是一個安靜的晚上。",
    date: "2025-12-04",
    kind: "post",
    likes: 124,
    comments: 14,
    saves: 33,
    reach: 680,
    impressions: 740,
    source: "local",
    assetId: SEED_TAMSUI_ID,
    analysis: "生活問句當 Hook，比活動全名更容易停滑。",
  },
  {
    id: "ig_mem_info",
    caption: "淡江大學禪學社 9/24 浮游禪光活動開始報名，地點在社團教室。",
    date: "2025-09-10",
    kind: "post",
    likes: 22,
    comments: 1,
    saves: 4,
    reach: 390,
    impressions: 450,
    source: "local",
    analysis: "資訊堆疊、沒有問句，停留感較弱。下一次先讓學生覺得被看見。",
  },
];

export const SEED_PROJECT = createSeedProject();
