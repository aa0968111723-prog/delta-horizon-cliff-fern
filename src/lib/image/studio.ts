import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { systemPlanner } from "@/lib/club/prompts";
import { studentContext } from "@/lib/club/season";
import { extractJson } from "@/lib/ai/json";
import { chatGrok, editImage, hasXaiKey, imagineImage } from "@/lib/ai/xai";
import { moodFromVariation, posterDataUrl } from "@/lib/image/poster";
import type { CreativeDirection, FormatId } from "@/lib/studio/types";

const DirectionInput = z.object({
  idea: z.string().min(1).max(400),
  eventName: z.string().max(120).optional(),
  formatId: z.enum(["feed-square", "feed-portrait", "story", "reels-cover", "threads", "line-promo"]).optional(),
  forceMock: z.boolean().optional(),
});

export function mockDirections(idea: string, eventName = ""): CreativeDirection[] {
  const title = eventName || idea.slice(0, 10);
  return [
    {
      id: "dir_a",
      name: "坐下",
      concept: "學生生活問句＋室內暖光。",
      palette: "宣紙、苔綠",
      composition: "上半光或人，下半字",
      typeDirection: "兩行大標",
      imagePrompt: `Quiet Tamkang university evening, student sitting, warm paper light, soft cyan amber rose glow, not temple, not golden, editorial photo, space for Chinese headline, idea: ${idea}, event: ${title}`,
      headline: "最近是不是很久沒坐下來？",
      subhead: title,
    },
    {
      id: "dir_b",
      name: "淡水晚上",
      concept: "捷運風 → 教室燈。",
      palette: "水光、暖光",
      composition: "深色上緣，字在安全區",
      typeDirection: "短標＋時間",
      imagePrompt: `Tamsui night after MRT, wind, then indoor club lights, naturalistic Taiwan campus, ${idea}, ${title}, no cyberpunk neon`,
      headline: "風比較大的晚上",
      subhead: title,
    },
    {
      id: "dir_c",
      name: "帶朋友",
      concept: "兩人側影，降低第一次壓力。",
      palette: "玫瑰光、宣紙",
      composition: "人物不要正臉網紅",
      typeDirection: "口語一句",
      imagePrompt: `two college students sitting together in a dim campus room, small turtle motif, candid, ${idea}, ${title}, photoreal, not AI-smooth skin`,
      headline: "帶朋友來也可以",
      subhead: title,
    },
  ];
}

export const generateImageDirections = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    DirectionInput.parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input),
  )
  .handler(async ({ data }) => {
    if (!hasXaiKey() || data.forceMock) {
      return { ok: true as const, adapter: "mock" as const, directions: mockDirections(data.idea, data.eventName) };
    }
    const ctx = studentContext();
    const result = await chatGrok({
      maxTokens: 1600,
      messages: [
        { role: "system", content: systemPlanner(ctx) },
        {
          role: "user",
          content: `為「${data.idea}」提出 3 個 IG 視覺方向。活動：${data.eventName || "無"}。尺寸：${data.formatId || "feed-portrait"}。
每個方向要想：活動主題、學生情境、淡水、夜晚、校園、壓力、朋友感、品牌色、龜龜、三色光、IG 停留感。
不要只給「禪風海報」。
JSON：{directions:[{id,name,concept,palette,composition,typeDirection,imagePrompt,headline,subhead}]}`,
        },
      ],
    });
    if (!result.ok) return { ok: false as const, error: result.error };
    try {
      const parsed = extractJson(result.text) as { directions?: CreativeDirection[] };
      const directions = parsed.directions?.filter((row) => row.imagePrompt) ?? [];
      if (directions.length < 1) {
        return { ok: true as const, adapter: "mock" as const, directions: mockDirections(data.idea, data.eventName) };
      }
      return { ok: true as const, adapter: "live" as const, directions };
    } catch {
      return { ok: false as const, error: "視覺方向無法解析" };
    }
  });

const RenderInput = z.object({
  prompt: z.string().min(8).max(1200),
  n: z.number().min(1).max(3).optional(),
  editUrls: z.array(z.string().min(8)).max(3).optional(),
  variation: z.enum(["regen", "compose", "mood", "background", "style", "text"]).optional(),
  headline: z.string().max(80).optional(),
  eventName: z.string().max(80).optional(),
  schedule: z.string().max(80).optional(),
  location: z.string().max(80).optional(),
  forceMock: z.boolean().optional(),
});

export const generateStudioImage = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    RenderInput.parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input),
  )
  .handler(async ({ data }) => {
    const prompt = `${data.prompt}. Variation: ${data.variation ?? "regen"}. Natural Taiwan university students, Tamsui/Tamkang feeling, soft tricolor lights, not religious temple poster, not overly AI-smooth.`;
    const composed = posterDataUrl({
      hook: data.headline || "最近是不是很久沒有好好坐下來？",
      eventName: data.eventName,
      schedule: data.schedule,
      location: data.location,
      mood: moodFromVariation(data.variation),
    });
    if (!hasXaiKey() || data.forceMock) {
      return { ok: true as const, urls: [composed], adapter: "compose" as const };
    }
    if (data.editUrls?.length) {
      const edited = await editImage({ prompt, imageUrls: data.editUrls });
      if (!edited.ok) return { ok: true as const, urls: [composed], adapter: "compose" as const };
      return { ok: true as const, urls: edited.urls, adapter: "live" as const };
    }
    const imagined = await imagineImage({ prompt, n: data.n ?? 1 });
    if (!imagined.ok) return { ok: true as const, urls: [composed], adapter: "compose" as const };
    return { ok: true as const, urls: imagined.urls, adapter: "live" as const };
  });

export type AspectPreset = { id: FormatId; label: string };

export const IMAGE_ASPECTS: AspectPreset[] = [
  { id: "feed-portrait", label: "IG 4:5" },
  { id: "feed-square", label: "IG 1:1" },
  { id: "story", label: "Story 9:16" },
  { id: "reels-cover", label: "Reels Cover" },
  { id: "threads", label: "Threads" },
  { id: "line-promo", label: "LINE 宣傳圖" },
];
