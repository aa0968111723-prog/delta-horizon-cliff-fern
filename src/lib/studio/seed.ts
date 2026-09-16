import { emptyBoilerplate } from "./boilerplate";
import { migrateBrief, migratePlan, migratePlanVersions } from "./brief";
import { buildLayout } from "./layout";
import type { AssetMeta, BrandKit, Layer, Project } from "./types";

export const SEED_BRAND_ID = "brand_tkuzen";
export const SEED_PROJECT_ID = "proj_floating_light";
export const SEED_DRAFT_ID = "proj_welcome_tea";
export const SEED_LOGO_ID = "asset_club_mark";
export const SEED_CUP_ID = "asset_tea_night";
export const SEED_BEANS_ID = "asset_tamsui";
export const SEED_TURTLE_ID = "asset_turtle";
export const SEED_LIGHT_ID = "asset_trilight";
export const SEED_CAMPUS_ID = "asset_campus";

const SEED_TIME = Date.parse("2026-09-10T20:00:00+08:00");

export const SEED_ASSETS: AssetMeta[] = [
  {
    id: SEED_LOGO_ID,
    name: "禪學社標誌",
    kind: "logo",
    category: "logo",
    mime: "image/svg+xml",
    width: 80,
    height: 80,
    tags: ["logo", "品牌", "龜龜", "三色光"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/club-mark.svg",
    source: "seed",
    licenseNotes: "淡江大學禪學社自有標誌。",
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
    width: 1080,
    height: 1350,
    tags: ["龜龜", "吉祥物", "角色"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/turtle.svg",
    source: "seed",
    licenseNotes: "社團角色，可作主視覺或貼圖。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 1,
  },
  {
    id: SEED_CUP_ID,
    name: "夜晚茶會",
    kind: "image",
    category: "photo",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["茶會", "晚上", "同學互動"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/tea-night.svg",
    source: "seed",
    licenseNotes: "風格參考，可換成現場照片。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 2,
  },
  {
    id: SEED_BEANS_ID,
    name: "淡水黃昏",
    kind: "image",
    category: "tamsui",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["淡水", "黃昏", "河岸"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/tamsui.svg",
    source: "seed",
    licenseNotes: "淡水生活感背景。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: Date.parse("2026-09-12T10:00:00+08:00"),
    useCount: 1,
  },
  {
    id: SEED_LIGHT_ID,
    name: "三色光",
    kind: "image",
    category: "poster",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["三色光", "浮游禪光", "夜晚", "主視覺"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/trilight.svg",
    source: "seed",
    licenseNotes: "浮游禪光燈光記憶。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 1,
  },
  {
    id: SEED_CAMPUS_ID,
    name: "淡江校園",
    kind: "image",
    category: "campus",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["校園", "淡江", "斜坡"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/campus.svg",
    source: "seed",
    licenseNotes: "校園生活場景。",
    licenseOwner: "淡江大學禪學社",
    favorite: false,
    lastUsedAt: null,
    useCount: 0,
  },
];

export const SEED_BRAND: BrandKit = {
  id: SEED_BRAND_ID,
  name: "淡江大學禪學社",
  handle: "@tkuzen",
  website: "",
  voice: "像社團的人在發 IG。先生活，再活動。禪要說成安定、專注、喘口氣，不要一開始就宗教或說教。",
  doSay: "淡江學生、淡水晚上、坐好、找朋友來、時間地點、坐一下就好",
  dontSay: "誠摯邀請、宗教、玄學、開示、功德、限時瘋搶",
  forbiddenWords: ["誠摯邀請", "玄學", "開示", "功德", "錯過就沒有"],
  colors: [
    { id: "c1", hex: "#3F6F64", role: "primary", label: "苔綠" },
    { id: "c2", hex: "#5B6E8A", role: "secondary", label: "暮藍" },
    { id: "c3", hex: "#F4F1EA", role: "background", label: "沙色" },
    { id: "c4", hex: "#E8A060", role: "accent", label: "暖光" },
    { id: "c5", hex: "#1C2422", role: "ink", label: "墨" },
  ],
  fontDisplay: "Noto Serif TC",
  fontBody: "Noto Sans TC",
  logoAssetId: SEED_LOGO_ID,
  logos: [
    { id: "logo_zen_primary", name: "主標誌", assetId: SEED_LOGO_ID, usage: "primary" },
    { id: "logo_zen_mark", name: "圖標", assetId: SEED_LOGO_ID, usage: "mark" },
  ],
  slogans: ["坐一下就好。", "先被看見，再看到活動。"],
  ctas: ["晚上見", "找一個朋友來", "坐一下就好"],
  imageStyle: {
    mood: "空氣感、夜色、朋友、療癒，不要廟",
    lighting: "淡水黃昏、三色光、室內暖燈，避免硬閃與塑料感",
    paletteHint: "苔綠、沙色、暖光、暮藍、水色",
    composition: "留白給第一句 Hook，活動名不要壓過生活感",
    do: "同學側臉、茶、燈、龜龜、河岸、校園斜坡",
    dont: "香爐、金身、過宗教、過老氣、過 AI、滿版標語",
  },
  rules: {
    noCompetitorMarks: true,
    noWatermark: true,
    noLowRes: true,
    notes: "Logo 不壓臉。活動海報不要看起來像寺廟廣告。",
  },
  boilerplate: {
    ...emptyBoilerplate(),
    cta: "晚上見",
    disclaimer: "",
    hashtags: ["#淡江禪學社", "#淡江", "#淡水"],
    captionClose: "時間地點看報名。找一個朋友一起來也行。",
  },
  mascot: "龜龜",
  signatureLights: "三色光",
  likes: ["生活 Hook", "夜色", "留白", "同學真實感", "龜龜"],
  dislikes: ["誠摯邀請", "說教", "佛學名詞開場", "連續招生"],
  clubIntro: "淡江大學禪學社在淡水校園。給學生一個可以慢下來、整理自己的地方。不是要把禪變成宗教廣告。",
  updatedAt: SEED_TIME,
};

const copy = {
  eyebrow: "09 / 24",
  headline: "最近是不是\n很久沒坐好",
  subhead: "浮游禪光 · 淡水校園",
  body: "開學以後行程一直被填滿。這晚我們把燈放下來，坐一會兒就好。",
  cta: "晚上見",
  handle: "@tkuzen",
  caption:
    "最近是不是很久沒有好好坐下來？\n\n不是要你突然變得很懂禪。\n只是開學以後，行程一直被填滿，連休息都會有一點罪惡感。\n\n9/24 晚上，浮游禪光。\n淡水校園，把燈放下來，坐一會兒就好。\n時間地點看報名連結，找一個朋友一起過來也行。",
  hashtags: ["#淡江禪學社", "#浮游禪光", "#淡江", "#淡水", "#開學"],
  altText: "夜色裡三色光輕輕浮著，標題寫著最近是不是很久沒坐好。",
};

function stabilize(layers: Layer[], prefix: string): Layer[] {
  return layers.map((layer, index) => ({
    ...layer,
    id: `${prefix}${index}`,
  }));
}

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
      eyebrow: "LIFE",
      headline: "連休息都\n有罪惡感？",
      subhead: "淡江學生的九月",
      body: "課表、迎新、捷運、報告。自由，但不一定比較快樂。",
      cta: "坐一下就好",
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
      headline: "把燈\n放下來",
      subhead: "浮游禪光",
      body: "不是講座。是一個晚上，燈、風、可以坐著的地方。",
      cta: "晚上見",
    },
    SEED_BRAND,
    "editorial",
    { imageAssetId: SEED_LIGHT_ID },
  );
  page3.layers = stabilize(page3.layers, "seed_p3_ly_");
  page3.role = "detail";
  page3.templateId = "editorial";

  const page4 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "HERE",
      headline: "淡水校園\n走幾步就到",
      subhead: "9/24 晚上",
      body: "通勤的人可以算一下末班車。住宿的人，下山再回宿舍也行。",
      cta: "看時間地點",
    },
    SEED_BRAND,
    "product",
    { imageAssetId: SEED_CAMPUS_ID },
  );
  page4.layers = stabilize(page4.layers, "seed_p4_ly_");
  page4.role = "proof";
  page4.templateId = "product";

  const page5 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "NOW",
      headline: "晚上見",
      subhead: "9/24 · 淡江大學淡水校園",
      body: "報名在簡介。找一個朋友一起來也行。",
      cta: "晚上見",
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
      headline: "坐一下\n就好。",
      subhead: "淡江禪學社",
      body: "不用先懂禪。",
      cta: "晚上見",
    },
    SEED_BRAND,
    "quote",
  );
  page6.layers = stabilize(page6.layers, "seed_p6_ly_");
  page6.role = "close";
  page6.templateId = "quote";

  const slides = [page1, page2, page3, page4, page5, page6];

  const brief = migrateBrief({
    product: "浮游禪光夜燈體驗",
    eventName: "浮游禪光",
    schedule: "2026/09/24 晚上",
    location: "淡江大學淡水校園",
    offer: "找一個朋友一起來",
    audience: "淡江大學學生，尤其剛開學、覺得自己很滿的人",
    goal: "traffic",
    features: "夜燈、坐下來、三色光、不用先懂禪",
    style: "生活、空氣、淡水夜晚",
    notes: "Hook 先行。不要宗教開場。",
    deliverables: { post: true, story: true, carousel: true, reels: true, threads: true, line: true },
  });

  const plan = migratePlan({
    campaignName: "浮游禪光",
    concept: "先讓學生覺得『我最近是不是很久沒坐好』，再告訴他們 9/24 晚上校園裡有燈。",
    insight: "開學季的淡江學生不是缺少活動，是缺少一個不必表演的晚上。",
    hook: "最近是不是很久沒有好好坐下來？",
    visualTheme: "夜色、三色光、留白、空氣感。",
    visualDirection: "深色底、光點、大字 Hook，活動名放第二層。",
    templateId: "quote",
    colorMood: "暮藍、暖光、水色",
    eyebrow: copy.eyebrow,
    headline: copy.headline,
    subhead: copy.subhead,
    body: copy.body,
    cta: copy.cta,
    captions: [
      { style: "學生版", text: copy.caption },
      { style: "短版", text: "最近是不是很久沒坐好？\n9/24 晚上，浮游禪光。坐一下就好。" },
    ],
    hashtags: copy.hashtags,
    storyBeats: ["很久沒坐好", "燈會自己亮", "9/24 淡水校園"],
    carouselPages: [
      {
        role: "cover",
        headline: copy.headline,
        subhead: "浮游禪光",
        body: copy.caption.split("\n")[0],
        cta: "晚上見",
        visualNote: "大字 Hook，光在背景。",
        templateId: "quote",
      },
      {
        role: "problem",
        headline: "連休息都\n有罪惡感？",
        subhead: "淡江的九月",
        body: "課表一直被填滿。",
        cta: "坐一下就好",
        visualNote: "生活，不要廟。",
        templateId: "quote",
      },
      {
        role: "detail",
        headline: "把燈\n放下來",
        subhead: "不是講座",
        body: "燈、風、可以坐著。",
        cta: "晚上見",
        visualNote: "三色光特寫。",
        templateId: "editorial",
      },
      {
        role: "proof",
        headline: "走幾步\n就到",
        subhead: "淡水校園",
        body: "通勤的人可以算末班車。",
        cta: "看時間地點",
        visualNote: "校園路徑。",
        templateId: "product",
      },
      {
        role: "cta",
        headline: "晚上見",
        subhead: "9/24 · 淡江大學淡水校園",
        body: "報名在簡介。",
        cta: "晚上見",
        visualNote: "只留資訊。",
        templateId: "offer",
      },
      {
        role: "close",
        headline: "坐一下\n就好。",
        subhead: "淡江禪學社",
        body: "不用先懂禪。",
        cta: "晚上見",
        visualNote: "可截圖。",
        templateId: "quote",
      },
    ],
    assetNeeds: [
      { kind: "photo", title: "夜燈現場", detail: "三色光、人的側影。", required: true },
      { kind: "logo", title: "社徽", detail: "淺底或小標。", required: true },
      { kind: "illustration", title: "龜龜", detail: "可作第二則或貼圖。", required: false },
    ],
    checklist: ["Hook 在第一句", "9/24 與地點有出現", "沒有誠摯邀請", "不太宗教", "CTA 可讀"],
    altText: copy.altText,
    qaNotes: ["不要用寺廟視覺", "活動名不要壓過第一句"],
    generatedAt: now,
    source: "live",
    threadsPost: "最近是不是很久沒有好好坐下來？\n\n9/24 晚上浮游禪光，淡水校園。不用先懂禪。",
    lineCopy: "【浮游禪光】9/24 晚上 淡江淡水校園\n最近很滿的話，來坐一下。",
    studentReview: {
      wouldStop: "第一句會停。像在講我。",
      understandable: "看得懂。不是術語。",
      tooReligious: "沒有。燈跟坐好而已。",
      tooSerious: "還好，偏安靜但不說教。",
      tooLiterary: "有一點文，但能接受。",
      tooAi: "沒有金句連發。",
      tooLong: "Carousel 可以，單張 Caption 剛好。",
      knowsWhat: "知道是晚上的燈、坐下來。",
      knowsWhenWhere: "9/24、淡水校園有寫。",
      wouldBringFriend: "可以。門檻低。",
      knowsSignup: "寫了報名在簡介，最好再放連結。",
      notes: ["報名方式再清楚一點。"],
      rewriteHook: "",
    },
  });

  return {
    id: SEED_PROJECT_ID,
    name: "浮游禪光 · Carousel",
    createdAt: now,
    updatedAt: now,
    brandId: SEED_BRAND_ID,
    templateId: "quote",
    activeFormatId: "feed-portrait",
    status: "done",
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
    campaignId: "camp_floating_light",
    contentKind: "carousel",
    scheduledAt: Date.parse("2026-09-17T20:00:00+08:00"),
    publishedAt: null,
  };
}

