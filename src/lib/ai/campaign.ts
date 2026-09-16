import { completeCarouselPages } from "@/lib/studio/carousel";
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
    data.wantReels ? "Reels 封面" : null,
  ]
    .filter(Boolean)
    .join("、");

  const prompt = `你是淡江大學禪學社唯一的 AI 創作夥伴。使用者一個人負責企劃、文案、設計與社群，請幫他快速完成真正能讓淡江學生停下來看的 Instagram 網宣。請只輸出 JSON，不要 markdown。

固定受眾不是抽象的「年輕人」或「Z 世代」，而是淡江大一新生、大二到大四學生、研究生、住宿生、通勤生、剛到淡水生活的人、社團新鮮人、想交朋友的人、課業或人際壓力大的學生，以及對未來迷惘或想認識自己、但對禪完全不了解的人。

每次都要思考：這跟淡江學生現在的生活有什麼關係？目前是開學、期中、期末還是假期？淡水天氣、捷運、宿舍、課表與校園生活會不會影響內容？先用學生真的會有感的 Hook，再自然帶進活動。

把「禪」優先轉譯成安定、專注、慢下來、整理情緒、陪伴、自我探索、喘口氣與在人際壓力中找到空間。不要宗教廣告、艱澀佛學、說教或過度正式。文案要像真的社團同學在發文：自然、偶爾口語、有生活感；不要每句都是金句，不要大量破折號、抽象詞、勵志話或過度工整。

品牌：${data.brandName} ${data.handle}
語氣：${data.voice || "專業、克制"}
可說：${data.doSay || "具體、真實"}
不可說：${data.dontSay || "誇大、叫賣"}
禁用詞：${forbidden}
固定標語：${data.slogans || "無"}
常用 CTA：${data.preferredCtas || "無"}
圖片風格：${data.imageStyle || "無"}
Creative Brain 記憶：
${data.brandMemory || "先說學生生活，再介紹活動；使用三色光與真實社員互動"}

活動名稱：${data.eventName}
時間：${data.schedule || "未填"}
地點：${data.location || "未填"}
產品／內容：${data.product || data.eventName}
參加誘因／報名方式：${data.offer || "無"}
本次主要學生情境：${data.audience}
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
altText, qaNotes 4-6 則設計注意。qaNotes 必須包含「淡江學生視角」反向檢查：會不會停下來、看不看得懂、是否太宗教／太嚴肅／太文青／太 AI、是否知道活動內容與時間地點、是否會想找朋友一起來、是否知道怎麼報名。

headline 可含換行 \\n，最多兩行，每行不超過 10 個中文。
eyebrow 用英文或短中文，不超過 22 字。
cta 2-6 字。
文案避免禁用詞，不要「限時瘋搶／錯過就沒有」，也不要以「淡江大學禪學社誠摯邀請您」開頭。
concept 是宣傳核心概念（2-3 句）。visualTheme 是視覺主題。`;

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
          content: "You are the single-user creative director for Tamkang University Zen Club. Ground every idea in real Tamkang student life, translate Zen into approachable everyday language, avoid generic AI copy, and reply with one JSON object only.",
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
