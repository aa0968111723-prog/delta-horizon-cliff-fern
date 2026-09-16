import { emptyBoilerplate } from "./boilerplate";
import { migrateBrief, migratePlan, migratePlanVersions } from "./brief";
import { buildLayout } from "./layout";
import { localCarousel, localLine, localStrategy, localThreads } from "../ai/zen-local";
import type { AssetMeta, BrandKit, Campaign, CampaignStrategy, ContentItem, CopyDraft, Layer, Project } from "./types";

/**
 * 淡江大學禪學社 seed：品牌記憶、示範素材、一個示範活動（浮游禪光）與對應內容。
 * 所有 seed 素材都是 SVG（public/seed/*），首次載入時寫進 IndexedDB。
 */

export const SEED_BRAND_ID = "brand_tku_zen";
export const SEED_PROJECT_ID = "proj_floating_light";
export const SEED_DRAFT_ID = "proj_midterm_story";
export const SEED_CAMPAIGN_ID = "camp_floating_light";
export const SEED_LOGO_ID = "asset_zen_logo";
export const SEED_MASCOT_ID = "asset_gugu";
export const SEED_GLOW_ID = "asset_tricolor_glow";
export const SEED_TAMSUI_ID = "asset_tamsui_dusk";
export const SEED_CAMPUS_ID = "asset_campus_night";

const SEED_TIME = Date.parse("2026-09-10T00:00:00+08:00");
const OWNER = "淡江大學禪學社";

function seedAsset(input: Omit<AssetMeta, "createdAt" | "updatedAt" | "source" | "licenseOwner" | "lastUsedAt" | "useCount" | "favorite"> & Partial<Pick<AssetMeta, "favorite" | "useCount">>): AssetMeta {
  return {
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    source: "seed",
    licenseOwner: OWNER,
    lastUsedAt: null,
    useCount: 0,
    favorite: false,
    insight: null,
    externalRef: null,
    ...input,
  };
}

export const SEED_ASSETS: AssetMeta[] = [
  seedAsset({
    id: SEED_LOGO_ID,
    name: "禪學社 Logo",
    kind: "logo",
    category: "logo",
    mime: "image/svg+xml",
    width: 160,
    height: 160,
    tags: ["logo", "品牌", "三色光"],
    seedSrc: "/seed/zen-logo.svg",
    licenseNotes: "社團自有標誌。",
    favorite: true,
    useCount: 3,
  }),
  seedAsset({
    id: SEED_MASCOT_ID,
    name: "龜龜",
    kind: "image",
    category: "mascot",
    mime: "image/svg+xml",
    width: 240,
    height: 200,
    tags: ["龜龜", "角色", "吉祥物", "三色光"],
    seedSrc: "/seed/gugu.svg",
    licenseNotes: "社團角色，慢慢來、不催促。可放畫面角落。",
    favorite: true,
    useCount: 2,
  }),
  seedAsset({
    id: SEED_GLOW_ID,
    name: "三色光 背景",
    kind: "pattern",
    category: "background",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["三色光", "背景", "漸層", "品牌色"],
    seedSrc: "/seed/tricolor-glow.svg",
    licenseNotes: "品牌三色光暈，作底圖或 Story 背景。",
    favorite: true,
    useCount: 4,
  }),
  seedAsset({
    id: SEED_TAMSUI_ID,
    name: "淡水 傍晚河邊",
    kind: "image",
    category: "tamsui",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["淡水", "夕陽", "河邊", "一個人", "生活感"],
    seedSrc: "/seed/tamsui-dusk.svg",
    licenseNotes: "示範場景圖。實拍照片請上傳或從 Google Drive 匯入。",
    useCount: 1,
  }),
  seedAsset({
    id: SEED_CAMPUS_ID,
    name: "淡江 宮燈大道 夜",
    kind: "image",
    category: "campus",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["淡江", "校園", "宮燈", "夜晚", "期中"],
    seedSrc: "/seed/campus-night.svg",
    licenseNotes: "示範場景圖。實拍照片請上傳或從 Google Drive 匯入。",
    useCount: 1,
  }),
];

