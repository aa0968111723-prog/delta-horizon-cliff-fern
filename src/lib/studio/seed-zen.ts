import { emptyBoilerplate } from "./boilerplate";
import { migrateBrief, migratePlan, migratePlanVersions } from "./brief";
import { buildLayout } from "./layout";
import type { AssetMeta, BrandKit, Project } from "./types";

// Keep the original seed ids so untouched demo data can be migrated in place.
export const SEED_BRAND_ID = "brand_nisshoku";
export const SEED_PROJECT_ID = "proj_yirgacheffe";
export const SEED_DRAFT_ID = "proj_weekend_pour";
export const SEED_LOGO_ID = "asset_tku_zen_logo";

const SEED_TIME = Date.parse("2026-09-16T00:00:00+08:00");

export const SEED_ASSETS: AssetMeta[] = [
  {
    id: SEED_LOGO_ID,
    name: "三色光標誌",
    kind: "logo",
    category: "logo",
    mime: "image/svg+xml",
    width: 96,
    height: 96,
    tags: ["Logo", "龜龜", "三色光", "淡江禪學社"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/zen-mark.svg",
    source: "seed",
    licenseNotes: "淡江大學禪學社品牌示意標誌。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 2,
  },
];

export const SEED_BRAND: BrandKit = {
  id: SEED_BRAND_ID,
  name: "淡江大學禪學社",
  handle: "@tku_zen",
  website: "",
  voice: "像一位懂淡江生活的社團同學：自然、溫暖、偶爾口語，先陪伴再介紹活動。",
  doSay: "喘口氣、慢下來、整理情緒、認識自己、一起坐坐、可以帶朋友",
  dontSay: "誠摯邀請、殊勝、開悟、法喜充滿、艱澀佛學、說教與過度工整的 AI 金句",
  forbiddenWords: ["誠摯邀請", "殊勝", "開悟", "法喜充滿"],
  colors: [
    { id: "zen-c1", hex: "#174D49", role: "primary", label: "淡水深綠" },
    { id: "zen-c2", hex: "#D8B86A", role: "secondary", label: "禪光金" },
    { id: "zen-c3", hex: "#F4F1EA", role: "background", label: "霧白" },
    { id: "zen-c4", hex: "#D97A5B", role: "accent", label: "晚霞珊瑚" },
    { id: "zen-c5", hex: "#18312F", role: "ink", label: "深墨綠" },
  ],
  fontDisplay: "Noto Serif TC",
  fontBody: "Noto Sans TC",
  logoAssetId: SEED_LOGO_ID,
  logos: [
    {
      id: "logo_tku_zen_primary",
      name: "三色光主標誌",
      assetId: SEED_LOGO_ID,
      usage: "primary",
    },
  ],
  slogans: ["在忙亂裡，留一點空間給自己。", "一起坐坐，不急著想通。"],
  ctas: ["看看活動", "找朋友一起來", "保留這個晚上"],
  imageStyle: {
    mood: "明亮、療癒、年輕、有空氣感，帶一點淡水夜色與校園生活",
    lighting: "自然光、傍晚藍調或柔和三色光，避免宗教殿堂感與過度夢幻濾鏡",
    paletteHint: "霧白、淡水深綠、禪光金、晚霞珊瑚",
    composition: "人物或校園情境保留呼吸感，標題區清楚，手機上三秒能讀懂",
    do: "淡江校園、淡水、捷運、宿舍、同學互動、真實活動瞬間、龜龜與三色光",
    dont: "神像、蓮花堆疊、香火、沉重宗教符號、老氣書法、假笑 AI 人像、過量發光",
  },
  rules: {
    noCompetitorMarks: true,
    noWatermark: true,
    noLowRes: true,
    notes: "先讓學生感到與生活有關，再介紹禪與活動；時間、地點、報名方式不可藏起來。",
  },
  boilerplate: {
    ...emptyBoilerplate(),
    cta: "看看活動",
    disclaimer: "",
    hashtags: ["#淡江大學", "#淡江禪學社", "#淡江生活"],
    captionClose: "如果你也想喘口氣，可以找朋友一起來。",
  },
  memory: {
    mission: "把禪轉譯成淡江學生在課業、人際與生活壓力中可以實際感受到的安定、陪伴與自我探索。",
    audienceSegments: ["大一新生", "住宿生", "通勤生", "研究生", "社團新鮮人", "想交朋友的人", "課業或人際壓力大的學生"],
    campusContexts: ["下課後", "淡水雨天", "紅樹林到淡水的捷運通勤", "宿舍夜晚", "期中報告堆疊", "剛到淡水生活"],
    seasonalMoments: ["開學與社團博覽會", "期中前後", "期末與離校前", "淡水冬季濕冷", "新生適應期"],
    contentPillars: ["活動宣傳", "學生生活共鳴", "情緒整理", "社員故事", "禪的生活轉譯", "互動與問答"],
    signatureElements: ["龜龜角色", "三色光", "淡水深綠", "禪光金", "晚霞珊瑚", "真實社員互動"],
    learnedPatterns: ["先寫學生正在經歷的事，再介紹活動", "時間、地點與參加方式集中且清楚", "避免把每句都寫成金句", "讓內容值得傳給一位朋友"],
    updatedAt: SEED_TIME,
  },
  updatedAt: SEED_TIME,
};

const copy = {
  eyebrow: "09.24 / TKU",
  headline: "最近是不是\n很久沒有好好坐下來？",
  subhead: "浮游禪光・一個不用急著想通的晚上",
  body: "在開學後的課表、通勤與新關係裡，留兩個小時整理最近的自己。",
  cta: "保留這個晚上",
  handle: "@tku_zen",
  caption:
    "最近是不是連坐下來，都還在想下一件事？\n\n09/24 晚上，我們想留一個不用急著想通的空間。可以安靜坐坐、整理最近的心情，也可以認識幾個新朋友。\n\n時間｜09/24 19:00–21:00\n地點｜淡江大學校園\n\n如果你也想喘口氣，可以找朋友一起來。",
  hashtags: ["#淡江大學", "#淡江禪學社", "#淡江生活", "#淡江社團", "#浮游禪光"],
  altText: "霧白與淡水深綠的浮游禪光活動宣傳，邀請淡江學生在九月二十四日晚間留一點空間給自己。",
};

const pageCopy = [
  {
    eyebrow: "09.24 / TKU",
    headline: "最近是不是\n很久沒有好好坐下來？",
    subhead: "浮游禪光",
    body: "先不用急著想通。",
    cta: "往下看看",
  },
  {
    eyebrow: "最近的你",
    headline: "下課了\n腦袋還沒下課",
    subhead: "課表、通勤、新關係一起湧進來",
    body: "有時候不是不累，只是不知道要在哪裡停一下。",
    cta: "留一點空間",
  },
  {
    eyebrow: "這個晚上",
    headline: "慢下來\n整理最近的自己",
    subhead: "不說教，也不需要懂禪",
    body: "一起坐坐、聊聊，也可以安靜待著。",
    cta: "可以帶朋友",
  },
  {
    eyebrow: "你會得到",
    headline: "不是答案\n是一點呼吸的空間",
    subhead: "安定・陪伴・自我探索",
    body: "在忙亂裡重新看見自己。",
    cta: "看看活動",
  },
  {
    eyebrow: "SAVE THE NIGHT",
    headline: "09.24\n浮游禪光",
    subhead: "19:00–21:00・淡江大學校園",
    body: "報名資訊請見禪學社 IG。",
    cta: "保留這個晚上",
  },
  {
    eyebrow: "淡江大學禪學社",
    headline: "一起坐坐\n不急著想通",
    subhead: "@tku_zen",
    body: "如果你也想喘口氣，可以找朋友一起來。",
    cta: "找朋友一起來",
  },
] as const;

const templates = ["editorial", "quote", "product", "editorial", "offer", "quote"] as const;
const roles = ["cover", "problem", "detail", "proof", "cta", "close"] as const;

export function createSeedProject(): Project {
  const slides = pageCopy.map((item, index) => {
    const board = buildLayout("feed-portrait", { ...copy, ...item }, SEED_BRAND, templates[index]);
    board.layers = board.layers.map((layer, layerIndex) => ({
      ...layer,
      id: `zen_${index}_${layerIndex}`,
    }));
    board.role = roles[index];
    board.templateId = templates[index];
    return board;
  });

  const brief = migrateBrief({
    product: "浮游禪光晚間活動",
    eventName: "09/24 浮游禪光",
    schedule: "09/24 19:00–21:00",
    location: "淡江大學校園",
    audience: "剛開學還在適應課表、通勤、宿舍與新關係的淡江學生",
    goal: "awareness",
    features: "慢下來、整理情緒、自在認識新朋友；不需要懂禪",
    style: "夜晚、柔和三色光、有校園生活感，不宗教、不說教",
    notes: "第一句先說學生生活；時間地點清楚；可以帶朋友。",
    deliverables: { post: true, story: true, carousel: true, reels: true },
  });

  const plan = migratePlan({
    campaignName: "09/24 浮游禪光",
    concept: "先接住開學後停不下來的感受，再把活動介紹成一個可以喘口氣、整理自己、認識朋友的晚上。",
    insight: "淡江學生不一定在找禪，但可能正在找一個能慢下來又不尷尬的地方。",
    hook: copy.headline.replace("\n", ""),
    visualTheme: "淡水夜色、霧白留白與柔和三色光",
    visualDirection: "以霧白和深綠為主，禪光金與晚霞珊瑚做小面積節奏；避免宗教符號。",
    templateId: "editorial",
    colorMood: "霧白、淡水深綠、禪光金、晚霞珊瑚",
    eyebrow: copy.eyebrow,
    headline: copy.headline,
    subhead: copy.subhead,
    body: copy.body,
    cta: copy.cta,
    captions: [
      { style: "學生版", text: copy.caption },
      { style: "短版", text: "下課了，腦袋還沒下課嗎？\n09/24，一起留一個不用急著想通的晚上。" },
    ],
    hashtags: copy.hashtags,
    storyBeats: ["最近連休息都在想下一件事嗎？", "今晚不用懂禪，只要來坐坐", "09/24 19:00・找朋友一起來"],
    carouselPages: pageCopy.map((item, index) => ({
      role: roles[index],
      ...item,
      visualNote: index === 0 ? "封面只保留 Hook、活動名與日期。" : "使用校園生活感與三色光節奏。",
      templateId: templates[index],
    })),
    assetNeeds: [
      { kind: "photo", title: "淡江傍晚校園", detail: "有空氣感，可留字區。", required: true },
      { kind: "people", title: "同學自然互動", detail: "不看鏡頭、不擺拍。", required: false },
      { kind: "logo", title: "三色光標誌", detail: "小尺寸放角落。", required: true },
    ],
    checklist: ["第一句不是制式邀請", "時間與地點清楚", "不使用艱澀禪語", "手機三秒讀懂", "CTA 知道下一步"],
    altText: copy.altText,
    qaNotes: [
      "淡江學生會不會覺得這在說自己的生活？",
      "是否太宗教、太嚴肅、太文青或太像 AI？",
      "活動內容、時間、地點與參加方式是否清楚？",
    ],
    generatedAt: SEED_TIME,
    source: "mock",
  });

  return {
    id: SEED_PROJECT_ID,
    name: "09/24 浮游禪光",
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    brandId: SEED_BRAND_ID,
    templateId: "editorial",
    activeFormatId: "feed-portrait",
    status: "complete",
    brief,
    copy,
    plan,
    artboards: { "feed-portrait": slides[0] },
    slides: { "feed-portrait": slides },
    slideIndex: 0,
    snapshots: [
      {
        id: "snap_zen_seed",
        name: "初稿・六頁輪播",
        createdAt: SEED_TIME,
        kind: "manual",
        formatId: "feed-portrait",
        slideIndex: 0,
        artboard: structuredClone(slides[0]),
        pages: structuredClone(slides),
      },
    ],
    planVersions: migratePlanVersions(undefined, plan),
    exports: [],
  };
}

export function createSeedDraft(): Project {
  const draftCopy = {
    ...copy,
    eyebrow: "限動想法",
    headline: "下課後\n先不要急著回訊息",
    subhead: "三十秒，看看自己現在的狀態",
    body: "",
    cta: "你今天還好嗎？",
    caption: "",
  };
  const artboard = buildLayout("story", draftCopy, SEED_BRAND, "quote");
  artboard.layers = artboard.layers.map((layer, index) => ({ ...layer, id: `zen_draft_${index}` }));
  return {
    id: SEED_DRAFT_ID,
    name: "開學後的三十秒",
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    brandId: SEED_BRAND_ID,
    templateId: "quote",
    activeFormatId: "story",
    status: "idea",
    brief: migrateBrief({
      eventName: "開學後的三十秒",
      audience: "剛下課、正在通勤或回宿舍的淡江學生",
      features: "一張簡單的情緒投票限動",
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