export function createSeedDraft(): Project {
  const now = Date.parse("2026-09-12T10:00:00+08:00");
  const draftCopy = {
    eyebrow: "TEA",
    headline: "開學茶會",
    subhead: "來坐一下，不用先懂禪。",
    body: "",
    cta: "找一個朋友來",
    handle: "@tkuzen",
    caption: "",
    hashtags: ["#淡江禪學社"],
    altText: "",
  };
  const artboard = buildLayout("story", draftCopy, SEED_BRAND, "offer", {
    imageAssetId: SEED_CUP_ID,
  });
  artboard.layers = artboard.layers.map((layer, index) => ({
    ...layer,
    id: `seed_draft_ly_${index}`,
  }));
  return {
    id: SEED_DRAFT_ID,
    name: "開學茶會 · Story",
    createdAt: now,
    updatedAt: now,
    brandId: SEED_BRAND_ID,
    templateId: "offer",
    activeFormatId: "story",
    status: "creating",
    brief: migrateBrief({
      product: "開學茶會",
      eventName: "開學茶會",
      schedule: "開學後第一個晚上",
      location: "淡江大學淡水校園",
      offer: "找一個朋友來",
      audience: "大一新生與想認識人的舊生",
      goal: "ugc",
      features: "茶、坐下來、認識人",
      style: "輕、生活",
      notes: "草稿，標題層級未定。",
      deliverables: { post: false, story: true, carousel: false, reels: false, threads: false, line: true },
    }),
    copy: draftCopy,
    plan: null,
    artboards: { story: artboard },
    slides: { story: [artboard] },
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

export const SEED_PROJECT = createSeedProject();
