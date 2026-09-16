import {
  CLUB_CTAS,
  CLUB_DONT_SAY,
  CLUB_DO_SAY,
  CLUB_HANDLE,
  CLUB_HASHTAGS,
  CLUB_INTRO_SHORT,
  CLUB_NAME,
  CLUB_PALETTE,
  CLUB_SLOGANS,
  CLUB_VOICE,
  MASCOT,
  VISUAL_ANCHORS,
} from "@/lib/zen/club";
import { clubBrandMemory } from "./brand";
import { emptyBoilerplate } from "./boilerplate";
import { defaultWavePlan, migrateCampaign } from "./campaign";
import { migrateBrief, migratePlan, migratePlanVersions } from "./brief";
import { kindFromFormat } from "./content";
import { buildLayout } from "./layout";
import { DEFAULT_SHADOW } from "./layers";
import type { AssetMeta, BrandKit, Layer, LineLayer, Project } from "./types";

export {
  SEED_BEANS_ID,
  SEED_BRAND_ID,
  SEED_CAMPUS_ID,
  SEED_CUP_ID,
  SEED_DRAFT_ID,
  SEED_LIGHT_ID,
  SEED_LOGO_ID,
  SEED_PROJECT_ID,
  SEED_TAMSUI_ID,
  SEED_TEA_ID,
  SEED_TURTLE_ID,
} from "./seed-ids";
import {
  SEED_BRAND_ID,
  SEED_CAMPUS_ID,
  SEED_DRAFT_ID,
  SEED_LIGHT_ID,
  SEED_LOGO_ID,
  SEED_PROJECT_ID,
  SEED_TAMSUI_ID,
  SEED_TEA_ID,
  SEED_TURTLE_ID,
} from "./seed-ids";

const SEED_TIME = Date.parse("2026-09-10T20:00:00+08:00");

