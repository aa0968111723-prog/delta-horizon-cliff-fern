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
import { DEFAULT_SHADOW } from "./layers";
import type { AssetMeta, BrandKit, Layer, LineLayer, Project } from "./types";

export const SEED_BRAND_ID = "brand_tku_zenclub";
export const SEED_PROJECT_ID = "proj_floating_light";
export const SEED_DRAFT_ID = "proj_weekend_zen";
export const SEED_LOGO_ID = "asset_tku_logo";
export const SEED_CUP_ID = "asset_cup";
export const SEED_BEANS_ID = "asset_beans";

export const SEED_TIME = Date.parse("2026-09-01T00:00:00+08:00");

export const SEED_ASSETS: AssetMeta[] = [
  seedAsset({
    id: SEED_LOGO_ID,
    name: "淡江禪學社三色光標誌",
    kind: "logo",
    category: "logo",
    mime: "image/svg+xml",
    width: 80,
    height: 80,
    tags: ["logo", "品牌", "圖標", "三色光", "淡江禪學社"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/nisshoku-mark.svg",
    source: "seed",
    licenseNotes: "社團自有標誌，淡江禪學社網宣創作專用。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 2,
    attribution: "社團自有標誌",
    analysisNotes: "",
  },
  {
    id: SEED_CUP_ID,
    name: "茶會暖心熱茶手捧",
    kind: "image",
    category: "photo",
    mime: "image/jpeg",
    width: 1408,
    height: 1408,
    tags: ["茶會", "生活感", "熱茶", "溫暖", "活動紀錄"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/cup.jpg",
    source: "seed",
    licenseNotes: "歷屆茶會實拍，可作 IG 主視覺與貼文插圖。",
    licenseOwner: "淡江大學禪學社",
    favorite: true,
    lastUsedAt: SEED_TIME,
    useCount: 1,
    attribution: "Google Drive／2025 茶會紀錄",
    analysisNotes: "",
  },
  {
    id: SEED_BEANS_ID,
    name: "宮燈教室夜景與微光氛圍",
    kind: "image",
    category: "background",
    mime: "image/jpeg",
    width: 1408,
    height: 1408,
    tags: ["淡江校園", "宮燈", "夜景", "背景", "微光"],
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    seedSrc: "/seed/beans.jpg",
    source: "seed",
    licenseNotes: "淡江校園實景拍攝，可作背景底圖。",
    licenseOwner: "淡江大學禪學社",
    favorite: false,
    lastUsedAt: Date.parse("2026-09-03T10:00:00+08:00"),
    useCount: 1,
    attribution: "淡江校園實景／宮燈教室",
    analysisNotes: "",
  },
];

export const SEED_BRAND: BrandKit = {
  id: SEED_BRAND_ID,
  name: "淡江大學禪學社",
  handle: "@tku_zenclub",
  website: "instagram.com/tku_zenclub",
  voice: "溫暖、安定、生活感、懂大學生的日常情緒與壓力。不說教、不用深奧佛學術語，像淡江學長姐在校園草坪或咖啡香裡陪你聊聊。",
  doSay: "安定、專注、慢下來、認識自己、整理情緒、陪伴、自我探索、生活感、喘口氣、重新看見自己、在人際和壓力中找到空間、克難坡、淡水夕陽、宮燈教室",
  dontSay: "宗教狂熱、玄學命理、因果輪迴、說教訓話、爆款必看、不來就後悔、限時瘋搶",
  forbiddenWords: ["玄學", "命理", "說教", "爆款", "便宜", "瘋搶"],
  colors: [
    { id: "c1", hex: "#1E3A4C", role: "primary", label: "淡水夜青" },
    { id: "c2", hex: "#4A7C72", role: "secondary", label: "松竹綠" },
    { id: "c3", hex: "#F7F6F2", role: "background", label: "暖宣紙白" },
    { id: "c4", hex: "#D97736", role: "accent", label: "晨曦暖光" },
    { id: "c5", hex: "#1A202C", role: "ink", label: "深墨黑" },
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
      name: "三色光圖標",
      assetId: SEED_LOGO_ID,
      usage: "mark",
    },
  ],
  slogans: ["在淡水的風裡，找回心裡的安靜。", "給忙碌的大學生活，留一個不需要打分的角落。"],
  ctas: ["預約茶會席位", "加入日常靜心", "私訊學長姐聊聊", "了解更多"],
  imageStyle: {
    mood: "明亮、舒服、療癒、年輕、有空氣感、微光、生活感",
    lighting: "傍晚柔和漫射光、淡水夕照暖金、晨光微亮，避開生硬閃光燈與刺眼霓虹",
    paletteHint: "淡水夜青、松竹綠、暖宣紙底、晨曦暖光點綴、三色光柔和光暈",
    composition: "畫面呼吸感、大面積留白、物件或人物自然不做作、留出排版空間",
    do: "草坪坐禪、手捧熱茶、安靜龜龜手繪、淡江宮燈、捷運夕陽、同學溫暖笑顏",
    dont: "宗教神像金碧輝煌、複雜神秘符號、過度修圖網美感、大量壓迫文案",
  },
  rules: {
    noCompetitorMarks: true,
    noWatermark: true,
    noLowRes: true,
    notes: "字級維持大字率，避免 AI 塑膠感與沉重宗教味，以淡江學生共鳴第一位。",
  },
  boilerplate: {
    ...emptyBoilerplate(),
    cta: "預約茶會席位",
    disclaimer: "淡江大學學生社團活動，全體淡江師生皆可免費參加。",
    hashtags: ["#淡江大學", "#淡江禪學社", "#淡水生活", "#心靈綠洲", "#大學生活"],
    captionClose: "歡迎來活動中心找我們坐坐，或私訊 IG 詢問。",
  },
  memory: clubBrandMemory([SEED_LOGO_ID, SEED_MASCOT_ID, SEED_DUSK_ID]),
  updatedAt: SEED_TIME,
};

/* ------------------------------------------------------------------ */
/* 示範活動：浮游禪光                                                     */
/* ------------------------------------------------------------------ */

const copy = {
  eyebrow: "09/24 浮游禪光",
  headline: "最近是不是\n很久沒好好坐下來？",
  subhead: "開學第三週 · 淡江大學活動中心 · 迎新茶會",
  body: "不用懂深奧佛學，也沒有說教。在淡水微涼的夜裡，捧一杯熱茶，給自己留一個不需要打分的安靜角落。",
  cta: "預約茶會席位",
  handle: "@tku_zenclub",
  caption:
    "開學第三週，待辦清單突然變長。\n好不容易坐下來滑手機，心裡卻一直在想明天要交的報告。\n\n其實你不是不夠努力，只是太久沒有好好呼吸了。\n\n淡江禪學社 09/24（四）晚間「浮游禪光」迎新茶會。\n不說教、不用懂深奧佛學，只要帶上你想放空的心情來坐坐。\n\n時間：09/24 18:30 入場\n地點：淡江大學活動中心\n免費報名連結在主頁簡介。",
  hashtags: ["#淡江禪學社", "#淡江大學", "#浮游禪光", "#淡水生活", "#克難坡", "#心靈綠洲", "#大學生日常"],
  altText: "淡水夜青色背景上，溫暖茶杯與浮游微光，寫著淡江禪學社茶會預約文案。",
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
    { imageAssetId: SEED_NIGHT_ID },
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
  page4.templateId = "quote";

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
    product: "浮游禪光 迎新茶會",
    eventName: "09/24 浮游禪光",
    schedule: "2026-09-24 18:30",
    location: "淡江大學 學生活動中心",
    offer: "免費茶會席位、靜心引導、三色光體驗",
    audience: "開學感到緊繃、人際適應壓力大、想找心靈喘息處的淡江學生",
    goal: "awareness",
    features: "不說教、慢步調熱茶、安靜呼吸、生活對話",
    style: "溫暖、療癒、空氣感、懂學生生活",
    notes: "避開艱澀佛學或宗教詞彙，以生活感與壓力安頓為主軸。",
    deliverables: { post: true, story: true, carousel: true, reels: true },
  });

  const plan = migratePlan({
    campaignName: "09/24 浮游禪光茶會",
    concept: "把「最近是不是連休息都覺得有罪惡感？」當作心靈共鳴切入，引導學生來茶會放鬆。",
    insight: "淡江學生剛開學面對選課、人際與淡水潮濕天氣，需要被理解的真實陪伴，而不是說教式社團推銷。",
    hook: "最近是不是連休息都覺得有罪惡感？",
    visualTheme: "淡水夜青色調、三色光柔和光暈、溫暖熱茶手捧、大字率留白視覺",
    visualDirection: "上半生活情境或熱茶微光，下半暖白底配深墨大標，晨曦暖光作強調點綴。",
    templateId: "editorial",
    colorMood: "淡水夜青、松竹綠、暖宣紙、晨曦光",
    eyebrow: copy.eyebrow,
    headline: copy.headline,
    subhead: "開學第三週 · 給自己留一個放空的晚上",
    body: copy.body,
    cta: copy.cta,
    captions: [
      { style: "學生共鳴版", text: copy.caption },
      { style: "短版生活感", text: "在淡水的秋天夜晚，喝一杯溫暖熱茶。\n09/24 浮游禪光茶會，來活動中心坐坐。" },
    ],
    hashtags: copy.hashtags,
    storyBeats: ["校園生活情緒共鳴", "茶會亮點與無宗教負擔", "報名席次快速引導"],
    carouselPages: [
      {
        role: "cover",
        headline: copy.headline,
        subhead: "開學第三週 · 給自己留一個放空的晚上",
        body: "09/24 浮游禪光 茶會倒數",
        cta: "預約茶會席位",
        visualNote: "主視覺大標題醒目，留白呼吸感充足。",
        templateId: "editorial",
      },
      {
        role: "problem",
        headline: "連滑手機\n都在焦慮明天？",
        subhead: "你需要的不是答案，是放慢一下。",
        body: "課表、報告、社團、人際。每天跑來跑去，心裡卻越來越吵。",
        cta: "了解活動",
        visualNote: "點出淡江學生開學真實心境。",
        templateId: "quote",
      },
      {
        role: "detail",
        headline: "沒有說教\n只有一杯熱茶",
        subhead: "09/24 18:30 淡江活動中心",
        body: "三色光靜心、放鬆引導、舒服的音樂與生活閒聊。",
        cta: "預約茶會席位",
        visualNote: "介紹茶會內容與溫暖氣氛。",
        templateId: "product",
      },
      {
        role: "proof",
        headline: "一人來也好\n找室友更好",
        subhead: "歷屆學長姐好評回饋",
        body: "「本來以為會很嚴肅，結果聊完回去睡得超好！」",
        cta: "預約席位",
        visualNote: "破除宗教刻板印象。",
        templateId: "product",
      },
      {
        role: "cta",
        headline: "填表留位\n免費參加",
        subhead: "09/24 (四) 18:30 · 淡江活動中心",
        body: "名額有限，點擊主頁連結即可預約一人席或朋友席。",
        cta: "立即點擊主頁預約",
        visualNote: "行動明確，時間地點清楚。",
        templateId: "offer",
      },
      {
        role: "close",
        headline: "在淡水的風裡\n找回安靜的我",
        subhead: "淡江大學禪學社",
        body: "期待週四晚上與你在茶香中相遇。",
        cta: "收藏這篇貼文",
        visualNote: "適合截圖或轉發限時動態。",
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
