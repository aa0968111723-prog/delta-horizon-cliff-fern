import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { mockStudioSvg } from "@/lib/zen/mock-image";
import { visionFromHint } from "@/lib/zen/vision-local";
import { systemPrompt } from "@/lib/zen/voice";
import { proposeVisualDirections, type ImageAspect } from "./image-directions";
import type { VisualDirection } from "@/lib/studio/types";

const ImageInput = z.object({
  prompt: z.string().min(1).max(800),
  aspect: z.enum(["4:5", "1:1", "9:16"]).default("4:5"),
  mood: z.string().max(120).optional(),
  headline: z.string().max(80).optional(),
  subhead: z.string().max(80).optional(),
});

function unwrap(input: unknown) {
  return input && typeof input === "object" && "data" in input && (input as { data: unknown }).data
    ? (input as { data: unknown }).data
    : input;
}

export type ImageGenResult =
  | { ok: true; b64: string; prompt: string; mime: "image/png" | "image/svg+xml"; adapter: "live" | "mock" }
  | { ok: false; error: string; adapter: "live" | "none" };

const ASPECT: Record<"4:5" | "1:1" | "9:16", string> = {
  "4:5": "portrait 4:5 Instagram",
  "1:1": "square 1:1",
  "9:16": "vertical 9:16 story",
};

const DirectionsInput = z.object({
  prompt: z.string().min(1).max(800),
  aspect: z.enum(["4:5", "1:1", "9:16"]).default("4:5"),
});

export const proposeStudioDirections = createServerFn({ method: "POST" })
  .validator((input: unknown) => DirectionsInput.parse(unwrap(input)))
  .handler(async ({ data }): Promise<{ ok: true; directions: VisualDirection[]; adapter: "live" | "mock" }> => {
    const local = proposeVisualDirections(data.prompt, data.aspect as ImageAspect);
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: true, directions: local, adapter: "mock" };
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.6,
        max_tokens: 1400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt("image") },
          {
            role: "user",
            content: `為「${data.prompt}」提出 3 個 IG 視覺方向（aspect ${data.aspect}）。先想活動、淡水生活、夜晚、朋友感、品牌色、龜龜、三色光、停留感，不要只說禪風海報。
輸出 JSON：directions[{id,title,concept,palette,composition,typeDirection,imagePrompt,headline,subhead}] 必須 3 個。imagePrompt 用英文攝影描述。headline 可含 \\n。`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: true, directions: local, adapter: "mock" };
    try {
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const parsed = JSON.parse(body.choices?.[0]?.message?.content ?? "{}") as { directions?: VisualDirection[] };
      if (parsed.directions?.length === 3) {
        return {
          ok: true,
          adapter: "live",
          directions: parsed.directions.map((d, i) => ({ ...d, id: d.id || `dir_${i + 1}` })),
        };
      }
    } catch {
      /* keep local */
    }
    return { ok: true, directions: local, adapter: "mock" };
  });

function mockImage(data: z.infer<typeof ImageInput>): Extract<ImageGenResult, { ok: true }> {
  const svg = mockStudioSvg({
    prompt: data.prompt,
    aspect: data.aspect,
    headline: data.headline,
    subhead: data.subhead,
  });
  return {
    ok: true,
    b64: Buffer.from(svg, "utf8").toString("base64"),
    prompt: data.prompt,
    mime: "image/svg+xml",
    adapter: "mock",
  };
}

export const generateStudioImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => ImageInput.parse(unwrap(input)))
  .handler(async ({ data }): Promise<ImageGenResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return mockImage(data);
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
    if (!res.ok) return mockImage(data);
    const body = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
    const b64 = body.data?.[0]?.b64_json;
    if (!b64) return mockImage(data);
    return { ok: true, b64, prompt, mime: "image/png", adapter: "live" };
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
  .validator((input: unknown) => VisionInput.parse(unwrap(input)))
  .handler(async ({ data }): Promise<VisionResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: true, analysis: visionFromHint(data.question) };
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
