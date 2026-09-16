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
  {
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
  fontDisplay: "Noto Serif TC",
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
  return layers.map((layer, index) => ({
    ...layer,
    id: `${prefix}${index}`,
  }));
}

export function createSeedProject(): Project {
  const now = SEED_TIME;
  const page1 = buildLayout("feed-portrait", copy, SEED_BRAND, "product", {
    imageAssetId: SEED_CUP_ID,
  });
  page1.layers = stabilize(page1.layers, "seed_ly_");
  page1.role = "cover";
  page1.templateId = "product";

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
  page5.layers = stabilize(page5.layers, "seed_p5_ly_");
  page5.role = "cta";
  page5.templateId = "offer";

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
    templateId: "product",
    activeFormatId: "feed-portrait",
    status: "ready",
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
    templateId: "offer",
    activeFormatId: "story",
    status: "draft",
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

export const SEED_PROJECT = createSeedProject();
