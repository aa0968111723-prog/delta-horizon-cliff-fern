import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { systemPlanner } from "@/lib/club/prompts";
import { studentContext } from "@/lib/club/season";
import { extractJson } from "@/lib/ai/json";
import { chatGrok, editImage, hasXaiKey, imagineImage } from "@/lib/ai/xai";
import { moodFromVariation, posterDataUrl } from "@/lib/image/poster";
import { formatById } from "@/lib/studio/formats";
import { directionsOrMock, mockDirections } from "@/lib/image/directions";
import { quotedHookFromLessons } from "@/lib/club/insights";
import type { CreativeDirection, FormatId } from "@/lib/studio/types";

export { directionsOrMock, mockDirections };

const DirectionInput = z.object({
  idea: z.string().min(1).max(400),
  eventName: z.string().max(120).optional(),
  formatId: z.enum(["feed-square", "feed-portrait", "story", "reels-cover", "threads", "line-promo"]).optional(),
  igLessons: z.string().max(800).optional(),
  styleMemory: z.string().max(400).optional(),
  relatedNotes: z.string().max(400).optional(),
  forceMock: z.boolean().optional(),
});

export const generateImageDirections = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    DirectionInput.parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input),
  )
  .handler(async ({ data }) => {
    const learnedHook = quotedHookFromLessons(data.igLessons || "");
    const extra = {
      formatId: data.formatId,
      styleMemory: data.styleMemory,
      relatedNotes: data.relatedNotes,
    };
    if (!hasXaiKey() || data.forceMock) {
      return { ok: true as const, adapter: "mock" as const, directions: mockDirections(data.idea, data.eventName, learnedHook, extra) };
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
不要只給「禪風海報」。優先延續社團自己的 IG DNA 與相關素材，不要複製舊排版。
記住的風格：${data.styleMemory || "尚無"}。
相關素材來源：${data.relatedNotes || "Brand Memory / 龜龜與三色光"}。
過去 IG 成效：${data.igLessons || "尚無足夠資料，用學生生活問句。"}
JSON：{directions:[{id,name,concept,palette,composition,typeDirection,imagePrompt,headline,subhead}]}`,
        },
      ],
    });
    if (!result.ok) {
      return { ok: true as const, adapter: "mock" as const, directions: mockDirections(data.idea, data.eventName, learnedHook, extra) };
    }
    try {
      const parsed = extractJson(result.text) as { directions?: CreativeDirection[] };
      const directions = directionsOrMock(data.idea, data.eventName, parsed.directions, learnedHook, extra);
      const live = Boolean(parsed.directions?.some((row) => row.imagePrompt && row.headline));
      return { ok: true as const, adapter: live ? ("live" as const) : ("mock" as const), directions };
    } catch {
      return { ok: true as const, adapter: "mock" as const, directions: mockDirections(data.idea, data.eventName, learnedHook, extra) };
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
  formatId: z.enum(["feed-square", "feed-portrait", "story", "reels-cover", "threads", "line-promo"]).optional(),
  relatedNotes: z.string().max(400).optional(),
  forceMock: z.boolean().optional(),
});

export const generateStudioImage = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    RenderInput.parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input),
  )
  .handler(async ({ data }) => {
    const prompt = `${data.prompt}. Variation: ${data.variation ?? "regen"}. ${data.relatedNotes ? `Extend these sources, do not copy: ${data.relatedNotes}.` : ""} Natural Taiwan university students, Tamsui/Tamkang feeling, soft tricolor lights, not religious temple poster, not overly AI-smooth.`;
    const format = data.formatId ? formatById(data.formatId) : formatById("feed-portrait");
    const composed = posterDataUrl({
      hook: data.headline || "最近是不是很久沒有好好坐下來？",
      eventName: data.eventName,
      schedule: data.schedule,
      location: data.location,
      mood: moodFromVariation(data.variation),
      width: format.width,
      height: format.height,
    });
    if (!hasXaiKey() || data.forceMock) {
      return { ok: true as const, urls: [composed], adapter: "compose" as const };
    }
    if (data.editUrls?.length) {
      const edited = await editImage({ prompt, imageUrls: data.editUrls });
      if (edited.ok) return { ok: true as const, urls: edited.urls, adapter: "live" as const };
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
