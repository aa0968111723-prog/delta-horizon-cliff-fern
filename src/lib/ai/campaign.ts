import { completeCarouselPages } from "@/lib/studio/carousel";
import { createServerFn } from "@tanstack/react-start";
import type { CampaignPlan, TemplateId } from "@/lib/studio/types";
import { extractJsonObject, grokAvailable, grokChat } from "./grok";
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
  return extractJsonObject(text);
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
  return describeAdapter(grokAvailable());
});

async function generateLive(data: BriefInput): Promise<PlanResult> {
  if (!grokAvailable()) {
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

  const prompt = `你是資深 Instagram 網宣企劃，服務台灣品牌。請只輸出 JSON，不要 markdown。

品牌：${data.brandName} ${data.handle}
語氣：${data.voice || "專業、克制"}
可說：${data.doSay || "具體、真實"}
不可說：${data.dontSay || "誇大、叫賣"}
禁用詞：${forbidden}
固定標語：${data.slogans || "無"}
常用 CTA：${data.preferredCtas || "無"}
圖片風格：${data.imageStyle || "無"}

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

JSON 欄位：
campaignName, concept, insight, hook, visualTheme, visualDirection,
templateId(editorial|product|offer|quote), colorMood,
eyebrow, headline, subhead, body, cta,
captions[{style,text}] 2-3 則（繁中，適合 IG，不要 emoji 堆砌，最多一個表情），
hashtags 8-12 個（含品牌名與精準詞），
storyBeats 3 則限動分鏡（若不需要限動可給空陣列），
carouselPages[{role:cover|problem|detail|proof|cta|close,headline,subhead,body,cta,visualNote,templateId}] ${data.wantCarousel ? "必須 6 頁，角色依序 cover, problem, detail, proof, cta, close" : "1 頁封面"},
assetNeeds[{kind:photo|people|background|logo|illustration,title,detail,required}],
checklist 5-8 則發布前檢查,
altText, qaNotes 2-4 則設計注意。

headline 可含換行 \\n，最多兩行，每行不超過 10 個中文。
eyebrow 用英文或短中文，不超過 22 字。
cta 2-6 字。
文案避免禁用詞，不要「限時瘋搶／錯過就沒有」。
concept 是宣傳核心概念（2-3 句）。visualTheme 是視覺主題。
若品牌是淡江禪學社：語氣像學長姐聊天，禁止宗教說教、佛學專有名詞與 AI 罐頭金句。`;

  const chat = await grokChat({
    system:
      "You are a senior Instagram campaign planner for Taiwan student clubs. Reply with a single JSON object only. Traditional Chinese. No religious preaching.",
    user: prompt,
    maxTokens: 3200,
    temperature: 0.6,
  });

  if (!chat.ok) {
    return {
      ok: false,
      error: chat.capped ? chat.error : `企劃服務暫時無法使用。可改用本機草案。`,
      adapter: "live",
    };
  }

  const plan = planFromModel(chat.text);
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
    const hasKey = grokAvailable();
    if (!hasKey || data.forceMock) {
      return { ok: true, plan: buildMockPlan(data), adapter: "mock" };
    }
    return generateLive(data);
  });
