import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clubSystemPrompt, HASHTAG_BANK, HOOK_BANK } from "@/lib/club/identity";
import { academicMoment } from "@/lib/club/season";
import type { CopyTone } from "@/lib/studio/types";
import { extractJson, hasXai, xaiChat } from "./xai";
import { parseFnInput } from "./parse";

const CopyInput = z.object({
  topic: z.string().min(1).max(300),
  kind: z.string().max(40).optional(),
  tone: z.enum(["short", "normal", "emotional", "student", "life", "humor"]).optional(),
  when: z.string().max(80).optional(),
  where: z.string().max(80).optional(),
  forceMock: z.boolean().optional(),
});

export type CopyBlock = {
  tone: CopyTone;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
};

function mockCopy(topic: string, tone: CopyTone, when?: string, where?: string): CopyBlock {
  const hook = HOOK_BANK[tone === "humor" ? 6 : 3];
  const loc = [when, where].filter(Boolean).join(" · ");
  const bodies: Record<CopyTone, string> = {
    short: `${hook}\n${loc || topic}`,
    normal: `${hook}\n\n${topic}\n${loc}\n想來的話帶一個朋友就好。`,
    emotional: `有時候我們需要的不是答案，只是一個安靜的晚上。\n${topic}\n${loc}`,
    student: `課表有了，人還在趕路。\n${hook}\n${loc}`,
    life: `捷運上滑完，宿舍燈還亮著。\n${topic}只是讓你坐下。\n${loc}`,
    humor: `不是要你頓悟，真的只是喝茶。\n${loc || topic}`,
  };
  return {
    tone,
    hook,
    body: bodies[tone],
    cta: "晚上來坐一下",
    hashtags: [...HASHTAG_BANK],
  };
}

export const generateCopy = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseFnInput(CopyInput, input))
  .handler(async ({ data }): Promise<{ ok: true; copies: CopyBlock[] } | { ok: false; error: string }> => {
    const tones: CopyTone[] = data.tone ? [data.tone] : ["short", "normal", "emotional", "student", "life", "humor"];
    const mocked = () => tones.map((tone) => mockCopy(data.topic, tone, data.when, data.where));
    try {
      if (!hasXai() || data.forceMock) {
        return { ok: true, copies: mocked() };
      }
      const season = academicMoment();
      const text = await xaiChat(
        [
          { role: "system", content: clubSystemPrompt(season.label, season.weather) },
          {
            role: "user",
            content: `為「${data.topic}」寫 IG 文案，類型 ${data.kind || "活動"}，時間 ${data.when || "未定"}，地點 ${data.where || "淡江"}。
輸出 JSON {copies:[{tone,hook,body,cta,hashtags}]} tones=${tones.join(",")}。
hook 必須是生活問句。禁止誠摯邀請。`,
          },
        ],
        { json: true, maxTokens: 1800 },
      );
      if (!text) return { ok: true, copies: mocked() };
      try {
        const parsed = extractJson(text) as { copies?: CopyBlock[] };
        if (parsed.copies?.length) return { ok: true, copies: parsed.copies };
      } catch {
        /* fall through */
      }
      return { ok: true, copies: mocked() };
    } catch {
      return { ok: true, copies: mocked() };
    }
  });