export const SEED_BRAND: BrandKit = {
  id: SEED_BRAND_ID,
  name: "淡江大學禪學社",
  handle: "@tku.zen",
  website: "",
  voice: "像一個坐在你旁邊的學長姐在講話：安靜、直接、不推銷、不說教。可以口語，可以不完整句。",
  doSay: "安靜、慢下來、喘口氣、認識自己、整理情緒、陪伴、一個人也可以來、不用會什麼",
  dontSay: "誠摯邀請您、殊勝、法喜、功德、開悟、業障、限時、瘋搶、Z 世代",
  forbiddenWords: ["誠摯邀請", "蒞臨", "殊勝", "法喜", "功德", "開悟", "業障", "皈依"],
  colors: [
    { id: "c1", hex: "#2B2B36", role: "primary", label: "墨夜" },
    { id: "c2", hex: "#3E7C6F", role: "secondary", label: "龜龜綠" },
    { id: "c3", hex: "#FFF6E9", role: "background", label: "米光" },
    { id: "c4", hex: "#F2B56B", role: "accent", label: "暖光" },
    { id: "c5", hex: "#2B2B36", role: "ink", label: "墨" },
  ],
  fontDisplay: "Noto Sans TC",
  fontBody: "Noto Sans TC",
  logoAssetId: SEED_LOGO_ID,
  logos: [
    { id: "logo_zen_primary", name: "主標誌", assetId: SEED_LOGO_ID, usage: "primary" },
    { id: "logo_zen_mark", name: "圖標", assetId: SEED_LOGO_ID, usage: "mark" },
  ],
  slogans: ["先坐下來，再說。", "一個人也可以來。", "不用會什麼。"],
  ctas: ["直接來就好", "找室友一起來", "私訊我們", "bio 連結報名"],
  imageStyle: {
    mood: "安靜、有人在、夜晚的一盞燈",
    lighting: "傍晚自然光或室內暖燈，不要硬閃、不要過飽和",
    paletteHint: "米光底、墨夜、龜龜綠、暖光；三色光（暖橘 / 青綠 / 淡紫）做光暈",
    composition: "上 2/3 場景，下 1/3 留白放兩行標題；龜龜小小地在角落",
    do: "淡水河邊、宮燈大道、宿舍窗邊、茶杯、坐墊、學生背影、手的局部、真實活動照",
    dont: "佛像、法器、蓮花、合掌、金色宗教感、太多濾鏡、AI 味的完美臉、大量文字",
  },
  rules: {
    noCompetitorMarks: true,
    noWatermark: true,
    noLowRes: true,
    notes: "第一句不出現社團名；宗教符號不進主畫面；Logo 放角落不壓人臉。",
  },
  boilerplate: {
    ...emptyBoilerplate(),
    cta: "直接來就好",
    disclaimer: "",
    hashtags: ["#淡江大學禪學社", "#淡江", "#慢下來"],
    captionClose: "一個人來、找朋友一起來都可以。",
  },
  memory: {
    mission: "在淡江校園裡留一個地方，讓學生可以什麼都不做、不用表現什麼，慢慢認識自己。",
    fixedIntro: "淡江大學禪學社｜每週三晚上社課，不點名、不用會打坐、不用信什麼。茶會、靜坐體驗、講座、一日禪，開放全校同學。",
    mascotName: "龜龜",
    mascotDescription: "一隻慢慢走的小綠龜，背上有三色光。代表「慢一點也可以」，出現在畫面角落，不搶戲。",
    mascotAssetId: SEED_MASCOT_ID,
    signatureVisual: "三色光：暖橘 #F2B56B、青綠 #7FB7A8、淡紫 #C9B8E8 的柔和光暈，象徵安定、專注、陪伴。",
    likedStyles: ["夜晚的一盞燈", "淡水河邊傍晚", "雜誌感留白", "真實學生照片", "手寫感小字"],
    dislikedStyles: ["宗教金色", "蓮花 / 佛像", "大量文字海報", "過度濾鏡", "AI 完美臉", "企業感"],
    audienceNotes: "淡江學生：大一剛到淡水最需要歸屬感；期中 / 期末壓力最大；住宿生晚上很吵也很孤單；通勤生校園只是路過；很多人以為禪＝宗教，先讓他們知道「只是來喘口氣」。",
    toneExamples: [
      "最近是不是連休息都覺得有罪惡感？",
      "有時候我們需要的不是答案，只是一個安靜的晚上。",
      "不用會打坐，不用信什麼，坐著就好。",
      "一個人來也 ok，帶室友來也 ok。",
    ],
    recurringEvents: ["週三社課", "浮游禪光茶會", "期中靜坐體驗", "迎新茶會", "一日禪", "期末成果分享"],
    igDna:
      "常用配色：墨夜、暖光、三色光暈。常見活動：茶會、社課、迎新。語氣：第一句先講學生狀態，不出現社團名。Caption 約 80–180 字。Hashtag：#淡江大學禪學社 #淡江 #慢下來。視覺：夜晚一盞燈、淡水河邊、真實學生照、龜龜角落。CTA：直接來就好。互動偏好：限動投票、收藏多於按讚。",
  },
  updatedAt: SEED_TIME,
};

