import { HOOK_EXAMPLES, academicBeat, isZenClubBrief } from "../zen/context.ts";
import { labelDirections } from "../zen/direction.ts";
import { directionsFromResearch, researchInspiration } from "../zen/inspiration.ts";
import { hookFromMemoryHint } from "../zen/memory-hook.ts";
import { proposedHook, tidyCopy } from "../zen/review.ts";
import { goalLabel } from "../studio/goals.ts";
import type { CampaignPlan, CarouselPagePlan, CopyPack, StudentReview, TemplateId, VisualDirection } from "../studio/types.ts";
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
  const where = data.location.trim() || "到店";
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
  const zen = isZenClubBrief(data.brandName, data.audience);
  const learnedHook = hookFromMemoryHint(data.memoryHint);
  const hook = zen
    ? stripForbidden(learnedHook || slogan || HOOK_EXAMPLES[name.length % HOOK_EXAMPLES.length], data.forbiddenWords)
    : stripForbidden(slogan || (offer ? `${name}，${offer}。` : `${name}，只在${when}。`), data.forbiddenWords);
  const concept = stripForbidden(
    `${name}把「${features}」講給${audience}聽。目的是${goalLabel(data.goal)}，語氣維持${style}，不靠叫賣。`,
    data.forbiddenWords,
  );
  const insight = `${audience}要的是可以相信的理由，不是更大聲的促銷。把時間（${when}）與場域（${where}）講清楚，特色只留一句能被記住的。`;
  const visualTheme = data.imageStyle?.trim() || `${style}；主視覺放現場或物件，文字區留白。`;
  const visualDirection = `畫面用品牌色做底，上半主視覺、下半標題。風格：${style}。避免雜訊與浮水印。`;
  const subhead = offer || `${when} · ${where}`;
  const body = zen ? stripForbidden(hook, data.forbiddenWords) : features;
  const captionCore = tidyCopy(
    zen
      ? [hook, `${when}${where ? `，${where}` : ""}`, "想找人一起的話，把這則傳給他。"].filter(Boolean).join("\n")
      : [
          hook,
          `${when}${where ? `，${where}` : ""}`,
          features ? `這次看點：${features}` : "",
          offer ? offer : "",
          slogan ? slogan : "",
        ]
          .filter(Boolean)
          .join("\n"),
  );

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

  const hashtags = zen
    ? [hashTag(data.brandName), hashTag(name), "#淡江", "#淡水", data.goal === "ugc" ? "#開學" : "#淡江社團"].filter(Boolean)
    : [
        hashTag(data.brandName),
        hashTag(name),
        hashTag(where),
        "#到店",
        data.goal === "ugc" ? "#打卡" : "#活動",
      ].filter(Boolean);

  const directions: VisualDirection[] | undefined = zen
    ? labelDirections(
        directionsFromResearch(
          researchInspiration({
            idea: `${name} ${features} ${data.notes} ${data.memoryHint ?? ""}`,
            eventName: name,
            beat: academicBeat(),
          }),
          { eventName: name, hook },
        ),
      )
    : undefined;

  const copyPacks: CopyPack[] | undefined = zen
    ? [
        { tone: "student", hook, body: captionCore, cta, hashtags },
        { tone: "short", hook, body: `${when} ${where}。${cta}`, cta, hashtags },
        { tone: "normal", hook, body: captionCore, cta, hashtags },
        { tone: "emotional", hook, body: `${hook}\n${when}，${where}。`, cta, hashtags },
        { tone: "life", hook, body: `${hook}\n淡水的晚上可以只是坐一下。`, cta, hashtags },
        { tone: "humor", hook, body: `不是要你頓悟，就是來坐一下。\n${when} ${where}`, cta, hashtags },
      ]
    : undefined;

  const studentReview: StudentReview | undefined = zen
    ? {
        wouldStop: "問句比社團全名更容易停。",
        understandable: "活動名與時間有出現。",
        tooReligious: "沒有宗教詞。",
        tooSerious: "語氣偏生活。",
        tooLiterary: "避免再把句子寫成金句。",
        tooAi: "本機草案仍偏工整，進畫布後可再口語化。",
        tooLong: captionCore.length > 280 ? "正文偏長，可再砍。" : "長度還可以。",
        knowsWhat: name,
        knowsWhenWhere: `${when} ${where}`,
        wouldBringFriend: "有『找朋友』空間。",
        knowsHowToSignup: offer || "還要補報名方式。",
        rewriteHook: proposedHook(`${hook}\n${captionCore}`),
        notes: ["時間地點要能被截圖帶走"],
      }
    : undefined;

  return {
    campaignName: name,
    concept: zen
      ? stripForbidden(`${name}是給淡江學生一個晚上坐下來的理由。不要做成宗教廣告。`, data.forbiddenWords)
      : concept,
    insight: zen
      ? `${audience}要的是被允許慢，不是更多活動資訊。把${when}和${where}講清楚。`
      : insight,
    hook,
    visualTheme,
    visualDirection,
    templateId,
    colorMood: visualTheme,
    eyebrow: zen ? when.slice(0, 12) : data.goal === "conversion" ? "LIMITED" : "EVENT",
    headline,
    subhead,
    body,
    cta,
    captions: [
      { style: zen ? "學生版" : "敘事", text: stripForbidden(captionCore, data.forbiddenWords) },
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
    qaNotes: ["避免把價格或焦慮話術放進主畫面", `風格維持：${style}`],
    generatedAt: Date.now(),
    source: "mock",
    directions,
    copyPacks,
    threadsPost: zen ? `${hook}\n${when} ${where}。${cta}` : undefined,
    lineCopy: zen ? `【${name}】\n${when} ${where}\n${cta}` : undefined,
    storyFrames: zen ? [hook, `${name}`, `${when} ${where}`, cta] : undefined,
    reelsScript: zen
      ? {
          hook,
          beats: [
            { start: "0", end: "3", onScreen: "光或呼吸，字極少", caption: hook, voice: hook, transition: "切", assetHint: "三色光夜底" },
            { start: "3", end: "7", onScreen: "淡水或校園走廊", caption: "人可以慢", voice: "課表很滿的時候", transition: "淡", assetHint: "淡水暮色／校園" },
            { start: "7", end: "12", onScreen: "座位、茶、燈", caption: name, voice: `${name}是一個可以坐下的晚上`, transition: "切", assetHint: "歷屆茶會或燈光" },
            { start: "12", end: "17", onScreen: "空一個位子", caption: "可以自己來", voice: "也可以揪人", transition: "切", assetHint: "同學互動局部" },
            { start: "17", end: "20", onScreen: "時間地點", caption: `${when} ${where}`, voice: cta, transition: "切", assetHint: "主視覺最後一格" },
          ],
        }
      : data.wantReels
        ? {
            hook,
            beats: [
              { start: "0", end: "3", onScreen: "主視覺", caption: hook, voice: hook, transition: "切", assetHint: "主視覺" },
              { start: "3", end: "12", onScreen: "現場", caption: name, voice: features, transition: "切", assetHint: "現場" },
              { start: "12", end: "20", onScreen: "時間地點", caption: cta, voice: `${when} ${where}`, transition: "切", assetHint: "主視覺" },
            ],
          }
        : undefined,
    studentReview,
  };
}
