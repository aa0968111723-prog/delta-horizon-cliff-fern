import { goalLabel } from "../studio/goals.ts";
import type { CampaignPlan, CarouselPagePlan, TemplateId } from "../studio/types.ts";
import { sourcesFromMemoryNotes } from "../zen/ingest.ts";
import { completeCopyVariants } from "../zen/voice.ts";
import type { BriefInput } from "./schema.ts";

function pickTemplate(goal: BriefInput["goal"], wantCarousel: boolean): TemplateId {
  if (goal === "conversion" || goal === "traffic") return wantCarousel ? "product" : "offer";
  if (goal === "ugc") return "quote";
  return "editorial";
}

function hashTag(word: string) {
  const cleaned = word.replace(/[#＃\s]/g, "");
  return cleaned ? `#${cleaned}` : "";
}

function clipHeadline(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((line) => (line.length > 10 ? line.slice(0, 10) : line));
  return lines.join("\n") || text.slice(0, 10);
}

function stripForbidden(text: string, words: string[]) {
  let next = text;
  for (const word of words) {
    if (!word.trim()) continue;
    next = next.split(word).join("");
  }
  return next.replace(/\s{2,}/g, " ").trim();
}

export function buildMockPlan(data: BriefInput): CampaignPlan {
  const name = data.eventName.trim();
  const when = data.schedule.trim() || "近期檔期";
  const where = data.location.trim() || "淡江大學淡水校園";
  const audience = data.audience.trim();
  const features = data.features.trim() || data.product.trim() || name;
  const style = data.style.trim() || data.voice || "沉靜、具體";
  const offer = data.offer.trim();
  const ctaPool = (data.preferredCtas || "")
    .split(/[／/,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const slogan = (data.slogans || "").split(/[／/]/)[0]?.trim();
  const cta = stripForbidden(ctaPool[0] || (data.goal === "traffic" ? "查看地點" : "了解活動"), data.forbiddenWords);
  const templateId = pickTemplate(data.goal, data.wantCarousel);
  const headline = clipHeadline(name.replace(/[（(].*$/, ""));
  const isZen = /禪|淡江|禪學/.test(`${data.brandName}${data.audience}${data.eventName}`);
  const hook = isZen
    ? stripForbidden("最近是不是很久沒有好好坐下來？", data.forbiddenWords)
    : stripForbidden(slogan || (offer ? `${name}，${offer}。` : `${name}，只在${when}。`), data.forbiddenWords);
  const concept = stripForbidden(
    `${name}把「${features}」講給${audience}聽。目的是${goalLabel(data.goal)}，語氣維持${style}，不靠叫賣。`,
    data.forbiddenWords,
  );
  const memoryLine = data.memoryNotes?.trim().split("\n").find(Boolean);
  const insight = isZen
    ? `${audience}要的不是宗教說明，是一個可以停下來的晚上。把時間（${when}）與場域（${where}）講清楚就好。${memoryLine ? `參考歷屆素材：${memoryLine}。` : ""}`
    : `${audience}要的是可以相信的理由，不是更大聲的促銷。把時間（${when}）與場域（${where}）講清楚，特色只留一句能被記住的。${memoryLine ? `參考歷屆素材：${memoryLine}。` : ""}`;
  const visualTheme = data.imageStyle?.trim() || `${style}；主視覺放現場或物件，文字區留白。`;
  const visualDirection = `畫面用品牌色做底，上半主視覺、下半標題。風格：${style}。避免雜訊與浮水印。`;
  const subhead = offer || `${when} · ${where}`;
  const body = features;
  const captionCore = [
    hook,
    `${when}${where ? `，${where}` : ""}。`,
    features ? `這次看點：${features}。` : "",
    offer ? offer : "",
    slogan ? slogan : "",
  ]
    .filter(Boolean)
    .join("\n");

  const pages: CarouselPagePlan[] = data.wantCarousel
    ? [
        {
          role: "cover",
          headline: clipHeadline(hook),
          subhead: name,
          body: hook,
          cta,
          visualNote: "封面：Hook 先行，活動名可小。",
          templateId: "quote",
        },
        {
          role: "problem",
          headline: clipHeadline("為什麼現在看"),
          subhead: audience,
          body: insight,
          cta,
          visualNote: "痛點頁只留一句真正的猶豫，不要叫賣。",
          templateId: "quote",
        },
        {
          role: "detail",
          headline: clipHeadline(features.split(/[、，,]/)[0] || "活動內容"),
          subhead: when,
          body: features,
          cta,
          visualNote: "重點頁最多三件事：時間、特色、對象。",
          templateId: "editorial",
        },
        {
          role: "proof",
          headline: clipHeadline(where),
          subhead: audience,
          body: insight,
          cta,
          visualNote: "案例頁用現場、物件或一句可被相信的話。",
          templateId: "product",
        },
        {
          role: "cta",
          headline: clipHeadline(cta),
          subhead: `${when} · ${where}`,
          body: offer || "來的時候帶這則貼文即可。",
          cta,
          visualNote: "行動頁只留時間、地點、CTA。",
          templateId: "offer",
        },
        {
          role: "close",
          headline: clipHeadline(slogan || hook),
          subhead: data.brandName,
          body: offer || `${when}，${where}。`,
          cta,
          visualNote: "結尾頁一句話收束，可截圖分享。",
          templateId: "quote",
        },
      ]
    : [
        {
          role: "cover",
          headline,
          subhead,
          body: features,
          cta,
          visualNote: "單張：主視覺 + 標題 + CTA，資訊不要超過三層。",
          templateId,
        },
      ];

  const storyBeats = data.wantStory
    ? isZen
      ? [hook, "不是講座，只是可以坐著。", `${when} · ${where} · ${cta}`]
      : [`${name}開始`, features.split(/[、，,]/)[0] || "現場特色", `${cta} · ${where}`]
    : [];

  const hashtags = [
    hashTag(data.brandName),
    hashTag(name),
    hashTag(where),
    "#淡江",
    data.goal === "ugc" ? "#打卡" : "#活動",
  ].filter(Boolean);

  return {
    campaignName: name,
    concept,
    insight,
    hook: stripForbidden(hook, data.forbiddenWords),
    visualTheme,
    visualDirection,
    templateId,
    colorMood: visualTheme,
    eyebrow: data.goal === "conversion" ? "LIMITED" : "EVENT",
    headline,
    subhead,
    body,
    cta,
    captions: completeCopyVariants({
      hook: stripForbidden(hook, data.forbiddenWords),
      body: stripForbidden(captionCore, data.forbiddenWords),
      cta: stripForbidden(cta, data.forbiddenWords),
      variants: [
        { style: "一般版", text: stripForbidden(captionCore, data.forbiddenWords) },
        { style: "短版", text: stripForbidden(`${hook}\n${cta}`, data.forbiddenWords) },
        { style: "學生版", text: stripForbidden(`${hook}\n${when}，${where}。找一個朋友也行。`, data.forbiddenWords) },
      ],
    }),
    hashtags: isZen
      ? [hashTag(data.brandName), "#淡江", "#淡水", hashTag(name)].filter(Boolean)
      : hashtags,
    storyBeats,
    carouselPages: pages,
    assetNeeds: [
      { kind: "photo", title: "活動主視覺", detail: `能代表「${name}」的現場或物件，直式優先。`, required: true },
      { kind: "logo", title: "品牌標誌", detail: "透明底或淺底版本，放角落不壓主體。", required: true },
      { kind: "background", title: "留白／材質背景", detail: "給標題頁使用，避免雜亂桌面。", required: false },
      ...(data.wantStory
        ? [{ kind: "people" as const, title: "同學坐下來的瞬間", detail: "限動第二則用，不要擺拍網紅姿勢。", required: false }]
        : []),
    ],
    checklist: [
      "標題不超過兩行，且落在安全區內",
      "時間與地點至少在一頁出現",
      "CTA 可讀、對比足夠",
      "沒用品牌禁用詞",
      data.wantCarousel ? "輪播末頁有明確行動" : "單張資訊不超過三層",
      "Logo 沒壓到主體",
    ],
    altText: `${name}的宣傳畫面，標題為「${headline.replace("\n", " ")}」，標示${when}、${where}。`,
    qaNotes: ["避免把價格或焦慮話術放進主畫面", `風格維持：${style}`],
    generatedAt: Date.now(),
    source: "mock",
    visualDirections: [
      {
        id: "dir_a",
        title: "夜色留白",
        concept: "第一句 Hook 很大，燈在遠處。",
        palette: "暮藍、沙色、暖光",
        composition: "上半夜色，下半大字",
        typeDirection: "襯線標題、細黑體說明",
        imagePrompt: `${name} at Tamkang Tamsui campus night, soft three colored lights cyan amber rose, airy, not temple, photographic, students sitting`,
        headline,
        subhead,
      },
      {
        id: "dir_b",
        title: "同學側臉",
        concept: "先看到人，再看到活動。",
        palette: "苔綠、暖光",
        composition: "人在左側，字在右側留白",
        typeDirection: "短句、口語",
        imagePrompt: `candid Tamkang student at night tea gathering, warm lamp, friends, not posed, not religious`,
        headline,
        subhead,
      },
      {
        id: "dir_c",
        title: "龜龜與三色光",
        concept: "品牌記憶出場，但不要卡通過量。",
        palette: "水色、暖光、沙色",
        composition: "角色小、光大",
        typeDirection: "手寫感標題避免",
        imagePrompt: `turtle mascot silhouette with floating cyan amber lights over Tamsui water, quiet, editorial poster`,
        headline,
        subhead,
      },
    ],
    threadsPost: `${hook}\n\n${when} ${where}\n${cta}`,
    lineCopy: `【${name}】${when} ${where}\n${hook}`,
    studentReview: {
      wouldStop: isZen ? "第一句會停。" : "看標題。",
      understandable: "看得懂。",
      tooReligious: isZen ? "沒有宗教開場。" : "無。",
      tooSerious: "偏安靜。",
      tooLiterary: "還好。",
      tooAi: "結構清楚，可再口語一點。",
      tooLong: data.wantCarousel ? "輪播可接受。" : "單張注意字數。",
      knowsWhat: `知道是${name}。`,
      knowsWhenWhere: `${when}、${where}有出現。`,
      wouldBringFriend: "可以。",
      knowsSignup: "CTA 有了，報名連結要補。",
      notes: ["報名方式再具體。"],
      rewriteHook: isZen ? "最近是不是連休息都覺得有罪惡感？" : "",
    },
    reelsScript: data.wantReels
      ? [
          { startSec: 0, endSec: 3, visual: "學生臉或校園夜色", caption: hook, voiceover: hook, transition: "切", assetHint: "淡水黃昏" },
          { startSec: 3, endSec: 7, visual: "坐下來、茶、燈", caption: "不是要你突然很懂禪", voiceover: insight.slice(0, 40), transition: "慢推", assetHint: "茶會" },
          { startSec: 7, endSec: 12, visual: "現場光與同學", caption: features.slice(0, 18), voiceover: features.slice(0, 40), transition: "切", assetHint: "三色光" },
          { startSec: 12, endSec: 17, visual: "時間地點字卡", caption: `${when} ${where}`, voiceover: `${when}，${where}`, transition: "淡入", assetHint: "字卡" },
          { startSec: 17, endSec: 20, visual: "CTA", caption: cta, voiceover: cta, transition: "切", assetHint: "報名或晚上見" },
        ]
      : undefined,
    citedSources: sourcesFromMemoryNotes(data.memoryNotes),
  };
}
