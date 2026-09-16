import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { describeAdapter, type AiStatus } from "./campaign";
import { extractJsonObject, grokAvailable, grokChat } from "./grok";
import {
  auditStudentPerspective,
  buildLocalCreativeWave,
  convertContentMultimodal,
  type CreativeWaveContext,
  type MultimodalConversionResult,
  type StudentPerspectiveAudit,
  type ZenVisualDirection,
} from "@/lib/studio/zen-prompt-engine";
import { analyzeZenImageVisual, type ImageVisionAnalysis } from "@/lib/studio/image-analyzer";

const DirectionIdSchema = z.enum(["direction-a", "direction-b", "direction-c"]);

const PaletteSchema = z.object({
  name: z.string().catch(""),
  hex: z.string().catch("#1E3A4C"),
});

const DirectionJsonSchema = z.object({
  id: DirectionIdSchema.catch("direction-a"),
  name: z.string().catch(""),
  concept: z.string().catch(""),
  colorPalette: z.array(PaletteSchema).max(5).catch([]),
  composition: z.string().catch(""),
  typography: z.string().catch(""),
  imagePrompt: z.string().catch(""),
  headline: z.string().catch(""),
  subhead: z.string().catch(""),
  atmosphere: z.string().catch(""),
  aspectRatio: z.enum(["4:5", "1:1", "9:16"]).catch("4:5"),
});

const WaveJsonSchema = z.object({
  directions: z.array(DirectionJsonSchema).min(1).max(3).catch([]),
  hook: z.string().catch(""),
  caption: z.string().catch(""),
  cta: z.string().catch(""),
});

export const CreativeWaveInputSchema = z.object({
  topic: z.string().min(1).max(200),
  date: z.string().max(80).optional(),
  location: z.string().max(120).optional(),
  studentPain: z.string().max(240).optional(),
  cta: z.string().max(80).optional(),
  details: z.string().max(400).optional(),
  forceMock: z.boolean().optional(),
});

export type CreativeWaveInput = z.infer<typeof CreativeWaveInputSchema>;

export type CreativeWave = {
  directions: ZenVisualDirection[];
  conversion: MultimodalConversionResult;
  audit: StudentPerspectiveAudit;
};

export type CreativeWaveResult =
  | { ok: true; wave: CreativeWave; adapter: "live" | "mock" }
  | { ok: false; error: string; adapter: "live" | "mock" };

const FALLBACK_PALETTE: ZenVisualDirection["colorPalette"] = [
  { name: "淡水夜青", hex: "#1E3A4C" },
  { name: "暖宣紙白", hex: "#F7F6F2" },
  { name: "晨曦暖光", hex: "#D97736" },
];

function asDirection(raw: z.infer<typeof DirectionJsonSchema>, index: number, local: ZenVisualDirection): ZenVisualDirection {
  const ids = ["direction-a", "direction-b", "direction-c"] as const;
  const palette = raw.colorPalette.filter((c) => /^#([0-9a-fA-F]{6})$/.test(c.hex)).slice(0, 3);
  return {
    id: raw.id || ids[index] || local.id,
    name: raw.name || local.name,
    concept: raw.concept || local.concept,
    colorPalette: palette.length ? palette : local.colorPalette.length ? local.colorPalette : FALLBACK_PALETTE,
    composition: raw.composition || local.composition,
    typography: raw.typography || local.typography,
    imagePrompt: raw.imagePrompt || local.imagePrompt,
    headline: raw.headline || local.headline,
    subhead: raw.subhead || local.subhead,
    atmosphere: raw.atmosphere || local.atmosphere,
    aspectRatio: raw.aspectRatio || local.aspectRatio,
  };
}

export function assembleWaveFromDirections(
  ctx: CreativeWaveContext,
  directions: ZenVisualDirection[],
  extras?: { caption?: string; cta?: string },
): CreativeWave {
  const selected = directions[0];
  const conversion = convertContentMultimodal({
    topic: ctx.topic,
    headline: selected.headline,
    caption: extras?.caption ?? "",
    date: ctx.date,
    location: ctx.location,
  });
  if (extras?.cta) conversion.igPost.cta = extras.cta;
  else if (ctx.cta) conversion.igPost.cta = ctx.cta;
  const audit = auditStudentPerspective({
    headline: selected.headline,
    caption: conversion.igPost.caption,
    cta: conversion.igPost.cta,
    location: ctx.location,
    time: ctx.date,
  });
  return { directions, conversion, audit };
}

export function parseLiveWave(text: string, ctx: CreativeWaveContext): CreativeWave | null {
  try {
    const parsed = WaveJsonSchema.parse(extractJsonObject(text));
    const local = buildLocalCreativeWave(ctx);
    if (!parsed.directions.length) return null;
    const merged = [0, 1, 2].map((i) => {
      const live = parsed.directions[i];
      const fallback = local.directions[i] ?? local.directions[0];
      return live ? asDirection(live, i, fallback) : fallback;
    }) as ZenVisualDirection[];
    const uniqueIds = new Set(merged.map((d) => d.id));
    if (uniqueIds.size < 3) {
      merged[0].id = "direction-a";
      merged[1].id = "direction-b";
      merged[2].id = "direction-c";
    }
    return assembleWaveFromDirections(ctx, merged, {
      caption: parsed.caption || undefined,
      cta: parsed.cta || ctx.cta,
    });
  } catch {
    return null;
  }
}

const SYSTEM = `你是淡江大學禪學社一人網宣的學生文案。只輸出 JSON。
語氣像學長姐在淡水校園聊天：穩定、陪伴、自我探索。禁止宗教說教、佛學專有名詞、學術腔、AI 罐頭金句（如綻放生命、攜手共進、靈魂盛宴）。
受眾是淡江學生（大一新生、克難坡通勤、宿舍、期中）。可用克難坡、宮燈、淡水雨、紅線捷運、活動中心等生活場景。`;

function parseWaveInput(input: unknown): CreativeWaveInput {
  if (input && typeof input === "object" && "data" in input) {
    const inner = (input as { data: unknown }).data;
    if (inner && typeof inner === "object" && "topic" in inner) {
      return CreativeWaveInputSchema.parse(inner);
    }
  }
  return CreativeWaveInputSchema.parse(input);
}

async function generateLive(data: CreativeWaveInput): Promise<CreativeWaveResult> {
  const ctx: CreativeWaveContext = {
    topic: data.topic,
    date: data.date,
    location: data.location,
    studentPain: data.studentPain,
    cta: data.cta,
    details: data.details,
  };
  const prompt = `主題：${data.topic}
時間：${data.date || "未填"}
地點：${data.location || "未填"}
學生痛點：${data.studentPain || "未填"}
CTA：${data.cta || "主頁連結預約"}
補充：${data.details || "無"}

請產出 3 個互不重複的 IG 視覺方向（A 生活暖光、B 淡水夜青、C 年輕插畫龜龜）。
JSON 欄位：
directions[{id:direction-a|direction-b|direction-c,name,concept,colorPalette[{name,hex}],composition,typography,imagePrompt(英文攝影/插畫prompt，禁止文字與宗教符號),headline(最多兩行用\\n),subhead,atmosphere,aspectRatio:4:5|1:1|9:16}],
hook, caption(繁中IG內文，少emoji), cta
headline 每行不超過 12 字。colorPalette 用真實 hex。`;

  const chat = await grokChat({
    system: SYSTEM,
    user: prompt,
    maxTokens: 2200,
    temperature: 0.65,
  });
  if (!chat.ok) {
    return { ok: false, error: chat.capped ? chat.error : `創意服務暫時無法使用。可改用本機草案。`, adapter: "live" };
  }
  const wave = parseLiveWave(chat.text, ctx);
  if (!wave) {
    return { ok: false, error: "AI 回傳無法解析。可再試一次，或改用本機草案。", adapter: "live" };
  }
  return { ok: true, wave, adapter: "live" };
}

export const generateZenCreativeWave = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseWaveInput(input))
  .handler(async ({ data }): Promise<CreativeWaveResult> => {
    const ctx: CreativeWaveContext = data;
    if (!grokAvailable() || data.forceMock) {
      return { ok: true, wave: buildLocalCreativeWave(ctx), adapter: "mock" };
    }
    return generateLive(data);
  });

