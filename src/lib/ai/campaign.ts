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
    cta: parsed.cta || "來坐一下",
    captions: parsed.captions.length
      ? parsed.captions
      : [{ style: "學生版", text: parsed.hook || parsed.concept || headline }],
    hashtags: parsed.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)),
    storyBeats: parsed.storyBeats,
    carouselPages: parsed.carouselPages,
    assetNeeds: parsed.assetNeeds,
    checklist: parsed.checklist,
    altText: parsed.altText,
    qaNotes: parsed.qaNotes,
    generatedAt: Date.now(),
    source,
    directions: parsed.directions?.filter((row) => row.name || row.concept),
    waves: parsed.waves?.map((wave) => ({
      ...wave,
      contentKind: asContentKind(wave.contentKind),
    })),
    studentReview: parsed.studentReview ?? undefined,
    reelsScript: parsed.reelsScript?.length ? parsed.reelsScript : undefined,
    threadsPost: parsed.threadsPost ?? undefined,
    lineCopy: parsed.lineCopy ?? undefined,
    sources: parsed.sources?.length ? parsed.sources : undefined,
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
      detail: "會依淡江禪學社品牌記憶與學生情境，生成文案、方向與畫布企劃。",
    };
  }
  return {
    available: false,
    adapter: "mock",
    label: "本機創作草案",
    detail: "目前沒有連到 AI。按下生成會用社團規則寫一版可編輯草案，不是線上模型回覆。",
  };
}

export const getCampaignAiStatus = createServerFn({ method: "POST" }).handler(async (): Promise<AiStatus> => {
  return describeAdapter(grokAvailable());
});

async function generateLive(data: BriefInput): Promise<PlanResult> {
  if (!grokAvailable()) {
    return { ok: true, plan: buildMockPlan(data), adapter: "mock" };
  }

  const ctx = studentContext();
  const forbidden = data.forbiddenWords.filter(Boolean).join("、") || "誠摯邀請您、蒞臨、限時瘋搶";
  const deliverables = [
    data.wantPost ? "單張貼文" : null,
    data.wantCarousel ? "輪播" : null,
    data.wantStory ? "限時動態" : null,
    data.wantReels ? "Reels 封面與腳本" : null,
  ]
    .filter(Boolean)
    .join("、");

  const prompt = `為「${data.brandName} ${data.handle}」做完整網宣企劃。

語氣：${data.voice || "學生感、口語、不說教"}
可說：${data.doSay || "淡江學生生活、坐下來、時間地點"}
不可說：${data.dontSay || "宗教廣告、公文邀請"}
禁用：${forbidden}
標語：${data.slogans || "人到了就好。"}
CTA：${data.preferredCtas || "來坐一下"}
圖片風格：${data.imageStyle || "夜間暖光、三色光、龜龜可入鏡"}

活動：${data.eventName}
時間：${data.schedule || "未填"}
地點：${data.location || "淡江校園"}
內容：${data.product || data.eventName}
補充優惠／條件：${data.offer || "任何人都可以來"}
受眾：${data.audience}
目的：${data.goal}
特色：${data.features || "無"}
風格：${data.style || "無"}
產出：${deliverables || "單張貼文"}
補充：${data.notes || "無"}
學生情境：${ctx.phaseLabel}。${ctx.calendarNote} ${ctx.weatherNote}
過去 IG 成效（用來改善這次，不是報表）：
${data.igLessons || "還沒有足夠成效。先用學生生活問句。"}
記住的風格：${data.styleMemory || "尚無"}。延續社團自己的語氣與畫面，不要改回社團全名當第一句。

Hook 必須像在講學生自己，例如「最近是不是連休息都覺得有罪惡感？」不要「淡江大學禪學社誠摯邀請您」。優先延續過去比較有停留的 Hook 口吻。
${studentReviewInstruction()}

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
    try {
      const live = await generateLive(data);
      if (live.ok) return live;
      return { ok: true, plan: buildMockPlan(data), adapter: "mock" };
    } catch {
      return { ok: true, plan: buildMockPlan(data), adapter: "mock" };
    }
  });
