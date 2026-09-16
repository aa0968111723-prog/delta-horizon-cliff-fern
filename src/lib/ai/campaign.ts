import { completeCarouselPages } from "@/lib/studio/carousel";
import { zenSystemPrompt } from "@/lib/zen/context";
import { labelDirections } from "@/lib/zen/direction";
import { createServerFn } from "@tanstack/react-start";
import type { CampaignPlan, TemplateId } from "@/lib/studio/types";
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
    captions: parsed.captions.length
      ? parsed.captions
      : [{ style: "敘事", text: parsed.hook || parsed.concept || headline }],
    hashtags: parsed.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)),
    storyBeats: parsed.storyBeats,
    carouselPages: parsed.carouselPages,
    assetNeeds: parsed.assetNeeds,
    checklist: parsed.checklist,
    altText: parsed.altText,
    qaNotes: parsed.qaNotes,
    generatedAt: Date.now(),
    source,
    directions: parsed.directions?.length ? labelDirections(parsed.directions) : undefined,
    copyPacks: parsed.copyPacks?.length ? parsed.copyPacks : undefined,
    threadsPost: parsed.threadsPost || undefined,
    lineCopy: parsed.lineCopy || undefined,
    reelsScript: parsed.reelsScript,
    studentReview: parsed.studentReview,
    storyFrames: parsed.storyFrames?.length ? parsed.storyFrames : undefined,
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
      label: "已連線創作 AI",
      detail: "會依淡江禪學社品牌記憶與學生情境生成文案、視覺方向與排程草案。",
    };
  }
  return {
    available: false,
    adapter: "mock",
    label: "本機創作草案",
    detail: "目前沒有連到 AI 服務。按下生成會用本機規則寫一版可編輯草案，不是線上模型回覆。",
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
    data.wantReels ? "Reels 封面" : null,
  ]
    .filter(Boolean)
    .join("、");

  const prompt = `請只輸出 JSON，不要 markdown。

品牌：${data.brandName} ${data.handle}
語氣：${data.voice || "像社團的人在傳訊息"}
可說：${data.doSay || "坐下來、淡水晚上、找朋友"}
不可說：${data.dontSay || "誠摯邀請、宗教說教"}
禁用詞：${forbidden}
固定標語：${data.slogans || "無"}
常用 CTA：${data.preferredCtas || "來坐一下"}
圖片風格：${data.imageStyle || "夜晚、空氣感、三色光"}

活動名稱：${data.eventName}
時間：${data.schedule || "未填"}
地點：${data.location || "未填"}
產品／內容：${data.product || data.eventName}
優惠：${data.offer || "無"}
受眾：${data.audience}
目的：${data.goal}
特色：${data.features || "無"}
希望風格：${data.style || "無"}
需要產出：${deliverables || "單張貼文"}
補充：${data.notes || "無"}
過去 IG 表現：${data.memoryHint || "問句 Hook 與生活向收藏較高"}

靈感只抽象構圖、配色、排版、Hook、形式，禁止抄其他社團貼文。視覺方向要轉成淡江禪學社自己的晚上、座位、三色光。

Hook 必須先讓淡江學生覺得「這好像在講我」，禁止「誠摯邀請您」。
文案自然、偶爾口語，不要每句金句、不要過度詩意。

JSON 欄位：
campaignName, concept, insight, hook, visualTheme, visualDirection,
templateId(editorial|product|offer|quote), colorMood,
eyebrow, headline, subhead, body, cta,
captions[{style,text}] 至少含 學生版、短版、感性版，
hashtags 8-12 個（含淡江、社團、精準活動詞），
storyBeats 3-5 則限動分鏡（若不需要限動可給空陣列），
carouselPages[{role:cover|problem|detail|proof|cta|close,headline,subhead,body,cta,visualNote,templateId}] ${data.wantCarousel ? "必須 6 頁，角色依序 cover, problem, detail, proof, cta, close" : "1 頁封面"},
assetNeeds[{kind:photo|people|background|logo|illustration,title,detail,required}],
checklist 5-8 則發布前檢查,
altText, qaNotes 2-4 則設計注意,
threadsPost, lineCopy,
storyFrames 3-5 則,
directions[{id,name,concept,palette,composition,typeDirection,prompt,headline,subhead}] 3 個視覺方向，name 必須是「方向 A · …」「方向 B · …」「方向 C · …」,
copyPacks[{tone:short|normal|emotional|student|life|humor,hook,body,cta,hashtags}],
reelsScript:{hook,beats:[{start,end,onScreen,caption,voice,transition,assetHint}]},
studentReview:{wouldStop,understandable,tooReligious,tooSerious,tooLiterary,tooAi,tooLong,knowsWhat,knowsWhenWhere,wouldBringFriend,knowsHowToSignup,rewriteHook,notes[]}

headline 可含換行 \\n，最多兩行，每行不超過 10 個中文。
eyebrow 短中文或日期，不超過 22 字。
cta 2-6 字，像「來坐一下」。`;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.6,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: zenSystemPrompt(),
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
