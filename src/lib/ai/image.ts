import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { systemPrompt } from "@/lib/zen/voice";

const ImageInput = z.object({
  prompt: z.string().min(1).max(800),
  aspect: z.enum(["4:5", "1:1", "9:16"]).default("4:5"),
  mood: z.string().max(120).optional(),
});

export type ImageGenResult =
  | { ok: true; b64: string; prompt: string; mime: "image/png" }
  | { ok: false; error: string; adapter: "live" | "none" };

const ASPECT: Record<"4:5" | "1:1" | "9:16", string> = {
  "4:5": "portrait 4:5 Instagram",
  "1:1": "square 1:1",
  "9:16": "vertical 9:16 story",
};

export const generateStudioImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const inner =
      input && typeof input === "object" && "data" in input && (input as { data: unknown }).data
        ? (input as { data: unknown }).data
        : input;
    return ImageInput.parse(inner);
  })
  .handler(async ({ data }): Promise<ImageGenResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "目前沒有連到圖像服務。可先用文案與視覺方向，稍後再生成。", adapter: "none" };
    }
    const prompt = `${data.prompt}. ${ASPECT[data.aspect]}. Tamkang University Tamsui campus mood, airy, photographic, soft night lights cyan amber rose, students, not a temple, not incense, not golden Buddha, not plastic AI skin, not gothic. ${data.mood ?? ""}`;
    const res = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-imagine-image",
        prompt,
        n: 1,
        response_format: "b64_json",
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `圖像生成暫時無法使用（${res.status}）。`, adapter: "live" };
    }
    const body = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
    const b64 = body.data?.[0]?.b64_json;
    if (!b64) {
      return { ok: false, error: "沒有收到圖像。", adapter: "live" };
    }
    return { ok: true, b64, prompt, mime: "image/png" };
  });

const VisionInput = z.object({
  imageDataUrl: z.string().min(20).max(8_000_000),
  question: z.string().max(400).optional(),
});

export type VisionAnalysis = {
  content: string;
  people: string;
  color: string;
  light: string;
  composition: string;
  typeRatio: string;
  brand: string;
  student: string;
  stay: string;
  tooReligious: string;
  tooOld: string;
  tooAi: string;
  next: string[];
};

export type VisionResult =
  | { ok: true; analysis: VisionAnalysis }
  | { ok: false; error: string };

export const analyzeStudioImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const inner =
      input && typeof input === "object" && "data" in input && (input as { data: unknown }).data
        ? (input as { data: unknown }).data
        : input;
    return VisionInput.parse(inner);
  })
  .handler(async ({ data }): Promise<VisionResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: true,
        analysis: {
          content: "本機無法看圖。請在已連線環境再試。",
          people: "—",
          color: "可對照品牌苔綠、沙色、暖光。",
          light: "—",
          composition: "—",
          typeRatio: "—",
          brand: "未知",
          student: "未知",
          stay: "未知",
          tooReligious: "請人工看一次是否像寺廟。",
          tooOld: "—",
          tooAi: "—",
          next: ["延續這個風格", "做成限動", "做成 Carousel", "生成相似視覺"],
        },
      };
    }
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.4,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt("vision") },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${data.question || "分析這張圖是否適合淡江禪學社 IG。"} 輸出 JSON：content, people, color, light, composition, typeRatio, brand, student, stay, tooReligious, tooOld, tooAi, next[]（延續風格／重設計／限動／Carousel／Reels Cover／相似視覺）`,
              },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false, error: `圖像理解暫時無法使用（${res.status}）。` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    try {
      const analysis = JSON.parse(body.choices?.[0]?.message?.content ?? "{}") as VisionAnalysis;
      if (!analysis.content) return { ok: false, error: "無法解析分析。" };
      return { ok: true, analysis };
    } catch {
      return { ok: false, error: "無法解析分析。" };
    }
  });
