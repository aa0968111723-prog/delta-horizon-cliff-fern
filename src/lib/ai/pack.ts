import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clubSystemPrompt, HASHTAG_BANK } from "@/lib/club/identity";
import { academicMoment } from "@/lib/club/season";
import type { CampaignPlan, CopyTone, CreativeDirection, SourceRef } from "@/lib/studio/types";
import { buildZenMockPlan, mockDirections, mockReels, mockStoryFrames, mockStudentSim } from "./pack-mock";
import { extractJson, hasXai, xaiChat } from "./xai";
import { parseFnInput } from "./parse";
import { looksEnglish } from "./zh";
import type { BriefInput } from "./schema";

export type CreativePack = {
  query: string;
  sourceSummary: string;
  sources: SourceRef[];
  studentContext: string;
  directions: CreativeDirection[];
  plan: CampaignPlan;
  copyVariants: { tone: CopyTone; hook: string; body: string; cta: string; hashtags: string[] }[];
  conversions: {
    carousel: CampaignPlan["carouselPages"];
    story: ReturnType<typeof mockStoryFrames>;
    threads: string;
    line: string;
    reels: ReturnType<typeof mockReels>;
  };
  adapter: "live" | "mock";
};

const PackInput = z.object({
  query: z.string().min(1).max(400),
  eventName: z.string().max(200).optional(),
  schedule: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  oneLiner: z.string().max(200).optional(),
  audience: z.string().max(240).optional(),
  sources: z
    .array(
      z.object({
        source: z.preprocess((value) => {
          const allowed = ["drive", "canva", "instagram", "generated", "brand", "upload"] as const;
          return allowed.includes(value as (typeof allowed)[number]) ? value : "brand";
        }, z.enum(["drive", "canva", "instagram", "generated", "brand", "upload"])),
        label: z.string().min(1).max(160),
        id: z.string().max(160).optional(),
      }),
    )
    .max(24)
    .optional()
    .catch([]),
  dnaNotes: z.string().max(2400).optional(),
  inspirationNotes: z.string().max(1200).optional(),
  forceMock: z.boolean().optional(),
});

function briefFromPack(data: z.infer<typeof PackInput>): BriefInput {
  const eventName = data.eventName?.trim() || data.query.trim().slice(0, 40) || "未命名活動";
  return {
    eventName,
    schedule: data.schedule ?? "",
    location: data.location ?? "淡江校園",
    product: eventName,
    offer: "",
    audience: data.audience || "淡江大一新生、住宿生、通勤生、想找一個不用熱場的晚上的人",
    goal: "traffic",
    features: data.oneLiner || "燈光、熱茶、坐著就好",
    style: "生活、口語、夜間",
    notes: data.query,
    wantPost: true,
    wantStory: true,
    wantCarousel: true,
    wantReels: true,
    brandName: "淡江大學禪學社",
    handle: "@tkuzen",
    voice: "自然、短、有溫度。先談生活，再談活動。",
    doSay: "淡江、淡水、宿舍、捷運、坐下來",
    dontSay: "誠摯邀請、修行、年輕人",
    forbiddenWords: ["誠摯邀請", "修行", "開示"],
    slogans: "先坐下來。／不用先懂禪。",
    preferredCtas: "晚上來坐一下／帶一個朋友來就好",
    imageStyle: "夜間三色光、霧亞麻、龜龜配角",
  };
}

function variantsFromPlan(plan: CampaignPlan) {
  const tones: CopyTone[] = ["short", "normal", "emotional", "student", "life", "humor"];
  const hook = plan.hook;
  const when = plan.subhead;
  return tones.map((tone) => {
    const map: Record<CopyTone, string> = {
      short: `${hook}\n${when}`,
      normal: plan.captions[0]?.text ?? hook,
      emotional: `有時候我們需要的不是答案，只是一個安靜的晚上。\n${plan.campaignName}。${when}`,
      student: `課表有了，人還在趕路。\n${hook}\n${when}，帶一個朋友來就好。`,
      life: `捷運上滑完手機，回到宿舍更累。\n${plan.campaignName}只是讓你坐下。\n${when}`,
      humor: `不是要你頓悟。真的只是喝茶。\n${when}`,
    };
    return {
      tone,
      hook,
      body: map[tone],
      cta: plan.cta,
      hashtags: plan.hashtags.length ? plan.hashtags : [...HASHTAG_BANK],
    };
  });
}

