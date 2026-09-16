import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { localIgReading, type IgDna } from "@/lib/studio/ig-dna";
import type { IgHistoryReading } from "@/lib/studio/types";
import { aiAvailable, buildZenContext, extractJson, zenChat } from "./zen-context";

const HistorySchema = z.object({
  captions: z.array(z.string().max(800)).max(16).catch([]),
  hooks: z.array(z.string().max(200)).max(12).catch([]),
  hashtags: z.array(z.string().max(40)).max(16).catch([]),
  ctas: z.array(z.string().max(80)).max(10).catch([]),
  kinds: z.array(z.string().max(40)).max(12).catch([]),
  captionAvg: z.number().min(0).max(4000).catch(0),
  sampleCount: z.number().min(0).max(400).catch(0),
  insightsText: z.string().max(1200).optional(),
  brandMemoryText: z.string().max(2500).optional(),
  forceLocal: z.boolean().optional(),
});

export type IgHistoryInput = z.infer<typeof HistorySchema>;

export type IgHistoryResult =
  | { ok: true; reading: IgHistoryReading; adapter: "live" | "local"; note?: string }
  | { ok: false; error: string; reading: IgHistoryReading; adapter: "local" };

const ReadingJsonSchema = z.object({
  voice: z.string().catch(""),
  continueWith: z.array(z.string()).max(6).catch([]),
  avoid: z.array(z.string()).max(6).catch([]),
  nextPost: z.string().catch(""),
});

function unwrap<T>(input: unknown, schema: z.ZodType<T>): T {
  if (input && typeof input === "object" && "data" in input) {
    return schema.parse((input as { data: unknown }).data);
  }
  return schema.parse(input);
}

function dnaFromInput(data: IgHistoryInput): IgDna {
  return {
    captionLength: { min: 0, max: 0, avg: data.captionAvg },
    topHashtags: data.hashtags.map((tag) => ({ tag, count: 1 })),
    topCtas: data.ctas.map((cta) => ({ cta, count: 1 })),
    kinds: data.kinds.map((kind) => ({ kind, count: 1 })),
    colors: [],
    hookStarts: data.hooks,
    sampleCount: data.sampleCount,
  };
}

function localFrom(data: IgHistoryInput): IgHistoryReading {
  return localIgReading(dnaFromInput(data));
}

/**
 * 讀這個帳號自己做過的內容。有金鑰就請模型整理語氣與該延續的習慣；
 * 沒有金鑰就用統計結果整理一版本機摘要，不編造成效數字。
 */
export const analyzeIgHistory = createServerFn({ method: "POST" })
  .validator((input: unknown) => unwrap(input, HistorySchema))
  .handler(async ({ data }): Promise<IgHistoryResult> => {
    const fallback = localFrom(data);
    if (data.forceLocal || !aiAvailable()) {
      return { ok: true, reading: fallback, adapter: "local" };
    }

    const samples = data.captions
      .map((caption, index) => `${index + 1}. ${caption}`)
      .join("\n");
    const prompt = [
      buildZenContext({
        brandMemoryText: data.brandMemoryText,
        insightsText: data.insightsText,
      }),
      "",
      "【任務】讀這個帳號自己做過的內容，整理成下一次生成要延續的 IG DNA。",
      "不要發明按讚、觸及、收藏。沒寫在成效裡的數字就不要寫。",
      `樣本 ${data.sampleCount} 則`,
      data.captionAvg ? `文案平均約 ${data.captionAvg} 字` : "",
      data.hooks.length ? `用過的開頭：${data.hooks.join("／")}` : "",
      data.hashtags.length ? `常用標籤：${data.hashtags.join(" ")}` : "",
      data.ctas.length ? `常用行動：${data.ctas.join("、")}` : "",
      data.kinds.length ? `常用型態：${data.kinds.join("、")}` : "",
      samples ? `【過去內容】\n${samples}` : "還沒有足夠的過去內容。",
      "",
      "輸出 JSON：{voice, continueWith[], avoid[], nextPost}",
      "voice：一句話描述這個帳號現在聽起來像誰在說話。",
      "continueWith：最多 4 句，具體到開頭、長度、行動句或畫面。",
      "avoid：最多 4 句，這個帳號不該再變成什麼。",
      "nextPost：下一篇現在就可以做的內容，一句話。",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await zenChat({ prompt, maxTokens: 900, temperature: 0.4 });
    if (!res.ok) {
      return {
        ok: false,
        error: res.error === "no-key" ? "目前沒有連上 AI" : res.error,
        reading: fallback,
        adapter: "local",
      };
    }

    try {
      const parsed = ReadingJsonSchema.parse(extractJson(res.text));
      const voice = parsed.voice.trim();
      if (!voice) {
        return { ok: false, error: "AI 回傳無法解析。", reading: fallback, adapter: "local" };
      }
      return {
        ok: true,
        reading: {
          voice,
          continueWith: parsed.continueWith.map((item) => item.trim()).filter(Boolean).slice(0, 4),
          avoid: parsed.avoid.map((item) => item.trim()).filter(Boolean).slice(0, 4),
          nextPost: parsed.nextPost.trim(),
          analyzedAt: Date.now(),
          sampleCount: data.sampleCount,
          adapter: "live",
        },
        adapter: "live",
      };
    } catch {
      return { ok: false, error: "AI 回傳無法解析。", reading: fallback, adapter: "local" };
    }
  });
