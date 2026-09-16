import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { CLUB } from "@/lib/club/identity";
import { systemPlanner, studentReviewInstruction } from "@/lib/club/prompts";
import { studentContext } from "@/lib/club/season";
import { extractJson } from "@/lib/ai/json";
import { chatGrok, hasXaiKey } from "@/lib/ai/xai";
import { COPY_TONES, buildCopyPack, type CopyPack, type CopyTone } from "./pack";

export { COPY_INTENTS, COPY_TONES, buildCopyPack, type CopyPack, type CopyTone } from "./pack";

const InputSchema = z.object({
  intent: z.string().max(40),
  idea: z.string().min(1).max(500),
  eventName: z.string().max(120).optional(),
  schedule: z.string().max(80).optional(),
  location: z.string().max(80).optional(),
  tone: z.string().max(20).optional(),
  igLessons: z.string().max(800).optional(),
  forceMock: z.boolean().optional(),
});

export const generateCopyPack = createServerFn({ method: "POST" })
  .validator((input: unknown) => InputSchema.parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input))
  .handler(async ({ data }): Promise<{ ok: true; pack: CopyPack } | { ok: false; error: string }> => {
    const tone = (COPY_TONES.includes(data.tone as CopyTone) ? data.tone : "學生版") as CopyTone;
    if (!hasXaiKey() || data.forceMock) {
      return { ok: true, pack: buildCopyPack(data.idea, tone, data) };
    }
    const ctx = studentContext();
    const result = await chatGrok({
      temperature: 0.75,
      maxTokens: 1800,
      messages: [
        { role: "system", content: systemPlanner(ctx) },
        {
          role: "user",
          content: `寫 IG 文案。意圖：${data.intent}。想法：${data.idea}。活動：${data.eventName || "無"} ${data.schedule || ""} ${data.location || ""}。
指定語氣：${tone}。可切換：${COPY_TONES.join("、")}。
過去 IG 成效：${data.igLessons || "尚無足夠資料，用學生生活問句。"}
回 JSON：tone,hook,body,cta,hashtags[],variants[{tone,hook,body,cta}] 六種語氣,studentReview。
${studentReviewInstruction()}
第一句不要「${CLUB.name}誠摯邀請您」。自然、偶爾口語。`,
        },
      ],
    });
    if (!result.ok) return { ok: false, error: result.error };
    try {
      const parsed = extractJson(result.text) as CopyPack;
      if (!parsed.hook) return { ok: true, pack: buildCopyPack(data.idea, tone, data) };
      return { ok: true, pack: { ...buildCopyPack(data.idea, tone, data), ...parsed, source: "live" } };
    } catch {
      return { ok: false, error: "文案無法解析，請再試一次。" };
    }
  });
