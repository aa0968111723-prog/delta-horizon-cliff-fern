import { emptyBoilerplate } from "./boilerplate";
import { migrateBrief, migratePlan, migratePlanVersions } from "./brief";
import { buildLayout } from "./layout";
import type { AssetMeta, BrandKit, Layer, Project } from "./types";

export const SEED_BRAND_ID = "brand_tku_zenclub";
export const SEED_PROJECT_ID = "proj_floating_light";
export const SEED_DRAFT_ID = "proj_weekend_zen";
export const SEED_LOGO_ID = "asset_tku_logo";
export const SEED_CUP_ID = "asset_cup";
export const SEED_BEANS_ID = "asset_beans";

export const SEED_TIME = Date.parse("2026-09-01T00:00:00+08:00");

export const SEED_ASSETS: AssetMeta[] = [
  {
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
    seedSrc: "/seed/zen-mark.svg",
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
    seedSrc: "/seed/turtle.svg",
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
    seedSrc: "/seed/tricolor.svg",
    source: "seed",
    licenseNotes: "淡江校園實景拍攝，可作背景底圖。",
    licenseOwner: "淡江大學禪學社",
    favorite: false,
    lastUsedAt: Date.parse("2026-09-03T10:00:00+08:00"),
    useCount: 1,
    attribution: "淡江校園實景／宮燈教室",
    analysisNotes: "",
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
  updatedAt: SEED_TIME,
};

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
