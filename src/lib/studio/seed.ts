import { emptyBoilerplate } from "./boilerplate";
import { migrateBrief, migratePlan, migratePlanVersions } from "./brief";
import { buildLayout } from "./layout";
import { DEFAULT_SHADOW } from "./layers";
import type { AssetMeta, BrandKit, Layer, LineLayer, Project } from "./types";

export const SEED_BRAND_ID = "brand_nisshoku";
export const SEED_PROJECT_ID = "proj_yirgacheffe";
export const SEED_DRAFT_ID = "proj_weekend_pour";
export const SEED_LOGO_ID = "asset_nisshoku_logo";
export const SEED_CUP_ID = "asset_cup";
export const SEED_BEANS_ID = "asset_beans";

const SEED_TIME = Date.parse("2026-09-01T00:00:00+08:00");

export const SEED_ASSETS: AssetMeta[] = [
  seedAsset({
    id: SEED_LOGO_ID,
    name: "日食標誌",
    kind: "logo",
    category: "logo",
    mime: "image/svg+xml",
    width: 80,
    height: 80,
    tags: ["logo", "品牌", "圖標"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/nisshoku-mark.svg",
    source: "seed",
    licenseNotes: "品牌自有標誌，僅限日食咖啡網宣使用。",
    licenseOwner: "日食咖啡",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 2,
  },
  {
    id: SEED_CUP_ID,
    name: "手沖杯",
    kind: "image",
    category: "photo",
    mime: "image/jpeg",
    width: 1408,
    height: 1408,
    tags: ["商品", "咖啡", "活動"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/cup.jpg",
    source: "seed",
    licenseNotes: "店內拍攝，可商用。請保留杯緣完整，勿加浮水印。",
    licenseOwner: "日食咖啡",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 1,
  },
  {
    id: SEED_BEANS_ID,
    name: "烘焙豆",
    kind: "image",
    category: "background",
    mime: "image/jpeg",
    width: 1408,
    height: 1408,
    tags: ["素材", "咖啡", "背景"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/beans.jpg",
    source: "seed",
    licenseNotes: "店內拍攝，可作背景或商品圖。",
    licenseOwner: "日食咖啡",
    favorite: false,
    lastUsedAt: Date.parse("2026-09-03T10:00:00+08:00"),
    useCount: 1,
  },
];

export const SEED_BRAND: BrandKit = {
  id: SEED_BRAND_ID,
  name: "日食咖啡",
  handle: "@nisshoku.coffee",
  website: "nisshoku.coffee",
  voice: "沉靜、精準、不賣弄。像一位熟悉豆性的烘豆師在櫃檯輕聲說話。",
  doSay: "單品、產地、處理法、風味描述、手沖、當季",
  dontSay: "最便宜、爆款、網紅、限時瘋搶",
  forbiddenWords: ["便宜", "爆款", "錯過就沒有"],
  colors: [
    { id: "c1", hex: "#2C1810", role: "primary", label: "深焙" },
    { id: "c2", hex: "#3D4F3A", role: "secondary", label: "葉影" },
    { id: "c3", hex: "#F4E6D4", role: "background", label: "亞麻" },
    { id: "c4", hex: "#B85C38", role: "accent", label: "赤陶" },
    { id: "c5", hex: "#2C1810", role: "ink", label: "墨" },
  ],
  fontDisplay: "Noto Sans TC",
  fontBody: "Noto Sans TC",
  logoAssetId: SEED_LOGO_ID,
  logos: [
    {
      id: "logo_nisshoku_primary",
      name: "主標誌",
      assetId: SEED_LOGO_ID,
      usage: "primary",
    },
    {
      id: "logo_nisshoku_mark",
      name: "圖標",
      assetId: SEED_LOGO_ID,
      usage: "mark",
    },
  ],
  slogans: ["這個月只烘一個產地。", "喝完就換豆。"],
  ctas: ["查看風味", "到店手沖", "帶一包回家"],
  imageStyle: {
    mood: "沉靜、暖光、留白",
    lighting: "窗邊自然光或柔和側光，避免硬閃與過飽和濾鏡",
    paletteHint: "亞麻、深焙褐、赤陶點綴",
    composition: "商品置中或上半，下半留白給標題",
    do: "手沖、豆、器皿特寫、櫃上光線、手的局部",
    dont: "霓虹、過度濾鏡、擁擠桌面、網紅姿勢、浮水印",
  },
  rules: {
    noCompetitorMarks: true,
    noWatermark: true,
    noLowRes: true,
    notes: "Logo 不壓在杯緣；價格不進主畫面。",
  },
  boilerplate: {
    ...emptyBoilerplate(),
    cta: "查看風味",
    disclaimer: "風味因烘焙批次略有差異。",
    hashtags: ["#日食咖啡", "#單品咖啡"],
    captionClose: "歡迎到店手沖，或帶一包回家。",
  },
  updatedAt: SEED_TIME,
};

/* ------------------------------------------------------------------ */
/* 示範活動：浮游禪光                                                     */
/* ------------------------------------------------------------------ */

const copy = {
  eyebrow: "SEPTEMBER SINGLE ORIGIN",
  headline: "衣索比亞\n水洗耶加雪菲",
  subhead: "茉莉、佛手柑、蜂蜜尾韻。\n九月櫃上，限量烘焙。",
  body: "海拔 2,100 公尺的小農批次，水洗處理，淺中焙。建議手沖 92°C、1:16。",
  cta: "查看風味",
  handle: "@nisshoku.coffee",
  caption:
    "九月單品：衣索比亞水洗耶加雪菲。\n茉莉、佛手柑，尾段是乾淨的蜂蜜甜。\n櫃上只放一個批次，喝完就換豆。\n歡迎到店手沖，或帶一包回家。",
  hashtags: ["#日食咖啡", "#耶加雪菲", "#單品咖啡", "#手沖", "#台北咖啡"],
  altText: "亞麻色桌面上手沖咖啡杯，旁有日食咖啡九月單品文案。",
};

function stabilize(layers: Layer[], prefix: string): Layer[] {
  return layers.map((layer, index) => ({ ...layer, id: `${prefix}${index}` }));
}

export function createSeedProject(): Project {
  const now = SEED_TIME;
  const page1 = buildLayout("feed-portrait", copy, SEED_BRAND, "product", {
    imageAssetId: SEED_CUP_ID,
  });
  page1.layers = stabilize(page1.layers, "seed_ly_");
  page1.role = "cover";
  page1.templateId = "editorial";

  const page2 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "ISSUE",
      headline: "專程來一趟\n值不值得？",
      subhead: "受眾要的是可以相信的理由。",
      body: "不是更大聲的促銷，是這包豆值不值得出門。",
      cta: "查看風味",
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
      headline: "茉莉 · 佛手柑\n蜂蜜尾韻",
      subhead: "淺中焙 · 水洗處理 · G1",
      body: "建議手沖 92°C、1:16，悶蒸 30 秒。",
      cta: "到店手沖",
    },
    SEED_BRAND,
    "editorial",
    { imageAssetId: SEED_BEANS_ID },
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
    stroke: "#B85C38",
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
      eyebrow: "PROOF",
      headline: "九月櫃上\n只放一批",
      subhead: "日食咖啡門市",
      body: "喝完就換豆。來的人通常會再帶一包回家。",
      cta: "查看地點",
    },
    SEED_BRAND,
    "product",
    { imageAssetId: SEED_BEANS_ID },
  );
  page4.layers = stabilize(page4.layers, "seed_p4_ly_");
  page4.role = "proof";
  page4.templateId = "product";

  const page5 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "NOW",
      headline: "到店手沖",
      subhead: "2026年9月櫃上 · 日食咖啡門市",
      body: "來的時候帶這則貼文即可。",
      cta: "到店手沖",
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
      headline: "這個月\n只烘一個產地。",
      subhead: "日食咖啡",
      body: "歡迎到店手沖，或帶一包回家。",
      cta: "查看風味",
    },
    SEED_BRAND,
    "quote",
  );
  page6.layers = stabilize(page6.layers, "seed_p6_ly_");
  page6.role = "close";
  page6.templateId = "quote";

  const slides = [page1, page2, page3, page4, page5, page6];

  const brief = migrateBrief({
    product: "衣索比亞水洗耶加雪菲 淺中焙",
    eventName: "九月單品・耶加雪菲",
    schedule: "2026年9月櫃上",
    location: "日食咖啡門市",
    offer: "九月櫃上單品，限量烘焙",
    audience: "在意產地與風味的都市咖啡愛好者",
    goal: "awareness",
    features: "水洗處理、茉莉與佛手柑、蜂蜜尾韻",
    style: "沉靜、留白、不促銷",
    notes: "不要用促銷口氣，強調批次與風味。",
    deliverables: { post: true, story: false, carousel: true, reels: false },
  });

  const plan = migratePlan({
    campaignName: "九月單品上市",
    concept: "把「這個月只烘一個產地」當成主軸，讓人專程為一杯耶加雪菲來店。",
    insight: "受眾要的不是折扣，而是「這包豆值不值得專程來」。",
    hook: "這個月只烘一個產地。",
    visualTheme: "沉靜暖光、亞麻底、商品置中，赤陶作眉題。",
    visualDirection: "上半商品攝影、下半亞麻底與大標，赤陶作眉題色。",
    templateId: "product",
    colorMood: "亞麻、深焙、赤陶",
    eyebrow: copy.eyebrow,
    headline: copy.headline,
    subhead: "茉莉、佛手柑、蜂蜜尾韻。",
    body: copy.body,
    cta: copy.cta,
    captions: [
      { style: "敘事", text: copy.caption },
      { style: "短句", text: "茉莉、佛手柑、蜂蜜。九月，耶加雪菲。" },
    ],
    hashtags: copy.hashtags,
    storyBeats: ["產地特寫", "風味三詞", "到店手沖邀請"],
    carouselPages: [
      {
        role: "cover",
        headline: copy.headline,
        subhead: "九月櫃上，限量烘焙",
        body: "這個月只烘一個產地。",
        cta: "查看風味",
        visualNote: "杯緣完整，Logo 不壓主體。",
        templateId: "product",
      },
      {
        role: "problem",
        headline: "專程來一趟\n值不值得？",
        subhead: "受眾要的是可以相信的理由。",
        body: "不是更大聲的促銷，是這包豆值不值得出門。",
        cta: "查看風味",
        visualNote: "痛點頁只留一句猶豫。",
        templateId: "quote",
      },
      {
        role: "detail",
        headline: "茉莉 · 佛手柑\n蜂蜜尾韻",
        subhead: "淺中焙 · 水洗處理",
        body: "建議手沖 92°C、1:16。",
        cta: "到店手沖",
        visualNote: "豆面特寫或風味三詞。",
        templateId: "editorial",
      },
      {
        role: "proof",
        headline: "九月櫃上\n只放一批",
        subhead: "日食咖啡門市",
        body: "喝完就換豆。",
        cta: "查看地點",
        visualNote: "現場或物件證明值得出門。",
        templateId: "product",
      },
      {
        role: "cta",
        headline: "到店手沖",
        subhead: "2026年9月櫃上 · 門市",
        body: "來的時候帶這則貼文即可。",
        cta: "到店手沖",
        visualNote: "只留時間、地點、CTA。",
        templateId: "offer",
      },
      {
        role: "close",
        headline: "這個月\n只烘一個產地。",
        subhead: "日食咖啡",
        body: "歡迎到店手沖，或帶一包回家。",
        cta: "查看風味",
        visualNote: "結尾可截圖分享。",
        templateId: "quote",
      },
    ],
    assetNeeds: [
      { kind: "photo", title: "手沖杯主視覺", detail: "窗邊自然光，保留杯緣。", required: true },
      { kind: "logo", title: "日食標誌", detail: "淺底或透明版本。", required: true },
      { kind: "background", title: "烘焙豆", detail: "可作第二頁或背景。", required: false },
    ],
    checklist: [
      "標題兩行以內，落在安全區",
      "時間（九月）有出現",
      "CTA 可讀",
      "沒用禁用詞",
      "Logo 沒壓到杯緣",
    ],
    altText: copy.altText,
    qaNotes: ["避免把價格放上主畫面", "Logo 放右下，不要壓到杯緣"],
    generatedAt: now,
    source: "live",
  });

  return {
    id: SEED_PROJECT_ID,
    name: "九月單品・耶加雪菲",
    createdAt: now,
    updatedAt: now,
    brandId: SEED_BRAND_ID,
    templateId: "editorial",
    activeFormatId: "feed-portrait",
    status: "complete",
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
  const now = Date.parse("2026-09-03T10:00:00+08:00");
  const draftCopy = {
    eyebrow: "WEEKEND",
    headline: "週末手沖",
    subhead: "兩人座，預約制。",
    body: "",
    cta: "預約席次",
    handle: "@nisshoku.coffee",
    caption: "",
    hashtags: ["#日食咖啡"],
    altText: "",
  };
  const artboard = buildLayout("story", draftCopy, SEED_BRAND, "offer", {
    imageAssetId: SEED_BEANS_ID,
  });
  artboard.layers = artboard.layers.map((layer, index) => ({
    ...layer,
    id: `seed_draft_ly_${index}`,
  }));
  return {
    id: SEED_DRAFT_ID,
    name: "週末限時・手沖體驗",
    createdAt: now,
    updatedAt: now,
    brandId: SEED_BRAND_ID,
    templateId: "quote",
    activeFormatId: "story",
    status: "idea",
    brief: migrateBrief({
      product: "週末手沖體驗席",
      eventName: "週末手沖體驗",
      schedule: "週末午后",
      location: "日食咖啡",
      offer: "兩人座，預約制",
      audience: "想慢慢喝一杯的附近住戶",
      goal: "traffic",
      features: "兩人座、預約制",
      style: "安靜、不催促",
      notes: "尚未定標題層級，先當草稿。",
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
