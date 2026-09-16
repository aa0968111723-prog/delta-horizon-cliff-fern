import { completeCarouselPages } from "@/lib/studio/carousel";
import { createServerFn } from "@tanstack/react-start";
import type { CampaignPlan, TemplateId } from "@/lib/studio/types";
import { completeCopyVariants, systemPrompt } from "@/lib/zen/voice";
import { buildMockPlan } from "./mock";
import { BriefInputSchema, PlanJsonSchema, type BriefInput } from "./schema";

export type PlanResult =
  | {
      ok: true;
      plan: CampaignPlan;
      adapter: "live" | "mock";
    }
  | { ok: false; error: string; adapter: "live" | "mock" };

export type AiStatus = {
  available: boolean;
  adapter: "live" | "mock";
  label: string;
  detail: string;
};

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1] : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("模型未回傳 JSON");
  return JSON.parse(raw.slice(start, end + 1));
}

function toPlan(parsed: ReturnType<typeof PlanJsonSchema.parse>, source: CampaignPlan["source"]): CampaignPlan {
  const headline = parsed.headline || parsed.hook || parsed.campaignName;
  const campaignName = parsed.campaignName || headline.replace(/\n/g, " ") || "未命名活動";
  return {
    campaignName,
    concept: parsed.concept || parsed.insight,
    insight: parsed.insight,
    hook: parsed.hook || headline,
    visualTheme: parsed.visualTheme || parsed.colorMood,
    visualDirection: parsed.visualDirection,
    templateId: parsed.templateId as TemplateId,
    colorMood: parsed.colorMood || parsed.visualTheme,
    eyebrow: parsed.eyebrow,
    headline,
    subhead: parsed.subhead,
    body: parsed.body,
    cta: parsed.cta || "了解更多",
    captions: completeCopyVariants({
      hook: parsed.hook || headline,
      body: parsed.body || parsed.insight || parsed.hook || headline,
      cta: parsed.cta || "了解更多",
      variants: parsed.captions,
    }),
    hashtags: parsed.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)),
    storyBeats: parsed.storyBeats,
    carouselPages: parsed.carouselPages,
    assetNeeds: parsed.assetNeeds,
    checklist: parsed.checklist,
    altText: parsed.altText,
    qaNotes: parsed.qaNotes,
    generatedAt: Date.now(),
    source,
    visualDirections: parsed.visualDirections?.length
      ? parsed.visualDirections.map((d, i) => ({ ...d, id: d.id || `dir_${i + 1}` }))
      : undefined,
    threadsPost: parsed.threadsPost,
    lineCopy: parsed.lineCopy,
    reelsScript: parsed.reelsScript,
    studentReview: parsed.studentReview,
    citedSources: parsed.citedSources,
  };
}

function planFromModel(text: string): CampaignPlan | null {
  try {
    const parsed = PlanJsonSchema.parse(extractJson(text));
    const plan = toPlan(parsed, "live");
    if (!plan.headline && !plan.concept) return null;
    return plan;
  } catch {
    return null;
  }
}

export function describeAdapter(available: boolean): AiStatus {
  if (available) {
    return {
      available: true,
      adapter: "live",
      label: "已連線 AI 企劃",
      detail: "會依品牌規範與活動需求生成結構化企劃，再套進專案與畫布。",
    };
  }
  return {
    available: false,
    adapter: "mock",
    label: "本機企劃草案",
    detail: "目前沒有連到 AI 服務。按下生成會用本機規則寫一版可編輯、可套用的草案，不是線上模型回覆。",
  };
}

export const getCampaignAiStatus = createServerFn({ method: "POST" }).handler(async (): Promise<AiStatus> => {
  return describeAdapter(Boolean(process.env.XAI_API_KEY));
});