export const SEED_ASSETS: AssetMeta[] = [
  seedAsset({
    id: SEED_LOGO_ID,
    name: "禪光標誌",
    kind: "logo",
    category: "logo",
    mime: "image/svg+xml",
    width: 512,
    height: 512,
    tags: ["logo", "品牌", "三色光"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/nisshoku-mark.svg",
    source: "seed",
    licenseNotes: "社團標誌，僅限淡江禪學社網宣。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 3,
  },
  {
    id: SEED_TURTLE_ID,
    name: "龜龜",
    kind: "image",
    category: "turtle",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["龜龜", "角色", "吉祥物"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/turtle.svg",
    source: "seed",
    licenseNotes: "社團角色，可作主視覺或貼圖。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 4,
  },
  {
    id: SEED_LIGHT_ID,
    name: "三色光",
    kind: "image",
    category: "illustration",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["三色光", "夜晚", "主視覺"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/tri-light.svg",
    source: "seed",
    licenseNotes: "品牌光感，適合夜間活動。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: Date.parse("2026-09-12T21:00:00+08:00"),
    useCount: 2,
  },
  {
    id: SEED_TEA_ID,
    name: "夜間茶會",
    kind: "image",
    category: "photo",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["茶會", "杯子", "互動"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/tea-circle.svg",
    source: "seed",
    licenseNotes: "歷屆茶會氣氛參考。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 2,
    attribution: "社團自有標誌",
    analysisNotes: "",
  },
  {
    id: SEED_CAMPUS_ID,
    name: "校園小路",
    kind: "image",
    category: "campus",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["淡江", "校園", "走路"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/campus-path.svg",
    source: "seed",
    licenseNotes: "校園生活感背景。",
    licenseOwner: "淡江大學禪學社",
    favorite: false,
    lastUsedAt: null,
    useCount: 0,
  },
  {
    id: SEED_TAMSUI_ID,
    name: "淡水黃昏",
    kind: "image",
    category: "tamsui",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["淡水", "河岸", "黃昏"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/tamsui-dusk.svg",
    source: "seed",
    licenseNotes: "淡水生活背景。",
    licenseOwner: "淡江大學禪學社",
    favorite: false,
    lastUsedAt: Date.parse("2026-09-08T18:00:00+08:00"),
    useCount: 1,
  },
];

export const SEED_BRAND: BrandKit = {
  id: SEED_BRAND_ID,
  name: "淡江大學禪學社",
  handle: "@tkuzen",
  website: "",
  voice:
    "像一個淡江學生在限動裡講話：自然、短、有溫度。先談生活，再談活動。禪是安定、專注、慢下來，不是宗教廣告。",
  doSay: "淡江、淡水、宿舍、捷運、課表、坐下來、喘口氣、找朋友、認識自己",
  dontSay: "誠摯邀請、修行、開示、法會、年輕人、Z世代、錯過就沒有",
  forbiddenWords: ["誠摯邀請", "修行", "開示", "法會", "年輕人", "Z世代", "錯過就沒有"],
  colors: [
    { id: "c1", hex: "#1C1A16", role: "primary", label: "墨" },
    { id: "c2", hex: "#5C6B66", role: "secondary", label: "苔" },
    { id: "c3", hex: "#F3EEE4", role: "background", label: "霧亞麻" },
    { id: "c4", hex: "#2A6A64", role: "accent", label: "淡水" },
    { id: "c5", hex: "#1C1A16", role: "ink", label: "文字" },
  ],
  fontDisplay: "Noto Sans TC",
  fontBody: "Noto Sans TC",
  logoAssetId: SEED_LOGO_ID,
  logos: [
    { id: "logo_tkzen_primary", name: "主標誌", assetId: SEED_LOGO_ID, usage: "primary" },
    { id: "logo_tkzen_mark", name: "圖標", assetId: SEED_LOGO_ID, usage: "mark" },
  ],
  slogans: ["先坐下來。", "不用先懂禪。"],
  ctas: ["晚上來坐一下", "帶一個朋友來就好", "報名連結在這"],
  imageStyle: {
    mood: "空氣感、夜間暖光、朋友坐在一起",
    lighting: "淡水黃昏、室內柔光、三色光，避免硬閃與寺廟濾鏡",
    paletteHint: "霧亞麻、淡水綠、琥珀、蓮粉作為光，不要一片金黃佛光",
    composition: "人物或光在上半，下半留白給 Hook；龜龜可當配角",
    do: "茶會、河岸、宿舍窗、同學側臉、手、杯子、龜龜、三色光",
    dont: "香爐特寫、嚴肅法相、過度詩意空鏡、網紅擺拍、密密麻麻經文",
  },
  rules: {
    noCompetitorMarks: true,
    noWatermark: true,
    noLowRes: true,
    notes: "不要一開始就宗教視覺。Logo 不壓臉。時間地點要讀得到。",
  },
  boilerplate: {
    ...emptyBoilerplate(),
    cta: "晚上來坐一下",
    disclaimer: "",
    hashtags: ["#淡江禪學社", "#淡江大學", "#淡水"],
    captionClose: "想一起來的話，留言或點連結就好。",
  },
  mascot: "龜龜",
  motifs: ["龜龜", "三色光", "淡水夜晚", "坐下來", "茶"],
  likes: ["生活感", "留白", "學生語氣", "夜晚暖光"],
  dislikes: ["說教", "華麗佛學詞", "企業活動海報", "過度詩意"],
  audienceNotes:
    "只寫淡江學生：大一新生、住宿與通勤、剛到淡水的人、想交朋友或暫時喘口氣的人。他們多半對禪不熟。",
  updatedAt: SEED_TIME,
};

/* ------------------------------------------------------------------ */
/* 示範活動：浮游禪光                                                     */
/* ------------------------------------------------------------------ */

const copy = {
  eyebrow: "09 / 24",
  headline: "最近是不是\n很久沒坐好",
  subhead: "浮游禪光 · 一個不用表演的晚上",
  body: "9/24 晚上，淡江校園。帶一個朋友來就好，不用先懂禪。",
  cta: "晚上來坐一下",
  handle: "@tkuzen",
  caption:
    "最近是不是很久沒有好好坐下來？\n\n開學以後課表、捷運、宿舍訊息一直來。\n浮游禪光只是一個晚上，讓你可以暫時不用趕路。\n\n9/24（三）19:30\n淡江大學 覺生紀念圖書館前\n想來的話帶一個朋友就好。",
  hashtags: ["#淡江禪學社", "#浮游禪光", "#淡江大學", "#淡水", "#慢下來"],
  altText: "夜間三色光下的茶會氣氛，標題寫著最近是不是很久沒坐好。",
};

function stabilize(layers: Layer[], prefix: string): Layer[] {
  return layers.map((layer, index) => ({ ...layer, id: `${prefix}${index}` }));
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
  const page1 = buildLayout("feed-portrait", copy, SEED_BRAND, "product", {
    imageAssetId: SEED_LIGHT_ID,
  });
  page1.layers = stabilize(page1.layers, "seed_ly_");
  page1.role = "cover";
  page1.templateId = "quote";

  const page2 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "OPENING WEEK",
      headline: "課表有了\n人還在趕路",
      subhead: "剛到淡水的人，多半還沒找到自己的晚上。",
      body: "不是你不夠努力，是這週真的太滿。",
      cta: "晚上來坐一下",
    },
    SEED_BRAND,
    "quote",
    { imageAssetId: SEED_NIGHT_ID },
  );
  page2.layers = stabilize(page2.layers, "seed_p2_ly_");
  page2.role = "problem";
  page2.templateId = "quote";

  const page3 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "WHAT IT IS",
      headline: "燈光\n熱茶\n坐著就好",
      subhead: "不用分享心事，也不用會打坐。",
      body: "一個晚上，讓呼吸跟上自己。",
      cta: "帶一個朋友",
    },
    SEED_BRAND,
    "editorial",
    { imageAssetId: SEED_TEA_ID },
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
    stroke: "#2A6A64",
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
      eyebrow: "CAMPUS",
      headline: "就在學校\n不用遠征",
      subhead: "覺生紀念圖書館前",
      body: "下了課走過去就好。通勤的人，這班捷運趕得上。",
      cta: "看時間地點",
    },
    SEED_BRAND,
    "product",
    { imageAssetId: SEED_CAMPUS_ID },
  );
  page4.layers = stabilize(page4.layers, "seed_p4_ly_");
  page4.role = "proof";
  page4.templateId = "quote";

  const page5 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "9 / 24",
      headline: "晚上來\n坐一下",
      subhead: "19:30 · 圖書館前",
      body: "報名連結在自我介紹，現場也歡迎直接來。",
      cta: "報名連結在這",
    },
    SEED_BRAND,
    "offer",
  );
  page4.layers = stabilize(page4.layers, "seed_p4_ly_");
  page4.role = "cta";
  page4.templateId = "offer";

  const page6 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "NOTE",
      headline: "不用先懂禪。",
      subhead: "淡江大學禪學社",
      body: "想一起來的話，留言或點連結就好。",
      cta: "晚上來坐一下",
    },
    SEED_BRAND,
    "quote",
  );
  page6.layers = stabilize(page6.layers, "seed_p6_ly_");
  page6.role = "close";
  page6.templateId = "quote";

  const slides = [page1, page2, page3, page4, page5, page6];

  const brief = migrateBrief({
    product: "浮游禪光夜間靜心",
    eventName: "浮游禪光",
    schedule: "2026/09/24 19:30",
    location: "淡江大學 覺生紀念圖書館前",
    offer: "現場可直接來，也可先報名",
    audience: "淡江大一新生、住宿生、通勤生、想找一個不用熱場的晚上的人",
    goal: "traffic",
    features: "燈光、熱茶、坐著、不用分享、不用先懂禪",
    style: "生活感、夜間、朋友",
    notes: "開學適應期。不要宗教語氣。Hook 先打中坐不下來的感覺。",
    deliverables: { post: true, story: true, carousel: true, reels: true },
  });

  const plan = migratePlan({
    campaignName: "浮游禪光",
    concept: "用「很久沒坐好」當入口，讓開學中的淡江學生覺得這晚上跟自己有關。",
    insight: "大一剛到淡水、舊生課表爆掉，要的不是開示，是一個可以停的晚上。",
    hook: "最近是不是很久沒有好好坐下來？",
    visualTheme: "夜間三色光、霧亞麻、淡水綠，人物或光在上半。",
    visualDirection: "深色夜空上三色光重疊，下半留白放 Hook。龜龜可當小配角。",
    templateId: "product",
    colorMood: "夜、琥珀、淡水、蓮",
    eyebrow: copy.eyebrow,
    headline: copy.headline,
    subhead: "開學第三週 · 給自己留一個放空的晚上",
    body: copy.body,
    cta: copy.cta,
    captions: [
      { style: "學生版", text: copy.caption },
      { style: "短版", text: "最近是不是很久沒坐好。\n9/24 晚上，圖書館前。帶一個朋友來就好。" },
    ],
    hashtags: copy.hashtags,
    storyBeats: ["捷運上滑完手機更累", "燈光與杯子", "時間地點＋來坐一下"],
    carouselPages: [
      {
        role: "cover",
        headline: copy.headline,
        subhead: copy.subhead,
        body: copy.body,
        cta: copy.cta,
        visualNote: "三色光滿版，標題兩行。",
        templateId: "product",
      },
      {
        role: "problem",
        headline: "課表有了\n人還在趕路",
        subhead: "剛到淡水的人，多半還沒找到自己的晚上。",
        body: "不是你不夠努力，是這週真的太滿。",
        cta: copy.cta,
        visualNote: "痛點頁只留生活，不要說教。",
        templateId: "quote",
      },
      {
        role: "detail",
        headline: "燈光 熱茶\n坐著就好",
        subhead: "不用分享心事，也不用會打坐。",
        body: "一個晚上，讓呼吸跟上自己。",
        cta: "帶一個朋友",
        visualNote: "茶會杯子與手。",
        templateId: "editorial",
      },
      {
        role: "proof",
        headline: "就在學校",
        subhead: "覺生紀念圖書館前",
        body: "下了課走過去就好。",
        cta: "看時間地點",
        visualNote: "校園小路。",
        templateId: "product",
      },
      {
        role: "cta",
        headline: "晚上來坐一下",
        subhead: "9/24 19:30 · 圖書館前",
        body: "報名連結在自我介紹。",
        cta: "報名連結在這",
        visualNote: "只留時間地點 CTA。",
        templateId: "offer",
      },
      {
        role: "close",
        headline: "不用先懂禪。",
        subhead: "淡江大學禪學社",
        body: "想一起來的話，留言或點連結就好。",
        cta: copy.cta,
        visualNote: "一句話收束。",
        templateId: "quote",
      },
    ],
    assetNeeds: [
      { kind: "photo", title: "夜間光感", detail: "三色光或現場燈光。", required: true },
      { kind: "logo", title: "禪學社標誌", detail: "淺底或透明。", required: true },
      { kind: "people", title: "同學側影", detail: "不要擺拍網紅姿勢。", required: false },
    ],
    checklist: ["Hook 不是誠摯邀請", "時間地點出現", "不太宗教", "CTA 可讀", "Logo 沒壓臉"],
    altText: copy.altText,
    qaNotes: ["避免寺廟濾鏡", "第一句必須是生活"],
    generatedAt: now,
    source: "live",
    threadsPost: "開學以後是不是連坐著都覺得在浪費時間。\n9/24 晚上圖書館前，來坐一下就好。不用先懂禪。",
    lineCopy: "【浮游禪光】9/24 19:30 圖書館前\n最近很久沒坐好的話，來就好。",
    sources: [
      { source: "instagram", label: "Instagram / 2025-09 茶會" },
      { source: "drive", label: "Google Drive / 歷屆夜間活動" },
      { source: "brand", label: "Brand / 三色光・龜龜" },
    ],
  });

  return {
    id: SEED_PROJECT_ID,
    name: "浮游禪光 · 主視覺 Carousel",
    createdAt: now,
    updatedAt: now,
    brandId: SEED_BRAND_ID,
    templateId: "quote",
    activeFormatId: "feed-portrait",
    status: "done",
    contentKind: "carousel",
    campaignId: "camp_float_light",
    scheduledAt: Date.parse("2026-09-17T19:00:00+08:00"),
    publishedAt: null,
    sourceRefs: plan?.sources ?? [],
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
        name: "初稿 · 五頁輪播",
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
    campaignId: "camp_floating_light",
    contentKind: "carousel",
    scheduledAt: Date.parse("2026-09-17T20:00:00+08:00"),
    publishedAt: null,
  };
}

