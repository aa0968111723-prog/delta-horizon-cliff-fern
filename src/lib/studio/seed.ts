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
import { buildLayout } from "./layout";
import type { AssetMeta, BrandKit, Campaign, Layer, Project } from "./types";

export const SEED_BRAND_ID = "brand_tku_zen";
export const SEED_PROJECT_ID = "content_fuyou_cover";
export const SEED_DRAFT_ID = "content_midterm_breath";
export const SEED_LOGO_ID = "asset_zen_mark";
export const SEED_MASCOT_ID = "asset_gugu";
export const SEED_DUSK_ID = "asset_tamsui_dusk";
export const SEED_WINDOW_ID = "asset_window_light";
export const SEED_NIGHT_ID = "asset_night_lamp";
export const SEED_CAMPAIGN_ID = "camp_fuyou_zen_light";

const SEED_TIME = Date.parse("2026-09-08T00:00:00+08:00");

export const SEED_ASSETS: AssetMeta[] = [
  seedAsset({
    id: SEED_LOGO_ID,
    name: "三色光標誌",
    kind: "logo",
    category: "logo",
    mime: "image/svg+xml",
    width: 160,
    height: 160,
    tags: ["logo", "三色光", "品牌"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/club-mark.svg",
    source: "seed",
    licenseNotes: "社團自有標誌，僅限禪學社網宣使用。",
    licenseOwner: CLUB_NAME,
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 2,
  },
  {
    id: SEED_MASCOT_ID,
    name: "龜龜",
    kind: "logo",
    category: "mascot",
    mime: "image/svg+xml",
    width: 320,
    height: 320,
    tags: ["龜龜", "吉祥物", "輕鬆"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/gugu.svg",
    source: "seed",
    licenseNotes: "社團吉祥物。放在輕鬆內容、限動、倒數。",
    licenseOwner: CLUB_NAME,
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 1,
  },
  {
    id: SEED_DUSK_ID,
    name: "淡水河傍晚",
    kind: "image",
    category: "campus",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["淡水", "夕陽", "背景", "主視覺"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/tamsui-dusk.svg",
    source: "seed",
    licenseNotes: "社團自製底圖，可作主視覺或背景。",
    licenseOwner: CLUB_NAME,
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 1,
  },
  {
    id: SEED_WINDOW_ID,
    name: "窗邊光與坐墊",
    kind: "image",
    category: "photo",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["社課", "坐墊", "窗邊", "白天"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/window-light.svg",
    source: "seed",
    licenseNotes: "社團自製底圖，適合社課與體驗類內容。",
    licenseOwner: CLUB_NAME,
    favorite: false,
    lastUsedAt: null,
    useCount: 0,
  },
  {
    id: SEED_NIGHT_ID,
    name: "宿舍夜燈",
    kind: "image",
    category: "campus",
    mime: "image/svg+xml",
    width: 1080,
    height: 1350,
    tags: ["宿舍", "夜晚", "情緒", "期末"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/night-lamp.svg",
    source: "seed",
    licenseNotes: "社團自製底圖，適合情緒共鳴與期末內容。",
    licenseOwner: CLUB_NAME,
    favorite: false,
    lastUsedAt: null,
    useCount: 0,
  },
];

export const SEED_BRAND: BrandKit = {
  id: SEED_BRAND_ID,
  name: CLUB_NAME,
  handle: CLUB_HANDLE,
  website: "淡江大學禪學社",
  voice: CLUB_VOICE,
  doSay: CLUB_DO_SAY,
  dontSay: CLUB_DONT_SAY,
  forbiddenWords: ["誠摯邀請", "踴躍參加", "洗滌心靈", "限時", "名額有限"],
  colors: [
    { id: "c1", hex: CLUB_PALETTE.clear, role: "primary", label: "澄光" },
    { id: "c2", hex: CLUB_PALETTE.night, role: "secondary", label: "夜光" },
    { id: "c3", hex: CLUB_PALETTE.paper, role: "background", label: "紙白" },
    { id: "c4", hex: CLUB_PALETTE.warm, role: "accent", label: "曦光" },
    { id: "c5", hex: CLUB_PALETTE.ink, role: "ink", label: "墨" },
  ],
  fontDisplay: "Noto Sans TC",
  fontBody: "Noto Sans TC",
  logoAssetId: SEED_LOGO_ID,
  logos: [
    { id: "logo_zen_primary", name: "三色光主標誌", assetId: SEED_LOGO_ID, usage: "primary" },
    { id: "logo_zen_mascot", name: "龜龜", assetId: SEED_MASCOT_ID, usage: "mark" },
  ],
  slogans: [...CLUB_SLOGANS],
  ctas: [...CLUB_CTAS],
  imageStyle: {
    mood: VISUAL_ANCHORS.mood,
    lighting: VISUAL_ANCHORS.lighting,
    paletteHint: VISUAL_ANCHORS.palette,
    composition: VISUAL_ANCHORS.composition,
    do: VISUAL_ANCHORS.subjects,
    dont: VISUAL_ANCHORS.avoid,
  },
  rules: {
    noCompetitorMarks: true,
    noWatermark: true,
    noLowRes: true,
    notes: `${MASCOT.name}只出現在輕鬆內容；主視覺不要出現宗教符號；時間地點一定要看得到。`,
  },
  boilerplate: {
    ...emptyBoilerplate(),
    cta: "來坐一下",
    disclaimer: "第一次來不用準備任何東西。",
    hashtags: CLUB_HASHTAGS.slice(0, 3),
    captionClose: CLUB_INTRO_SHORT,
  },
  memory: clubBrandMemory([SEED_LOGO_ID, SEED_MASCOT_ID, SEED_DUSK_ID]),
  updatedAt: SEED_TIME,
};

/* ------------------------------------------------------------------ */
/* 示範活動：浮游禪光                                                     */
/* ------------------------------------------------------------------ */

const copy = {
  eyebrow: "09/24 浮游禪光",
  headline: "很久沒有\n好好坐下來了吧",
  subhead: "9/24（三）19:00\n淡江大學 商管大樓 B302",
  body: "不用盤腿，不用信什麼。一個小時，把手機放旁邊，先把自己整理一下。",
  cta: "來坐一下",
  handle: CLUB_HANDLE,
  caption:
    "最近是不是連休息都覺得有罪惡感？\n\n開學一個多月，課表塞滿、報告開始追上來，好像沒有一段時間是真的屬於自己的。\n\n9/24 晚上七點，我們在商管大樓 B302 辦「浮游禪光」。不用盤腿，不用信什麼，就是坐下來一小時，把最近的事情放下來看看。第一次來什麼都不會，完全可以。\n\n位子留著，找朋友一起來也行。",
  hashtags: ["#淡江大學", "#淡江禪學社", "#淡江社團", "#浮游禪光", "#靜心", "#淡水"],
  altText: "淡水河傍晚的光作底，標題寫著「很久沒有好好坐下來了吧」，下方是浮游禪光的時間地點。",
};

function stabilize(layers: Layer[], prefix: string): Layer[] {
  return layers.map((layer, index) => ({ ...layer, id: `${prefix}${index}` }));
}

export function createSeedProject(): Project {
  const now = SEED_TIME;
  const page1 = buildLayout("feed-portrait", copy, SEED_BRAND, "editorial", {
    imageAssetId: SEED_DUSK_ID,
  });
  page1.layers = stabilize(page1.layers, "seed_ly_");
  page1.role = "cover";
  page1.templateId = "editorial";

  const page2 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "你可能也這樣",
      headline: "你不是懶\n只是很久沒休息",
      subhead: "累到連放假都在滑手機。",
      body: "腦袋一直開著，但沒有一件事真的做完。",
      cta: "來坐一下",
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
      eyebrow: "那一小時會做什麼",
      headline: "坐下來\n然後什麼都不用做",
      subhead: "引導十五分鐘 · 自由坐 · 想講再講",
      body: "有人第一次來就睡著了，也沒關係。",
      cta: "社課見",
    },
    SEED_BRAND,
    "editorial",
    { imageAssetId: SEED_WINDOW_ID },
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
      eyebrow: "社員說",
      headline: "我第一次來\n也覺得很尬",
      subhead: "現在變成一週最想留著的一小時。",
      body: "沒有人會問你為什麼來。",
      cta: "找朋友一起來",
    },
    SEED_BRAND,
    "quote",
  );
  page4.layers = stabilize(page4.layers, "seed_p4_ly_");
  page4.role = "proof";
  page4.templateId = "quote";

  const page5 = buildLayout(
    "feed-portrait",
    {
      ...copy,
      eyebrow: "09/24（三）19:00",
      headline: "商管大樓\nB302",
      subhead: "直接來就好，不用報名。",
      body: "想問什麼可以先私訊我們。",
      cta: "來坐一下",
    },
    SEED_BRAND,
    "offer",
  );
  page4.layers = stabilize(page4.layers, "seed_p4_ly_");
  page4.role = "cta";
  page4.templateId = "offer";

  const slides = [page1, page2, page3, page4, page5];

  const brief = migrateBrief({
    product: "浮游禪光 · 靜坐體驗",
    eventName: "浮游禪光",
    schedule: "2026/09/24（三）19:00",
    location: "淡江大學 商管大樓 B302",
    offer: "免報名，直接來",
    audience: "淡江大一新生、課業壓力大的學生、對禪完全不了解的人",
    goal: "awareness",
    features: "引導靜坐十五分鐘、自由坐、想講再講、第一次來不用準備",
    style: "安靜、具體、不說教",
    notes: "不要用宗教語彙，也不要寫成官方邀請函。",
    deliverables: { post: true, story: true, carousel: true, reels: false },
  });

  const plan = migratePlan({
    campaignName: "浮游禪光",
    concept:
      "開學一個多月，學生開始累但還說不出來。用「你不是懶，只是很久沒休息」切進去，再把活動說成「一小時的空白」，而不是社團招生。",
    insight: "淡江學生不缺活動，缺的是一段沒有人要求他表現的時間。",
    hook: "最近是不是連休息都覺得有罪惡感？",
    visualTheme: "淡水傍晚的光、紙白底、三色光點綴，留白多。",
    visualDirection: "上半用淡水河或窗邊光，下半紙白底放大標，曦光作眉題色。",
    templateId: "editorial",
    colorMood: "紙白、澄光、曦光",
    eyebrow: copy.eyebrow,
    headline: copy.headline,
    subhead: "9/24（三）19:00 · 商管 B302",
    body: copy.body,
    cta: copy.cta,
    captions: [
      { style: "學生版", text: copy.caption },
      {
        style: "短版",
        text: "很久沒有好好坐下來了吧。\n9/24（三）19:00，商管 B302，來坐一小時就好。",
      },
    ],
    hashtags: copy.hashtags,
    storyBeats: ["「最近有好好休息嗎」問句", "現場坐墊與光", "時間地點 + 來坐一下"],
    carouselPages: [
      {
        role: "cover",
        headline: copy.headline,
        subhead: "9/24（三）19:00 · 商管 B302",
        body: "不用盤腿，不用信什麼。",
        cta: "來坐一下",
        visualNote: "封面要能單獨看懂，時間地點放小但看得到。",
        templateId: "editorial",
      },
      {
        role: "problem",
        headline: "你不是懶\n只是很久沒休息",
        subhead: "累到連放假都在滑手機。",
        body: "腦袋一直開著，但沒有一件事真的做完。",
        cta: "來坐一下",
        visualNote: "用夜晚宿舍書桌的畫面，不要笑臉照。",
        templateId: "quote",
      },
      {
        role: "detail",
        headline: "坐下來\n然後什麼都不用做",
        subhead: "引導十五分鐘 · 自由坐 · 想講再講",
        body: "有人第一次來就睡著了，也沒關係。",
        cta: "社課見",
        visualNote: "白天窗邊光，講清楚流程降低不確定感。",
        templateId: "editorial",
      },
      {
        role: "proof",
        headline: "我第一次來\n也覺得很尬",
        subhead: "現在變成一週最想留著的一小時。",
        body: "沒有人會問你為什麼來。",
        cta: "找朋友一起來",
        visualNote: "社員自己的話，字大、留白多。",
        templateId: "quote",
      },
      {
        role: "cta",
        headline: "商管大樓\nB302",
        subhead: "直接來就好，不用報名。",
        body: "想問什麼可以先私訊我們。",
        cta: "來坐一下",
        visualNote: "只留時間、地點、CTA。",
        templateId: "offer",
      },
    ],
    assetNeeds: [
      { kind: "photo", title: "社課現場", detail: "坐墊與窗邊光，不要擺拍。", required: true },
      { kind: "background", title: "淡水傍晚", detail: "封面用，留白給標題。", required: true },
      { kind: "logo", title: "三色光標誌", detail: "放右下角，不要壓到主體。", required: true },
      { kind: "people", title: "社員側臉或手", detail: "社員故事頁用，不用露臉。", required: false },
    ],
    checklist: [
      "第一句是學生會停下來的話，不是社團自我介紹",
      "時間、地點、教室至少各出現一次",
      "有講「第一次來也可以」",
      "沒有宗教語彙與禁用詞",
      "輪播最後一頁有明確的下一步",
      "標題兩行以內且落在安全區",
    ],
    altText: copy.altText,
    qaNotes: ["主視覺不要出現蓮花或金光", "龜龜留給限動與倒數，主視覺不放"],
    generatedAt: now,
    source: "live",
  });

  return {
    id: SEED_PROJECT_ID,
    name: "浮游禪光 · 主視覺輪播",
    createdAt: now,
    updatedAt: now,
    brandId: SEED_BRAND_ID,
    templateId: "editorial",
    activeFormatId: "feed-portrait",
    status: "done",
    contentKind: "carousel",
    campaignId: SEED_CAMPAIGN_ID,
    scheduledAt: null,
    publishedAt: null,
    brief,
    copy,
    plan,
    copyDrafts: [],
    studentReview: null,
    reels: null,
    sources: [
      { kind: "local", label: "品牌記憶", detail: "三色光配色與語氣規則" },
      { kind: "local", label: "素材庫 / 淡水河傍晚", detail: "封面底圖", assetId: SEED_DUSK_ID },
    ],
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
  const now = Date.parse("2026-09-10T10:00:00+08:00");
  const draftCopy = {
    eyebrow: "期中前的三分鐘",
    headline: "考前也可以\n用的呼吸練習",
    subhead: "三分鐘，不用閉眼也行。",
    body: "",
    cta: "先存起來",
    handle: CLUB_HANDLE,
    caption: "",
    hashtags: ["#淡江大學"],
    altText: "",
  };
  const artboard = buildLayout("story", draftCopy, SEED_BRAND, "quote", {
    imageAssetId: SEED_NIGHT_ID,
  });
  artboard.layers = artboard.layers.map((layer, index) => ({
    ...layer,
    id: `seed_draft_ly_${index}`,
  }));
  return {
    id: SEED_DRAFT_ID,
    name: "三分鐘呼吸練習",
    createdAt: now,
    updatedAt: now,
    brandId: SEED_BRAND_ID,
    templateId: "quote",
    activeFormatId: "story",
    status: "idea",
    contentKind: "knowledge",
    campaignId: null,
    scheduledAt: null,
    publishedAt: null,
    brief: migrateBrief({
      product: "呼吸練習",
      eventName: "三分鐘呼吸練習",
      schedule: "期中考週",
      location: "任何地方",
      offer: "",
      audience: "課業壓力大的學生、通勤生",
      goal: "awareness",
      features: "三分鐘、不用閉眼、可在圖書館做",
      style: "實用、不說教",
      notes: "期中週只給喘口氣的內容，不要塞活動資訊。",
      deliverables: { post: false, story: true, carousel: false, reels: false },
    }),
    copy: draftCopy,
    plan: null,
    copyDrafts: [],
    studentReview: null,
    reels: null,
    sources: [],
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

function createSeedCampaign(): Campaign {
  const base = migrateCampaign({
    id: SEED_CAMPAIGN_ID,
    name: "浮游禪光",
    kind: "sit",
    date: "2026-09-24",
    time: "19:00",
    location: "淡江大學 商管大樓 B302",
    oneLiner: "一小時的空白，讓開學後的自己喘一口氣。",
    intro:
      "「浮游禪光」是一場給完全沒接觸過靜坐的人的體驗。前十五分鐘由社員帶著坐，之後想繼續坐、想講話、想安靜都可以。不用盤腿、不用穿特別的衣服，直接來就好。",
    theme: "在忙起來之前，先幫自己留一小時。",
    painPoint: "開學一個多月，行程被塞滿，卻沒有一段時間是自己的",
    cta: "來坐一下",
    signupUrl: "",
    coverAssetId: SEED_DUSK_ID,
    assetIds: [SEED_DUSK_ID, SEED_WINDOW_ID, SEED_NIGHT_ID],
    audienceIds: ["freshman", "study-pressure", "zen-stranger", "wants-belonging"],
    axis: "不是招生，是先讓人覺得被理解，再邀他來坐一小時。",
    directions: [
      {
        id: "dir_quiet_hour",
        title: "一小時的空白",
        concept: "把活動說成「一小時什麼都不用做」，訴求最低門檻。",
        visual: "淡水傍晚的光＋大量留白，標題只有一句。",
        sampleHook: "最近是不是連休息都覺得有罪惡感？",
      },
      {
        id: "dir_first_time",
        title: "第一次來也可以",
        concept: "正面回應「怕被傳教、怕坐不住」的顧慮。",
        visual: "白天窗邊光與坐墊，畫面像社課現場而不是宗教場所。",
        sampleHook: "不用盤腿，不用信什麼，坐下來就好。",
      },
      {
        id: "dir_night_walk",
        title: "夜晚的淡水",
        concept: "從宿舍夜燈與河邊夜色切入，talk to 住宿生與通勤生。",
        visual: "夜光為主色，暖燈作點光，畫面偏安靜。",
        sampleHook: "有時候我們需要的不是答案，只是一個安靜的晚上。",
      },
    ],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    planSource: "live",
  });
  const waves = defaultWavePlan(base).map((wave) =>
    wave.offsetDays === -7 ? { ...wave, contentId: SEED_PROJECT_ID } : wave,
  );
  return { ...base, waves };
}

export const SEED_CAMPAIGNS: Campaign[] = [createSeedCampaign()];

export const SEED_PROJECT = createSeedProject();