async function generateLive(data: BriefInput): Promise<PlanResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return { ok: true, plan: buildMockPlan(data), adapter: "mock" };
  }

  const forbidden = data.forbiddenWords.filter(Boolean).join("、") || "無";
  const deliverables = [
    data.wantPost ? "單張貼文" : null,
    data.wantCarousel ? "輪播" : null,
    data.wantStory ? "限時動態" : null,
    data.wantReels ? "Reels" : null,
    data.wantThreads ? "Threads" : null,
    data.wantLine ? "LINE 宣傳圖" : null,
  ]
    .filter(Boolean)
    .join("、");

  const prompt = `${systemPrompt("campaign", { dnaNotes: data.dnaNotes })}

請只輸出 JSON。

品牌：${data.brandName} ${data.handle}
語氣：${data.voice || "像社團的人在發文"}
可說：${data.doSay || "生活、具體、淡江學生"}
不可說：${data.dontSay || "誠摯邀請、說教"}
禁用詞：${forbidden}
固定標語：${data.slogans || "無"}
常用 CTA：${data.preferredCtas || "晚上見／找一個朋友來"}
圖片風格：${data.imageStyle || "夜色、留白、空氣感"}
吉祥物與燈光：讀品牌記憶裡的龜龜、三色光。

活動名稱：${data.eventName}
時間：${data.schedule || "未填"}
地點：${data.location || "淡江大學淡水校園"}
內容：${data.product || data.eventName}
邀請：${data.offer || "無"}
受眾：${data.audience || "淡江大學學生"}
目的：${data.goal}
特色：${data.features || "無"}
希望風格：${data.style || "生活"}
需要產出：${deliverables || "單張貼文"}
補充：${data.notes || "無"}
Creative Memory / 歷屆素材摘錄：
${data.memoryNotes?.trim() || "無（仍須讀品牌記憶：龜龜、三色光、淡江學生語氣）"}
citedSources 只能標你真正看到的 Drive / Canva / Instagram / Brand 來源，不要假裝讀過沒給的檔案。

JSON 欄位：
campaignName, concept, insight, hook, visualTheme, visualDirection,
templateId(editorial|product|offer|quote), colorMood,
eyebrow, headline, subhead, body, cta,
captions[{style,text}] 含 短版/一般版/感性版/學生版/生活版/幽默版 至少三則，
hashtags 6-10 個（#淡江禪學社 #淡江 #淡水 可納入）,
storyBeats 3-5 則，第一則必須是 Hook,
carouselPages[{role:cover|problem|detail|proof|cta|close,headline,subhead,body,cta,visualNote,templateId}] ${data.wantCarousel ? "必須 6 頁；cover.headline 必須是 Hook 問句，不要活動名當第一句" : "1 頁封面"},
assetNeeds[{kind:photo|people|background|logo|illustration,title,detail,required}],
checklist, altText, qaNotes,
threadsPost, lineCopy,
reelsScript[{startSec,endSec,visual,caption,voiceover,transition,assetHint}] 5 段 0-20 秒,
studentReview{wouldStop,understandable,tooReligious,tooSerious,tooLiterary,tooAi,tooLong,knowsWhat,knowsWhenWhere,wouldBringFriend,knowsSignup,notes,rewriteHook},
visualDirections[{id,title,concept,palette,composition,typeDirection,imagePrompt,headline,subhead}] 必須 3 個方向,
citedSources[{source:drive|canva|instagram|generated|brand,label,detail}]。

hook 必須像在講學生自己，禁止「誠摯邀請您」。
headline 可含 \\n，最多兩行，每行不超過 10 字。
cta 2-6 字。`;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.7,
      max_tokens: 5000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Reply with a single JSON object only. Traditional Chinese.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `企劃服務暫時無法使用（${res.status}）。可改用本機草案。`, adapter: "live" };
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content ?? "";
  const plan = planFromModel(text);
  if (!plan) {
    return { ok: false, error: "AI 回傳無法解析。可再試一次，或改用本機草案。", adapter: "live" };
  }
  if (data.wantCarousel) {
    plan.carouselPages = completeCarouselPages(plan.carouselPages, plan);
  }
  return { ok: true, plan, adapter: "live" };
}

function parseBriefInput(input: unknown) {
  if (input && typeof input === "object" && "data" in input) {
    const inner = (input as { data: unknown }).data;
    if (inner && typeof inner === "object" && "eventName" in inner) {
      return BriefInputSchema.parse(inner);
    }
  }
  return BriefInputSchema.parse(input);
}

export const generateCampaignPlan = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseBriefInput(input))
  .handler(async ({ data }): Promise<PlanResult> => {
    const hasKey = Boolean(process.env.XAI_API_KEY);
    if (!hasKey || data.forceMock) {
      return { ok: true, plan: buildMockPlan(data), adapter: "mock" };
    }
    return generateLive(data);
  });
