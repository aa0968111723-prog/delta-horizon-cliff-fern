import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { zenSystemPrompt } from "@/lib/zen/context";
import { hookFromMemoryHint } from "@/lib/zen/memory-hook";
import { waveLabel } from "@/lib/zen/schedule";
import { studentReviewOf } from "@/lib/zen/review";
import { mockWaveDraft, WAVE_ANGLE, type WaveDraft } from "./wave-draft";

export type { WaveDraft } from "./wave-draft";
export { mockWaveDraft, waveToPack } from "./wave-draft";

function parseWaveInput(input: unknown) {
  const schema = z.object({
    kind: z.enum(["warmup", "emotion", "hero", "detail", "reason", "countdown", "dayof", "recap"]),
    name: z.string().min(1).max(80),
    schedule: z.string().max(80).optional(),
    location: z.string().max(80).optional(),
    idea: z.string().max(240).optional(),
    memoryHint: z.string().max(1200).optional(),
    twist: z.enum(["rewrite", "visual", "angle"]).optional(),
    forceMock: z.boolean().optional(),
  });
  if (input && typeof input === "object" && "data" in input) {
    const inner = (input as { data: unknown }).data;
    if (inner && typeof inner === "object" && "kind" in inner) return schema.parse(inner);
  }
  return schema.parse(input);
}

export const regenerateCampaignWave = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseWaveInput(input))
  .handler(async ({ data }): Promise<{ ok: true; draft: WaveDraft; reviewNotes: string[] } | { ok: false; error: string }> => {
    const mock = mockWaveDraft({ ...data, learnedHook: hookFromMemoryHint(data.memoryHint) });
    if (data.twist === "angle") {
      mock.hook = "有時候我們需要的不是答案，只是一個安靜的晚上。";
      mock.angle = "換角度：少提活動，多提身體狀態。";
    }
    if (data.twist === "visual") {
      mock.visualNote = "換視覺：淡水夜、座位、三色光，不要海報牆。";
    }
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey || data.forceMock) {
      const review = studentReviewOf(`${mock.hook}\n${mock.body}`, data.schedule ?? "", data.location ?? "");
      return { ok: true, draft: mock, reviewNotes: review.notes };
    }
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.7,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: zenSystemPrompt() },
          {
            role: "user",
            content: `重寫活動「${data.name}」的「${waveLabel(data.kind)}」波次。角度：${WAVE_ANGLE[data.kind]}。時間：${data.schedule || ""} 地點：${data.location || ""} 想法：${data.idea || ""} 變化：${data.twist || "rewrite"}。JSON:{kind,title,hook,body,cta,visualNote,angle}`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false, error: `這波暫時無法重寫（${res.status}）。` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    try {
      const parsed = JSON.parse(body.choices?.[0]?.message?.content ?? "{}") as Partial<WaveDraft>;
      const draft: WaveDraft = { ...mock, ...parsed, kind: data.kind };
      const review = studentReviewOf(`${draft.hook}\n${draft.body}`, data.schedule ?? "", data.location ?? "");
      return { ok: true, draft, reviewNotes: review.notes };
    } catch {
      return { ok: false, error: "這波無法解析，可再用本機草案。" };
    }
  });
