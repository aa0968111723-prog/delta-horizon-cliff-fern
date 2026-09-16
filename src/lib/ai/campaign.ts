import { createServerFn } from "@tanstack/react-start";
import { clubSystemPrompt } from "@/lib/club/identity";
import { academicMoment } from "@/lib/club/season";
import { completeCarouselPages } from "@/lib/studio/carousel";
import type { CampaignPlan } from "@/lib/studio/types";
import { buildZenMockPlan, mockDirections } from "./pack-mock";
import { BriefInputSchema, PlanJsonSchema, type BriefInput } from "./schema";
import { buildMockPlan } from "./mock";
import { extractJson, hasXai, xaiChat } from "./xai";

export type PlanResult =
  | { ok: true; plan: CampaignPlan; adapter: "live" | "mock"; sourceSummary?: string }
  | { ok: false; error: string; adapter: "live" | "mock" };

export type AiStatus = {
  available: boolean;
  adapter: "live" | "mock";
  label: string;
  detail: string;
};

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
    templateId: parsed.templateId as CampaignPlan["templateId"],
    colorMood: parsed.colorMood || parsed.visualTheme,
    eyebrow: parsed.eyebrow,
    headline,
    subhead: parsed.subhead,
    body: parsed.body,
    cta: parsed.cta || "晚上來坐一下",
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
      label: "AI 創作已連線",
      detail: "會讀品牌記憶與淡江學生情境，生成文案、方向與企劃。",
    };
  }
  return {
    available: false,
    adapter: "mock",
    label: "本機創作草案",
    detail: "目前沒有連到 AI 服務。仍會依淡江禪學社語氣寫一版可編輯草案。",
  };
}

export const getCampaignAiStatus = createServerFn({ method: "POST" }).handler(async (): Promise<AiStatus> => {
  return describeAdapter(hasXai());
});

function zenish(data: BriefInput) {
  return /禪|淡江|茶會|禪光/.test(`${data.brandName}${data.eventName}${data.audience}`);
}

async function generateLive(data: BriefInput): Promise<PlanResult> {
  const season = academicMoment();
  const forbidden = data.forbiddenWords.filter(Boolean).join("、") || "誠摯邀請、修行、開示";
  const deliverables = [
    data.wantPost ? "單張貼文" : null,
    data.wantCarousel ? "輪播" : null,
    data.wantStory ? "限時動態" : null,
    data.wantReels ? "Reels 封面" : null,
  ]
    .filter(Boolean)
    .join("、");

  const prompt = `品牌：${data.brandName} ${data.handle}
語氣：${data.voice}
可說：${data.doSay}
不可說：${data.dontSay}
禁用：${forbidden}
標語：${data.slogans || "先坐下來。"}
CTA：${data.preferredCtas || "晚上來坐一下"}
圖片風格：${data.imageStyle || "夜間、生活、三色光、龜龜配角"}

活動名稱：${data.eventName}
時間：${data.schedule || "未填"}
地點：${data.location || "淡江校園"}
內容：${data.product || data.eventName}
補充優惠：${data.offer || "無"}
受眾：${data.audience}
目的：${data.goal}
特色：${data.features || "無"}
風格：${data.style || "生活"}
產出：${deliverables || "單張貼文"}
筆記：${data.notes || "無"}

JSON 欄位：
campaignName, concept, insight, hook, visualTheme, visualDirection,
templateId(editorial|product|offer|quote), colorMood,
eyebrow, headline, subhead, body, cta,
captions[{style,text}] 學生版/短版/生活版，
hashtags 8-12（含淡江禪學社、淡江大學、淡水），
storyBeats 3-5，
carouselPages[{role:cover|problem|detail|proof|cta|close,headline,subhead,body,cta,visualNote,templateId}] ${data.wantCarousel ? "必須 6 頁" : "1 頁封面"},
assetNeeds[{kind:photo|people|background|logo|illustration,title,detail,required}],
checklist, altText, qaNotes。

hook 必須是生活問句，禁止「誠摯邀請」。headline 最多兩行，每行 ≤ 10 字。cta 2-8 字。`;

  const text = await xaiChat(
    [
      { role: "system", content: clubSystemPrompt(season.label, season.weather) },
      { role: "user", content: prompt },
    ],
    { maxTokens: 4096, json: true },
  );
  if (!text) {
    return { ok: false, error: "企劃服務暫時無法使用。可改用本機草案。", adapter: "live" };
  }
  const plan = planFromModel(text);
  if (!plan) {
    return { ok: true, plan: buildMockPlan(data), adapter: "mock" };
  }
  if (data.wantCarousel) {
    plan.carouselPages = completeCarouselPages(plan.carouselPages, plan);
  }
  plan.directions = mockDirections(plan.campaignName);
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

function mockPlanResult(data: BriefInput): PlanResult {
  const directions = mockDirections(data.eventName);
  const plan = zenish(data) ? buildZenMockPlan(data, directions) : buildMockPlan(data);
  plan.directions = directions;
  return { ok: true, plan, adapter: "mock" };
}

export const generateCampaignPlan = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseBriefInput(input))
  .handler(async ({ data }): Promise<PlanResult> => {
    try {
      if (!hasXai() || data.forceMock) return mockPlanResult(data);
      const live = await generateLive(data);
      if (live.ok) return live;
      return mockPlanResult(data);
    } catch {
      return mockPlanResult(data);
    }
  });
