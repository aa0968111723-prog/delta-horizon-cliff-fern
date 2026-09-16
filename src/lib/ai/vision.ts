import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clubSystemPrompt } from "@/lib/club/identity";
import { academicMoment } from "@/lib/club/season";
import { extractJson, hasXai, xaiChat } from "./xai";
import { parseFnInput } from "./parse";

const VisionInput = z
  .object({
    imageDataUrl: z.string().min(20).max(4_500_000).optional(),
    imageUrl: z.string().url().max(500).optional(),
    note: z.string().max(200).optional(),
  })
  .refine((value) => Boolean(value.imageDataUrl || value.imageUrl), { message: "需要圖片" });

export type VisionReport = {
  scene: string;
  people: string;
  color: string;
  light: string;
  composition: string;
  typeShare: string;
  hierarchy: string;
  brandFit: string;
  studentFit: string;
  stay: string;
  tooReligious: boolean;
  tooOld: boolean;
  tooAi: boolean;
  next: string[];
  imagePrompt: string;
};

const fallback: VisionReport = {
  scene: "畫面偏生活，有光與留白。",
  people: "未確認是否有清楚臉孔。",
  color: "低飽和、帶一點暖光。",
  light: "柔、不要閃光燈感。",
  composition: "主體在中上，下半可放字。",
  typeShare: "若有字，需檢查是否過密。",
  hierarchy: "先看圖再看字會比較像 IG。",
  brandFit: "可延續三色光與霧亞麻，避免寺廟金。",
  studentFit: "看起來像同學生活，會比宗教海報更容易停。",
  stay: "光與人物比標語更能停。",
  tooReligious: false,
  tooOld: false,
  tooAi: false,
  next: ["延續這個風格", "做成限動", "做成 Carousel", "做成 Reels Cover", "生成相似視覺"],
  imagePrompt:
    "Same mood, Tamkang student life, airy night light, not temple, not monk, IG 4:5, cinematic still",
};

export const analyzeImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseFnInput(VisionInput, input))
  .handler(async ({ data }): Promise<{ ok: true; report: VisionReport } | { ok: false; error: string }> => {
    if (!hasXai()) return { ok: true, report: fallback };
    try {
      const season = academicMoment();
      const content = [
        {
          type: "text",
          text: `${data.note || "分析這張圖，給淡江禪學社網宣用。"}
輸出 JSON：scene,people,color,light,composition,typeShare,hierarchy,brandFit,studentFit,stay,tooReligious,tooOld,tooAi,next[5],imagePrompt。
用生活語言。`,
        },
        { type: "image_url", image_url: { url: data.imageUrl ?? data.imageDataUrl ?? "" } },
      ];
      const text = await xaiChat(
        [
          { role: "system", content: clubSystemPrompt(season.label, season.weather) },
          { role: "user", content },
        ],
        { json: true, maxTokens: 1200 },
      );
      if (!text) return { ok: true, report: fallback };
      try {
        const report = { ...fallback, ...(extractJson(text) as Partial<VisionReport>) };
        return { ok: true, report };
      } catch {
        return { ok: true, report: fallback };
      }
    } catch {
      return { ok: true, report: fallback };
    }
  });