/* ------------------------------------------------------------------ */
/* 示範活動：浮游禪光                                                     */
/* ------------------------------------------------------------------ */

const copy = {
  eyebrow: "9/24（三）19:00 · B302",
  headline: "最近是不是\n很久沒有好好坐下來？",
  subhead: "浮游禪光｜一個晚上，一杯茶，什麼都不用做。",
  body: "不用會打坐，不用信什麼。一個人來也可以。",
  cta: "直接來就好",
  handle: "@tku.zen",
  caption:
    "最近是不是很久沒有好好坐下來？\n\n開學第二週，課表排滿了，人也認識了一些，但好像還沒有一個地方可以什麼都不做。\n\n浮游禪光\n9/24（三）19:00–21:00｜B302\n燈調暗，坐墊放好，我們泡茶。中間有十分鐘靜坐體驗，第一次也可以。\n\n不用報名，直接來就好。一個人來、找室友一起來都可以。",
  hashtags: ["#淡江大學禪學社", "#淡江", "#浮游禪光", "#茶會", "#淡水", "#慢下來", "#大學生活"],
  altText: "夜晚的宮燈大道，燈亮著；下方標題：最近是不是很久沒有好好坐下來？",
};

const seedCopyDraft: CopyDraft = {
  tone: "normal",
  hook: copy.headline.replace("\n", ""),
  body: copy.caption.split("\n").slice(2).join("\n"),
  cta: copy.cta,
  hashtags: copy.hashtags,
};

const SEED_CAMPAIGN_CTX = {
  name: "浮游禪光" as const,
  type: "tea" as const,
  date: "2026-09-24",
  time: "19:00–21:00",
  location: "淡江大學 B302 教室",
  oneLiner: "一個晚上，一杯茶，什麼都不用做。",
  description:
    "開學第二週，很多人還在適應。浮游禪光是一場給淡江學生的夜晚茶會：燈調暗，坐墊放好，我們泡茶，你可以說話也可以不說話。中間有十分鐘的靜坐體驗，第一次也可以。",
  theme: "在新學期的浮動裡，找一個可以停下來的晚上",
  painPoints: ["belonging", "lonely", "stress"] as ("belonging" | "lonely" | "stress")[],
  cta: "直接來就好",
  signupUrl: "",
  brandContext: "龜龜、三色光、不要宗教詞、第一句不出現社團名",
  studentContext: "開學 / 新生週。大一剛到淡水。",
};

function seedCampaignStrategy(): CampaignStrategy {
  const strategy = localStrategy(SEED_CAMPAIGN_CTX);
  return {
    ...strategy,
    generatedAt: SEED_TIME,
    chosenDirectionId: "dir_a",
    waves: strategy.waves.map((w) => ({
      ...w,
      contentType: w.role === "keyvisual" ? "carousel" : w.contentType,
      contentId: w.role === "keyvisual" ? "content_floating_kv" : w.role === "reason" ? "content_floating_reels" : null,
    })),
  };
}

export const SEED_CAMPAIGN: Campaign = {
  id: SEED_CAMPAIGN_ID,
  name: "浮游禪光",
  type: "tea",
  date: "2026-09-24",
  time: "19:00–21:00",
  location: "淡江大學 B302 教室",
  oneLiner: "一個晚上，一杯茶，什麼都不用做。",
  description:
    "開學第二週，很多人還在適應。浮游禪光是一場給淡江學生的夜晚茶會：燈調暗，坐墊放好，我們泡茶，你可以說話也可以不說話。中間有十分鐘的靜坐體驗，第一次也可以。",
  theme: "在新學期的浮動裡，找一個可以停下來的晚上",
  painPoints: ["belonging", "lonely", "stress"],
  cta: "直接來就好",
  signupUrl: "",
  coverAssetId: SEED_CAMPUS_ID,
  assetIds: [SEED_CAMPUS_ID, SEED_GLOW_ID, SEED_MASCOT_ID],
  strategy: seedCampaignStrategy(),
  createdAt: SEED_TIME,
  updatedAt: SEED_TIME,
};

