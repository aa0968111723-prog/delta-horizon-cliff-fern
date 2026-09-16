import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clubSystemPrompt } from "@/lib/club/identity";
import { academicMoment } from "@/lib/club/season";
import { buildConvertKit, type ConvertKit } from "./convert-kit";
import { extractJson, hasXai, xaiChat } from "./xai";
import { parseFnInput } from "./parse";
import { looksEnglish } from "./zh";

const ConvertInput = z.object({
  title: z.string().min(1).max(120),
  hook: z.string().max(160).optional(),
  body: z.string().max(800).optional(),
  when: z.string().max(80).optional(),
  where: z.string().max(80).optional(),
  cta: z.string().max(40).optional(),
  forceMock: z.boolean().optional(),
});

export type ConvertResult = ConvertKit & { adapter: "live" | "mock" };

export const convertContent = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseFnInput(ConvertInput, input))
  .handler(async ({ data }): Promise<ConvertResult & { ok: true }> => {
    const fallback = buildConvertKit(data);
    try {
      if (!hasXai() || data.forceMock) {
        return { ok: true, ...fallback, adapter: "mock" };
      }
      const season = academicMoment();
      const text = await xaiChat(
        [
          { role: "system", content: clubSystemPrompt(season.label, season.weather) },
          {
            role: "user",
            content: `把這篇轉成多平台，不要變成招生連發。
標題：${data.title}
Hook：${data.hook || ""}
正文：${data.body || ""}
時間：${data.when || ""}
地點：${data.where || "淡江校園"}
CTA：${data.cta || "晚上來坐一下"}
台灣繁體中文口語。禁止誠摯邀請、年輕人、英文句子。
Carousel 五頁：1 Hook 2 情境 3 痛點 4 活動內容 5 CTA（時間地點在最後）。
Story 3–5 張。Reels 五段 0–3、3–7、7–12、12–17、17–20 秒，含 visual,caption,voice,transition,assetHint。
輸出 JSON {carousel:[{role,title,body}],story:[{headline,body,visualNote,cta}],threads,line,reels:[{start,end,visual,caption,voice,transition,assetHint}]}。`,
          },
        ],
        { json: true, maxTokens: 1800 },
      );
      if (!text) return { ok: true, ...fallback, adapter: "mock" };
      const raw = extractJson(text) as Partial<ConvertKit>;
      const kit: ConvertKit = {
        carousel: raw.carousel?.length === 5 ? raw.carousel : fallback.carousel,
        story: raw.story?.length ? raw.story : fallback.story,
        threads: raw.threads || fallback.threads,
        line: raw.line || fallback.line,
        reels: raw.reels?.length === 5 ? raw.reels : fallback.reels,
      };
      if (looksEnglish(`${kit.carousel[0]?.title ?? ""}\n${kit.threads}`)) {
        return { ok: true, ...fallback, adapter: "mock" };
      }
      return { ok: true, ...kit, adapter: "live" };
    } catch {
      return { ok: true, ...fallback, adapter: "mock" };
    }
  });