export const getZenCreativeStatus = createServerFn({ method: "POST" }).handler(async (): Promise<AiStatus> => {
  return describeAdapter(grokAvailable());
});

const AnalyzeInputSchema = z.object({
  name: z.string().min(1).max(160),
  category: z.string().max(40).optional(),
  tags: z.array(z.string().max(40)).max(16).optional(),
  forceMock: z.boolean().optional(),
});

export type AnalyzeAssetResult =
  | { ok: true; analysis: ImageVisionAnalysis; adapter: "live" | "mock" }
  | { ok: false; error: string; adapter: "live" | "mock" };

function parseAnalyzeInput(input: unknown) {
  if (input && typeof input === "object" && "data" in input) {
    const inner = (input as { data: unknown }).data;
    if (inner && typeof inner === "object" && "name" in inner) {
      return AnalyzeInputSchema.parse(inner);
    }
  }
  return AnalyzeInputSchema.parse(input);
}

export const analyzeCreativeAsset = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseAnalyzeInput(input))
  .handler(async ({ data }): Promise<AnalyzeAssetResult> => {
    const local = analyzeZenImageVisual(data.name, data.category ?? "photo");
    if (!grokAvailable() || data.forceMock) {
      return { ok: true, analysis: local, adapter: "mock" };
    }
    const chat = await grokChat({
      system: SYSTEM,
      user: `分析這張淡江禪學社素材，只輸出 JSON。
檔名：${data.name}
分類：${data.category || "photo"}
標籤：${(data.tags ?? []).join("、") || "無"}
JSON：{contentSummary,detectedElements[],colorPalette[{hex,name}],lighting,composition,textToImageRatio,visualHierarchy,brandFitScore,studentRelevanceScore,stopScrollingScore,critique:{isTooReligious,isTooOldFashioned,isTooAiFlavored,fitsTamkangStudents,feedbackList[]},adaptationActions[{id,label,description,targetFormat}]}
分數 0-100。adaptationActions 給 4-5 個可執行延伸（做成 carousel/story/reels/同風格）。`,
      maxTokens: 1400,
      temperature: 0.3,
    });
    if (!chat.ok) {
      return { ok: false, error: chat.error, adapter: "live" };
    }
    try {
      const raw = extractJsonObject(chat.text) as ImageVisionAnalysis;
      if (!raw || typeof raw.contentSummary !== "string") {
        return { ok: false, error: "AI 回傳無法解析。", adapter: "live" };
      }
      return {
        ok: true,
        adapter: "live",
        analysis: {
          ...local,
          ...raw,
          adaptationActions: raw.adaptationActions?.length ? raw.adaptationActions : local.adaptationActions,
          colorPalette: raw.colorPalette?.length ? raw.colorPalette : local.colorPalette,
          critique: { ...local.critique, ...(raw.critique ?? {}) },
        },
      };
    } catch {
      return { ok: false, error: "AI 回傳無法解析。", adapter: "live" };
    }
  });