function stabilize(layers: Layer[], prefix: string): Layer[] {
  return layers.map((layer, index) => ({ ...layer, id: `${prefix}${index}` }));
}

export function createSeedProject(): Project {
  const now = SEED_TIME;
  const page1 = buildLayout("feed-portrait", copy, SEED_BRAND, "editorial", { imageAssetId: SEED_CAMPUS_ID });
  page1.layers = stabilize(page1.layers, "seed_ly_");
  page1.role = "cover";
  page1.templateId = "editorial";

  const page2 = buildLayout(
    "feed-portrait",
    { ...copy, eyebrow: "你可能也這樣", headline: "宿舍很熱鬧\n但你有點想安靜一下", subhead: "剛到淡水，晚餐還是一個人吃嗎？", body: "不是你的問題，只是還沒有一個地方讓你什麼都不用做。", cta: "" },
    SEED_BRAND,
    "quote",
  );
  page2.layers = stabilize(page2.layers, "seed_p2_ly_");
  page2.role = "problem";
  page2.templateId = "quote";

  const page3 = buildLayout(
    "feed-portrait",
    { ...copy, eyebrow: "浮游禪光", headline: "一個晚上\n一杯茶", subhead: "燈調暗、坐墊放好、我們泡茶。", body: "中間有十分鐘靜坐體驗，第一次也可以。", cta: "" },
    SEED_BRAND,
    "editorial",
    { imageAssetId: SEED_TAMSUI_ID },
  );
  page3.layers = stabilize(page3.layers, "seed_p3_ly_");
  page3.role = "detail";
  page3.templateId = "editorial";

  const page4 = buildLayout(
    "feed-portrait",
    { ...copy, eyebrow: "怎麼來", headline: "9/24（三）\n19:00 B302", subhead: "不用報名，直接來就好。", body: "一個人來、找室友一起來都可以。", cta: "直接來就好" },
    SEED_BRAND,
    "offer",
  );
  page4.layers = stabilize(page4.layers, "seed_p4_ly_");
  page4.role = "cta";
  page4.templateId = "offer";

  const slides = [page1, page2, page3, page4];

  const brief = migrateBrief({
    product: "浮游禪光 夜晚茶會",
    eventName: "浮游禪光",
    schedule: "9/24（三）19:00–21:00",
    location: "淡江大學 B302",
    offer: "不用報名，直接來",
    audience: "淡江大一新生、剛到淡水還沒找到歸屬感的人、開學壓力大的人",
    goal: "traffic",
    features: "燈調暗、泡茶、十分鐘靜坐體驗、可以不說話",
    style: "安靜、有人在、夜晚的一盞燈",
    notes: "第一句不出現社團名，先講學生狀態。",
      deliverables: { post: true, story: true, carousel: true, reels: true },
  });

  const plan = migratePlan({
    campaignName: "浮游禪光",
    concept: "開學第二週的浮動裡，給學生一個可以停下來的晚上。禪不出現在第一句，安靜和陪伴先出現。",
    insight: "剛到淡水的學生不缺活動，缺一個「去了不用表現什麼」的地方。",
    hook: "最近是不是很久沒有好好坐下來？",
    visualTheme: "夜晚宮燈大道的一盞燈，三色光暈，下方留白。",
    visualDirection: "上 2/3 夜景，下 1/3 米光底放兩行標題；龜龜在右下角。",
    templateId: "editorial",
    colorMood: "墨夜、暖光、米光",
    eyebrow: copy.eyebrow,
    headline: copy.headline,
    subhead: copy.subhead,
    body: copy.body,
    cta: copy.cta,
    captions: [
      { style: "一般版", text: copy.caption },
      { style: "短版", text: "最近是不是很久沒有好好坐下來？\n9/24（三）19:00 B302，浮游禪光。\n不用報名，直接來。" },
    ],
    hashtags: copy.hashtags,
    storyBeats: ["投票：最近有好好休息嗎", "主視覺 + 倒數", "教室門口怎麼走"],
    carouselPages: [
      { role: "cover", headline: copy.headline, subhead: copy.subhead, body: "", cta: "", visualNote: "夜景 + 大字", templateId: "editorial" },
      { role: "problem", headline: "宿舍很熱鬧\n但你有點想安靜一下", subhead: "剛到淡水，晚餐還是一個人吃嗎？", body: "不是你的問題。", cta: "", visualNote: "一行字，留白", templateId: "quote" },
      { role: "detail", headline: "一個晚上\n一杯茶", subhead: "燈調暗、坐墊放好、我們泡茶。", body: "十分鐘靜坐體驗，第一次也可以。", cta: "", visualNote: "河邊或茶杯", templateId: "editorial" },
      { role: "cta", headline: "9/24（三）\n19:00 B302", subhead: "不用報名，直接來就好。", body: "一個人來、找室友一起來都可以。", cta: "直接來就好", visualNote: "只留時間地點", templateId: "offer" },
    ],
    assetNeeds: [
      { kind: "photo", title: "宮燈大道夜景", detail: "實拍優先，暖燈。", required: true },
      { kind: "illustration", title: "龜龜", detail: "右下角，小小的。", required: false },
    ],
    checklist: ["第一句沒有社團名", "時間地點有出現", "沒有宗教詞", "看得出怎麼參加", "手機上兩行內看得完"],
    altText: copy.altText,
    qaNotes: ["Logo 不壓在人臉或燈上", "標題兩行以內"],
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
    name: "浮游禪光 · 主視覺輪播",
    createdAt: now,
    updatedAt: now,
    brandId: SEED_BRAND_ID,
    templateId: "editorial",
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
        name: "初稿 · 四頁輪播",
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
    eyebrow: "期中前",
    headline: "先給自己\n五分鐘",
    subhead: "報告寫到一半，突然不知道自己在幹嘛。",
    body: "",
    cta: "週三晚上見",
    handle: "@tku.zen",
    caption: "",
    hashtags: ["#淡江大學禪學社"],
    altText: "",
  };
  const artboard = buildLayout("story", draftCopy, SEED_BRAND, "quote", { imageAssetId: SEED_GLOW_ID });
  artboard.layers = artboard.layers.map((layer, index) => ({ ...layer, id: `seed_draft_ly_${index}` }));
  return {
    id: SEED_DRAFT_ID,
    name: "期中前 · 五分鐘限動",
    createdAt: now,
    updatedAt: now,
    brandId: SEED_BRAND_ID,
    templateId: "quote",
    activeFormatId: "story",
    status: "draft",
    campaignId: "camp_floating_light",
    contentKind: "story",
    contentStatus: "idea",
    scheduledAt: Date.parse("2026-09-22T21:00:00+08:00"),
    publishedAt: null,
    brief: migrateBrief({
      product: "期中前限動",
      eventName: "期中前 · 先給自己五分鐘",
      schedule: "期中前一週",
      location: "IG 限動",
      offer: "",
      audience: "期中壓力大的淡江學生",
      goal: "awareness",
      features: "一行字、三色光",
      style: "安靜",
      notes: "不宣傳活動，只陪伴。",
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

export const SEED_CONTENTS: ContentItem[] = [
  {
    id: "content_floating_kv",
    campaignId: SEED_CAMPAIGN_ID,
    type: "carousel",
    status: "done",
    title: "浮游禪光 · 主視覺輪播",
    copy: {
      tone: "normal",
      hook: copy.headline.replace("\n", ""),
      body: copy.caption.split("\n").slice(2).join("\n"),
      cta: copy.cta,
      hashtags: copy.hashtags,
    },
    variants: [],
    imagePrompt:
      "Tamkang University lantern-lined path at night, one warm lamp glowing, soft three-color glow (amber, teal, lavender), empty space in the lower third for text, photographic, film grain, no text, no religious symbols, Instagram 4:5",
    visualDirection: "夜晚宮燈大道的一盞燈，三色光暈，下方留白。",
    carousel: localCarousel(SEED_CAMPAIGN_CTX, seedCopyDraft),
    storyFrames: [],
    reels: [],
    threads: localThreads(SEED_CAMPAIGN_CTX, seedCopyDraft),
    line: localLine(SEED_CAMPAIGN_CTX, seedCopyDraft),
    review: null,
    sources: [
      { kind: "library", label: "素材庫 / 淡江 宮燈大道 夜", refId: SEED_CAMPUS_ID },
      { kind: "brand", label: "Brand Memory / 三色光、龜龜" },
    ],
    projectId: SEED_PROJECT_ID,
    coverAssetId: SEED_CAMPUS_ID,
    scheduledAt: Date.parse("2026-09-17T20:00:00+08:00"),
    publishedAt: null,
    metrics: null,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    generatedBy: "live",
  },
  {
    id: "content_midterm_story",
    campaignId: null,
    type: "story",
    status: "drafting",
    title: "期中前 · 先給自己五分鐘",
    copy: {
      tone: "short",
      hook: "先給自己五分鐘",
      body: "報告寫到一半，突然不知道自己在幹嘛。\n週三晚上見。",
      cta: "週三晚上見",
      hashtags: ["#淡江大學禪學社"],
    },
    variants: [],
    imagePrompt: "",
    visualDirection: "三色光底 + 一行字",
    carousel: [],
    storyFrames: [],
    reels: [],
    threads: "",
    line: "",
    review: null,
    sources: [{ kind: "brand", label: "Brand Memory / 三色光" }],
    projectId: SEED_DRAFT_ID,
    coverAssetId: SEED_GLOW_ID,
    scheduledAt: null,
    publishedAt: null,
    metrics: null,
    createdAt: Date.parse("2026-09-12T10:00:00+08:00"),
    updatedAt: Date.parse("2026-09-12T10:00:00+08:00"),
    generatedBy: null,
  },
  {
    id: "content_welcome_recap",
    campaignId: null,
    type: "recap",
    status: "published",
    title: "迎新茶會 · 回顧",
    copy: {
      tone: "warm",
      hook: "謝謝昨天來的每一個人。",
      body: "有人是一個人來的，有人拉了室友。\n燈很暗，茶很熱，大家都沒有很會說話，但沒關係。\n下一次是 9/24 浮游禪光，一樣不用報名。",
      cta: "下次見",
      hashtags: ["#淡江大學禪學社", "#淡江", "#迎新", "#茶會"],
    },
    variants: [],
    imagePrompt: "",
    visualDirection: "現場照片三張 + 一句謝謝",
    carousel: [],
    storyFrames: [],
    reels: [],
    threads: "",
    line: "",
    review: null,
    sources: [{ kind: "instagram", label: "Instagram / 2026-09-11" }],
    projectId: null,
    coverAssetId: SEED_TAMSUI_ID,
    scheduledAt: Date.parse("2026-09-11T21:00:00+08:00"),
    publishedAt: Date.parse("2026-09-11T21:05:00+08:00"),
    metrics: { reach: 1260, likes: 143, comments: 12, saves: 31, shares: 18, views: 0, clicks: 22, syncedAt: SEED_TIME },
    createdAt: Date.parse("2026-09-11T20:00:00+08:00"),
    updatedAt: Date.parse("2026-09-11T21:05:00+08:00"),
    generatedBy: "live",
  },
  {
    id: "content_class_life",
    campaignId: null,
    type: "ig-post",
    status: "published",
    title: "週三社課 · 生活",
    copy: {
      tone: "life",
      hook: "宿舍很熱鬧，但你有點想安靜一下。",
      body: "每週三晚上，B302 燈會調暗一點。\n沒有點名，遲到也沒關係。坐著就好。",
      cta: "週三晚上見",
      hashtags: ["#淡江大學禪學社", "#淡江", "#社課", "#慢下來"],
    },
    variants: [],
    imagePrompt: "",
    visualDirection: "宿舍窗邊的一盞燈",
    carousel: [],
    storyFrames: [],
    reels: [],
    threads: "",
    line: "",
    review: null,
    sources: [{ kind: "instagram", label: "Instagram / 2026-09-03" }],
    projectId: null,
    coverAssetId: SEED_GLOW_ID,
    scheduledAt: Date.parse("2026-09-03T20:00:00+08:00"),
    publishedAt: Date.parse("2026-09-03T20:02:00+08:00"),
    metrics: { reach: 890, likes: 97, comments: 8, saves: 41, shares: 9, views: 0, clicks: 11, syncedAt: SEED_TIME },
    createdAt: Date.parse("2026-09-03T18:00:00+08:00"),
    updatedAt: Date.parse("2026-09-03T20:02:00+08:00"),
    generatedBy: "live",
  },
  {
    id: "content_knowledge_sit",
    campaignId: null,
    type: "knowledge",
    status: "published",
    title: "靜坐不是把腦清空",
    copy: {
      tone: "student",
      hook: "靜坐不是把腦清空。",
      body: "第一次來的人常問：我腦中一直在講話怎麼辦。\n可以講話。就讓它講。你只是先坐著。",
      cta: "",
      hashtags: ["#淡江大學禪學社", "#淡江", "#靜坐", "#第一次也可以"],
    },
    variants: [],
    imagePrompt: "",
    visualDirection: "留白 + 一行字",
    carousel: [],
    storyFrames: [],
    reels: [],
    threads: "",
    line: "",
    review: null,
    sources: [{ kind: "instagram", label: "Instagram / 2026-08-27" }],
    projectId: null,
    coverAssetId: SEED_MASCOT_ID,
    scheduledAt: Date.parse("2026-08-27T20:00:00+08:00"),
    publishedAt: Date.parse("2026-08-27T20:10:00+08:00"),
    metrics: { reach: 1540, likes: 188, comments: 21, saves: 76, shares: 24, views: 0, clicks: 6, syncedAt: SEED_TIME },
    createdAt: Date.parse("2026-08-27T12:00:00+08:00"),
    updatedAt: Date.parse("2026-08-27T20:10:00+08:00"),
    generatedBy: "live",
  },
  {
    id: "content_member_one",
    campaignId: null,
    type: "member-story",
    status: "published",
    title: "社員故事 · 大一",
    copy: {
      tone: "warm",
      hook: "我第一次來，是因為室友臨時不去。",
      body: "大一上，什麼社團都試過，都很吵。\n那天我一個人走到 B302，燈很暗，有人遞給我一杯茶。\n沒有人問我是哪一系的。",
      cta: "下次見",
      hashtags: ["#淡江大學禪學社", "#淡江", "#社員故事"],
    },
    variants: [],
    imagePrompt: "",
    visualDirection: "側臉或手的局部",
    carousel: [],
    storyFrames: [],
    reels: [],
    threads: "",
    line: "",
    review: null,
    sources: [{ kind: "instagram", label: "Instagram / 2026-08-20" }],
    projectId: null,
    coverAssetId: SEED_TAMSUI_ID,
    scheduledAt: Date.parse("2026-08-20T21:00:00+08:00"),
    publishedAt: Date.parse("2026-08-20T21:04:00+08:00"),
    metrics: { reach: 1102, likes: 164, comments: 19, saves: 52, shares: 31, views: 0, clicks: 14, syncedAt: SEED_TIME },
    createdAt: Date.parse("2026-08-20T16:00:00+08:00"),
    updatedAt: Date.parse("2026-08-20T21:04:00+08:00"),
    generatedBy: "live",
  },
  {
    id: "content_recruit_soft",
    campaignId: null,
    type: "ig-post",
    status: "published",
    title: "社博後 · 不是招生",
    copy: {
      tone: "humor",
      hook: "大學生活很自由，但你最近真的有比較快樂嗎？",
      body: "社博攤位很吵，我們攤位很安靜，有點對不起隔壁。\n如果你那天有拿走一杯茶，週三晚上還在。",
      cta: "直接來就好",
      hashtags: ["#淡江大學禪學社", "#淡江", "#社博", "#迎新"],
    },
    variants: [],
    imagePrompt: "",
    visualDirection: "攤位角落、龜龜",
    carousel: [],
    storyFrames: [],
    reels: [],
    threads: "",
    line: "",
    review: null,
    sources: [{ kind: "instagram", label: "Instagram / 2026-09-08" }],
    projectId: null,
    coverAssetId: SEED_CAMPUS_ID,
    scheduledAt: Date.parse("2026-09-08T19:30:00+08:00"),
    publishedAt: Date.parse("2026-09-08T19:35:00+08:00"),
    metrics: { reach: 2104, likes: 231, comments: 27, saves: 44, shares: 16, views: 0, clicks: 38, syncedAt: SEED_TIME },
    createdAt: Date.parse("2026-09-08T12:00:00+08:00"),
    updatedAt: Date.parse("2026-09-08T19:35:00+08:00"),
    generatedBy: "live",
  },
  {
    id: "content_floating_reels",
    campaignId: SEED_CAMPAIGN_ID,
    type: "reels",
    status: "drafting",
    title: "浮游禪光 · 20 秒 Reels",
    copy: {
      tone: "life",
      hook: "最近是不是很久沒有好好坐下來？",
      body: "9/24（三）19:00 B302，浮游禪光。燈調暗，坐墊放好。不用報名，直接來。",
      cta: "直接來就好",
      hashtags: ["#淡江大學禪學社", "#淡江", "#浮游禪光", "#慢下來"],
    },
    variants: [],
    imagePrompt:
      "Vertical 9:16 Instagram Reels cover of Tamkang University lantern-lined path at night, one warm lamp, soft three-color glow, tiny turtle mascot in the corner, no text, no watermark, no religious symbols",
    visualDirection: "前三秒質問字幕，中段社辦門口，結尾時間地點卡。",
    carousel: [],
    storyFrames: [],
    reels: [
      { from: 0, to: 3, visual: "手機畫面：凌晨 1:47，滑 IG。", caption: "最近是不是很久沒有好好坐下來？", voiceover: "", transition: "硬切", assetHint: "自拍手機畫面", assetId: null },
      { from: 3, to: 7, visual: "覺生圖書館空鏡，燈還亮著。", caption: "課表排滿了，人也認識了一些", voiceover: "有時候不是想睡，是停不下來。", transition: "慢推", assetHint: "校園夜景素材", assetId: SEED_CAMPUS_ID },
      { from: 7, to: 12, visual: "B302 門口，燈亮著，有人推門。", caption: "浮游禪光", voiceover: "有一個地方，去了不用做什麼。", transition: "跟拍", assetHint: "社辦 / 教室照片", assetId: null },
      { from: 12, to: 17, visual: "茶杯、坐墊、學生放鬆的側臉。", caption: "一個晚上，一杯茶", voiceover: "不用會打坐，不用信什麼。", transition: "疊化", assetHint: "歷屆活動照片", assetId: SEED_TAMSUI_ID },
      { from: 17, to: 20, visual: "純色卡：時間地點 + 龜龜。", caption: "9/24（三）19:00｜B302", voiceover: "直接來就好", transition: "定格", assetHint: "龜龜 + 三色光", assetId: SEED_MASCOT_ID },
    ],
    threads: "",
    line: "",
    review: null,
    sources: [
      { kind: "brand", label: "Brand Memory / 淡江禪學社" },
      { kind: "library", label: "素材庫 / 宮燈大道", refId: SEED_CAMPUS_ID },
    ],
    projectId: null,
    coverAssetId: SEED_CAMPUS_ID,
    scheduledAt: Date.parse("2026-09-21T20:00:00+08:00"),
    publishedAt: null,
    metrics: null,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    generatedBy: "mock",
  },
  {
    id: "content_reels_stop",
    campaignId: null,
    type: "reels",
    status: "published",
    title: "先給自己五分鐘",
    copy: {
      tone: "short",
      hook: "先給自己五分鐘",
      body: "報告寫到一半，突然不知道自己在幹嘛。週三晚上，B302 燈會調暗一點。",
      cta: "週三晚上見",
      hashtags: ["#淡江大學禪學社", "#淡江", "#慢下來"],
    },
    variants: [],
    imagePrompt: "",
    visualDirection: "宿舍窗邊的一盞燈，9:16",
    carousel: [],
    storyFrames: [],
    reels: [
      { from: 0, to: 3, visual: "筆電螢幕，游標停在空白頁。", caption: "先給自己五分鐘", voiceover: "", transition: "硬切", assetHint: "宿舍桌面", assetId: null },
      { from: 3, to: 7, visual: "走廊很吵，門關上。", caption: "外面很熱鬧", voiceover: "", transition: "慢推", assetHint: "宿舍走廊", assetId: null },
      { from: 7, to: 12, visual: "三色光底，一行字。", caption: "坐著就好", voiceover: "不用會什麼。", transition: "疊化", assetHint: "三色光", assetId: SEED_GLOW_ID },
      { from: 12, to: 17, visual: "茶杯特寫。", caption: "週三晚上 B302", voiceover: "", transition: "跟拍", assetHint: "茶杯", assetId: null },
      { from: 17, to: 20, visual: "龜龜在角落。", caption: "一個人來也可以", voiceover: "週三晚上見", transition: "定格", assetHint: "龜龜", assetId: SEED_MASCOT_ID },
    ],
    threads: "",
    line: "",
    review: null,
    sources: [{ kind: "instagram", label: "Instagram / 2026-09-05" }],
    projectId: null,
    coverAssetId: SEED_GLOW_ID,
    scheduledAt: Date.parse("2026-09-05T21:00:00+08:00"),
    publishedAt: Date.parse("2026-09-05T21:04:00+08:00"),
    metrics: { reach: 980, likes: 76, comments: 9, saves: 48, shares: 22, views: 4120, clicks: 8, syncedAt: SEED_TIME },
    createdAt: Date.parse("2026-09-05T18:00:00+08:00"),
    updatedAt: Date.parse("2026-09-05T21:04:00+08:00"),
    generatedBy: "live",
  },
];

export const SEED_PROJECT = createSeedProject();