export function createSeedDraft(): Project {
  const now = Date.parse("2026-09-14T11:00:00+08:00");
  const draftCopy = {
    eyebrow: "TEA NIGHT",
    headline: "下週茶會",
    subhead: "還在想 Hook。",
    body: "",
    cta: "晚上來坐一下",
    handle: "@tkuzen",
    caption: "",
    hashtags: ["#淡江禪學社", "#淡江"],
    altText: "",
  };
  const artboard = buildLayout("story", draftCopy, SEED_BRAND, "offer", {
    imageAssetId: SEED_TEA_ID,
  });
  artboard.layers = artboard.layers.map((layer, index) => ({
    ...layer,
    id: `seed_draft_ly_${index}`,
  }));
  return {
    id: SEED_DRAFT_ID,
    name: "下週茶會 · 還在想",
    createdAt: now,
    updatedAt: now,
    brandId: SEED_BRAND_ID,
    templateId: "quote",
    activeFormatId: "story",
    status: "idea",
    contentKind: "story",
    campaignId: null,
    scheduledAt: null,
    publishedAt: null,
    sourceRefs: [],
    brief: migrateBrief({
      product: "小型茶會",
      eventName: "下週茶會",
      schedule: "下週晚上",
      location: "淡江校園",
      offer: "現場來坐",
      audience: "課業壓力大、想交朋友但不想熱場的淡江學生",
      goal: "awareness",
      features: "茶、聊天、不強制分享",
      style: "生活、口語",
      notes: "從一句想法開始。",
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
    campaignId: "camp_welcome_tea",
    contentKind: "story",
    scheduledAt: null,
    publishedAt: null,
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
    imageAssetId: SEED_LIGHT_ID,
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
    imageAssetId: SEED_TAMSUI_ID,
  },
];

export const SEED_REMOTE_FILES: RemoteFile[] = [
  {
    id: "drv_tea_2025",
    provider: "drive",
    name: "2025 茶會現場",
    mime: "image/jpeg",
    thumbnail: "/seed/tamsui.svg",
    url: "/seed/tamsui.svg",
    tags: ["茶會", "晚上", "同學", "互動"],
    summary: "歷屆晚上茶會，很多人圍坐。連接 Drive 後會換成真實檔案。",
  },
  {
    id: "drv_plan_light",
    provider: "drive",
    name: "浮游禪光企劃",
    mime: "application/pdf",
    thumbnail: "/seed/trilight.svg",
    url: "/seed/trilight.svg",
    tags: ["浮游禪光", "企劃", "燈"],
    summary: "活動流程與燈的配置。",
  },
  {
    id: "canva_tea",
    provider: "canva",
    name: "茶會 IG 主視覺",
    mime: "application/canva",
    thumbnail: "/seed/trilight.svg",
    url: "/seed/trilight.svg",
    tags: ["茶會", "Canva", "主視覺"],
    summary: "歷屆茶會版型，三色光。延續 DNA，不要直接複製。",
  },
  {
    id: "canva_recruit",
    provider: "canva",
    name: "招新版型",
    mime: "application/canva",
    thumbnail: "/seed/campus.svg",
    url: "/seed/campus.svg",
    tags: ["招生", "template"],
    summary: "招生活動版型。每年換學生情境，不要整張沿用。",
  },
];

export function migrateRemoteFile(file: RemoteFile): RemoteFile {
  if (file.thumbnail) return file;
  const seed = SEED_REMOTE_FILES.find((row) => row.id === file.id);
  if (!seed?.thumbnail) return file;
  return { ...file, thumbnail: seed.thumbnail, url: file.url || seed.url };
}

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
