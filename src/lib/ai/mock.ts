import { goalLabel } from "../studio/goals.ts";
import type { CampaignPlan, CarouselPagePlan, TemplateId } from "../studio/types.ts";
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

function studentHook(name: string, features: string) {
  const text = `${name} ${features}`;
  if (/茶|夜|晚/.test(text)) return "有時候我們需要的不是答案，只是一個安靜的晚上。";
  if (/期中|期末|考|壓力|情緒/.test(text)) return "最近是不是連休息都覺得有罪惡感？";
  if (/招生|新生|朋友|認識/.test(text)) return "剛到淡江，還在找一個可以自在待著的地方嗎？";
  return "最近是不是很久沒有好好坐下來？";
}

export function buildMockPlan(data: BriefInput): CampaignPlan {
  const name = data.eventName.trim();
  const when = data.schedule.trim() || "近期檔期";
  const where = data.location.trim() || "淡江大學校園";
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
  const hook = studentHook(name, features);
  const concept = stripForbidden(
    `${name}把「${features}」講給${audience}聽。目的是${goalLabel(data.goal)}，語氣維持${style}，不靠叫賣。`,
    data.forbiddenWords,
  );
  const insight = `${audience}會先判斷「這跟我現在的淡江生活有沒有關係」，再看活動資訊。先說出課表、人際、通勤或宿舍生活裡的真實感受，再把時間（${when}）、地點（${where}）和能得到什麼講清楚。`;
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
          headline,
          subhead,
          body: hook,
          cta,
          visualNote: "封面：主視覺滿版或上半，標題最多兩行。",
          templateId: "product",
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
    ? [`${name}開始`, features.split(/[、，,]/)[0] || "現場特色", `${cta} · ${where}`]
    : [];

  const hashtags = [
    hashTag(data.brandName),
    hashTag(name),
    hashTag(where),
    "#淡江大學",
    "#淡江生活",
    data.goal === "ugc" ? "#淡江日常" : "#淡江社團",
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
    eyebrow: data.goal === "conversion" ? "今晚" : "活動",
    headline,
    subhead,
    body,
    cta,
    captions: [
      { style: "敘事", text: stripForbidden(captionCore, data.forbiddenWords) },
      { style: "短句", text: stripForbidden(`${hook}\n${cta}`, data.forbiddenWords) },
    ],
    hashtags,
    storyBeats,
    carouselPages: pages,
    assetNeeds: [
      { kind: "photo", title: "活動主視覺", detail: `能代表「${name}」的現場或物件，直式優先。`, required: true },
      { kind: "logo", title: "品牌標誌", detail: "透明底或淺底版本，放角落不壓主體。", required: true },
      { kind: "background", title: "留白／材質背景", detail: "給標題頁使用，避免雜亂桌面。", required: false },
      ...(data.wantStory
        ? [{ kind: "people" as const, title: "手部或服務瞬間", detail: "限動第二則用，不要擺拍網紅姿勢。", required: false }]
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
    qaNotes: [
      "淡江學生視角：第一句要像在說我的生活，不先講社團全名",
      "檢查是否太宗教、太嚴肅、太文青或太像 AI",
      "確認看得懂活動在做什麼，時間、地點與參加方式都找得到",
      "讓人看完會想傳給朋友，而不是只看到一則招生廣告",
      `風格維持：${style}`,
    ],
    generatedAt: Date.now(),
    source: "mock",
  };
}