export function buildPackFromPlan(
  query: string,
  plan: CampaignPlan,
  sources: SourceRef[],
  adapter: "live" | "mock",
): CreativePack {
  const season = academicMoment();
  const directions = plan.directions?.length ? plan.directions : mockDirections(plan.campaignName);
  return {
    query,
    sourceSummary: sources.length ? `找到 ${sources.length} 個相關素材` : "先用品牌記憶生成",
    sources,
    studentContext: `${season.label}。${season.studentNow}`,
    directions,
    plan: { ...plan, directions, sources },
    copyVariants: variantsFromPlan(plan),
    conversions: {
      carousel: plan.carouselPages,
      story: mockStoryFrames(plan.campaignName, plan.subhead, plan.body),
      threads: plan.threadsPost || `${plan.hook}\n${plan.subhead}`,
      line: plan.lineCopy || `【${plan.campaignName}】${plan.subhead}\n${plan.hook}`,
      reels: plan.reelsScript?.length ? plan.reelsScript : mockReels(plan.campaignName, plan.subhead),
    },
    adapter,
  };
}

function mockPack(query: string, brief: BriefInput, sources: SourceRef[]): CreativePack {
  const directions = mockDirections(brief.eventName);
  const plan = buildZenMockPlan(brief, directions);
  plan.sources = sources;
  plan.studentSim = mockStudentSim({
    hook: plan.hook,
    caption: plan.captions[0]?.text ?? "",
    when: brief.schedule,
    where: brief.location,
    cta: plan.cta,
  });
  return buildPackFromPlan(query, plan, sources, "mock");
}

export const generateCreativePack = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseFnInput(PackInput, input))
  .handler(async ({ data }): Promise<{ ok: true; pack: CreativePack } | { ok: false; error: string }> => {
    const brief = briefFromPack(data);
    const sources = data.sources ?? [];
    try {
      if (!hasXai() || data.forceMock) {
        return { ok: true, pack: mockPack(data.query, brief, sources) };
      }
      const season = academicMoment();
      const prompt = `使用者說：${data.query}
活動名稱：${brief.eventName}
時間：${brief.schedule || "未定"}
地點：${brief.location}
一句話：${brief.features}
參考來源：${sources.map((s) => s.label).join("、") || "品牌記憶"}
${data.dnaNotes ? `品牌與 IG DNA：\n${data.dnaNotes}` : ""}
${data.inspirationNotes ? `靈感抽象（不要抄作品）：\n${data.inspirationNotes}` : ""}

請輸出 JSON：
全程台灣繁體中文口語，禁止英文句子，禁止年輕人／Z世代等抽象客群稱呼。
campaignName, hook, concept, insight, visualTheme, visualDirection, templateId, colorMood,
eyebrow, headline, subhead, body, cta,
captions[{style,text}], hashtags, storyBeats, carouselPages[6],
assetNeeds, checklist, altText, qaNotes,
directions[{id,name,concept,palette,composition,typeDirection,imagePrompt,headline,subhead}] 必須 3 個,
threadsPost, lineCopy,
studentSim{wouldStop,understandable,tooReligious,tooSerious,tooLiterary,tooAi,tooLong,knowsWhat,knowsWhenWhere,wouldBringFriend,knowsHowToJoin,notes,revisions}。`;

      const text = await xaiChat(
        [
          { role: "system", content: clubSystemPrompt(season.label, season.weather) },
          { role: "user", content: prompt },
        ],
        { json: true, maxTokens: 4500 },
      );
      if (!text) return { ok: true, pack: mockPack(data.query, brief, sources) };
      try {
        const raw = extractJson(text) as CampaignPlan & { directions?: CreativeDirection[] };
        const fallback = buildZenMockPlan(brief, mockDirections(brief.eventName));
        const plan: CampaignPlan = {
          ...fallback,
          ...raw,
          captions: raw.captions?.length ? raw.captions : fallback.captions,
          carouselPages: raw.carouselPages?.length ? raw.carouselPages : fallback.carouselPages,
          generatedAt: Date.now(),
          source: "live",
          sources,
          directions: raw.directions?.length === 3 ? raw.directions : fallback.directions,
        };
        if (looksEnglish(`${plan.hook}\n${plan.body}\n${plan.directions?.map((d) => d.concept).join("\n") ?? ""}`)) {
          return { ok: true, pack: mockPack(data.query, brief, sources) };
        }
        return { ok: true, pack: buildPackFromPlan(data.query, plan, sources, "live") };
      } catch {
        return { ok: true, pack: mockPack(data.query, brief, sources) };
      }
    } catch {
      return { ok: true, pack: mockPack(data.query, brief, sources) };
    }
  });
