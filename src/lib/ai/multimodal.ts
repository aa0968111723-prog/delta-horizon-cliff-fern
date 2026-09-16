import { createServerFn } from "@tanstack/react-start";
import { Buffer } from "node:buffer";
import { z } from "zod";
import type { AssetAnalysis } from "@/lib/studio/types";

const AspectRatioSchema = z.enum(["4:5", "1:1", "9:16"]);

const GenerateRequestSchema = z.object({
  idea: z.string().trim().min(3).max(500),
  direction: z.string().trim().min(3).max(800),
  aspectRatio: AspectRatioSchema,
  brandMemory: z.string().max(2400).optional(),
});

const VisionRequestSchema = z.object({
  dataUrl: z.string().startsWith("data:image/").max(4_000_000),
});

const EditRequestSchema = VisionRequestSchema.extend({
  instruction: z.string().trim().min(3).max(600),
  aspectRatio: AspectRatioSchema,
});

const AnalysisSchema = z.object({
  summary: z.string(),
  subjects: z.array(z.string()).max(12),
  colors: z.array(z.string()).max(8),
  lighting: z.string(),
  composition: z.string(),
  textHierarchy: z.string(),
  brandFit: z.string(),
  studentFit: z.string(),
  stopPower: z.string(),
  risks: z.array(z.string()).max(10),
  recommendations: z.array(z.string()).max(10),
  suggestedTags: z.array(z.string()).max(15),
});

type ImageApiResponse = {
  data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string }>;
};

function apiHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.XAI_API_KEY}`,
  };
}

function creativePrompt(idea: string, direction: string, brandMemory?: string) {
  return `為淡江大學禪學社製作 Instagram 主視覺。活動／想法：${idea}
視覺方向：${direction}
Creative Brain 記憶：${brandMemory || "三色光、龜龜、真實社員互動；先連結淡江學生生活"}
受眾是正在經歷課表、通勤、宿舍、人際與課業壓力的淡江學生。畫面要明亮、舒服、年輕、有淡水與校園生活感，以深湖綠、暖珊瑚、柔金為品牌色提示。把禪轉譯成喘口氣、陪伴與認識自己，不要宗教法器、佛像、廟宇、蓮花堆砌、老氣海報或通用企業素材。保留清楚的文字安全區，但不要在圖片內生成任何文字、Logo 或浮水印。自然攝影感與有意識的構圖，適合手機 IG 停留。`;
}

async function imageResult(response: Response) {
  if (!response.ok) throw new Error(`圖片服務暫時無法使用（${response.status}）`);
  const body = await response.json() as ImageApiResponse;
  const item = body.data?.[0];
  if (item?.b64_json) {
    return { base64: item.b64_json, mime: "image/jpeg", revisedPrompt: item.revised_prompt };
  }
  if (item?.url) {
    const downloaded = await fetch(item.url);
    if (!downloaded.ok) throw new Error("圖片已生成，但暫時無法下載");
    const mime = downloaded.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    const bytes = Buffer.from(await downloaded.arrayBuffer()).toString("base64");
    return { base64: bytes, mime, revisedPrompt: item.revised_prompt };
  }
  throw new Error("圖片服務沒有回傳可用圖片");
}

function extractResponseText(body: unknown) {
  const response = body as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  if (response.output_text) return response.output_text;
  return response.output
    ?.flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" || item.type === "text")
    .map((item) => item.text ?? "")
    .join("\n") ?? "";
}

function extractJson(text: string) {
  const raw = text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("視覺分析沒有回傳完整結果");
  return JSON.parse(raw.slice(start, end + 1));
}

export const getMultimodalStatus = createServerFn({ method: "GET" }).handler(async () => ({
  available: Boolean(process.env.XAI_API_KEY),
}));

export const generateCreativeImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => GenerateRequestSchema.parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input))
  .handler(async ({ data }) => {
    if (!process.env.XAI_API_KEY) return { ok: false as const, error: "這個環境尚未開放 AI 圖片服務" };
    try {
      const prompt = creativePrompt(data.idea, data.direction, data.brandMemory);
      const response = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          model: "grok-imagine-image-2.0",
          prompt,
          n: 1,
          aspect_ratio: data.aspectRatio,
          resolution: "1k",
          quality: "medium",
          response_format: "b64_json",
        }),
      });
      return { ok: true as const, image: await imageResult(response), prompt };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "圖片生成失敗" };
    }
  });

export async function runVisionAnalysis(dataUrl: string) {
  if (!process.env.XAI_API_KEY) return { ok: false as const, error: "這個環境尚未開放 AI 圖片分析" };
  try {
    const response = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({
        model: "grok-4.5",
        store: false,
        max_output_tokens: 1800,
        input: [{
          role: "user",
          content: [
            {
              type: "input_text",
              text: `你是淡江大學禪學社的 Visual Director。分析這張素材能否用於面向淡江學生的 IG。只輸出 JSON，欄位：
summary, subjects[], colors[], lighting, composition, textHierarchy, brandFit, studentFit, stopPower, risks[], recommendations[], suggestedTags[]。
具體檢查人物、色彩、光線、構圖、文字比例與層級、品牌感、學生生活感、手機停留感，以及是否太宗教、太老氣、太像 AI。看不到文字就明說，不要臆測。recommendations 要包含可執行的 Post／Story／Carousel／Reels Cover 延伸建議。`,
            },
            { type: "input_image", image_url: dataUrl },
          ],
        }],
      }),
    });
    if (!response.ok) throw new Error(`圖片分析暫時無法使用（${response.status}）`);
    const body = await response.json();
    const parsed = AnalysisSchema.parse(extractJson(extractResponseText(body)));
    const analysis: AssetAnalysis = { ...parsed, analyzedAt: Date.now() };
    return { ok: true as const, analysis };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "圖片分析失敗" };
  }
}

export const analyzeCreativeImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => VisionRequestSchema.parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input))
  .handler(async ({ data }) => runVisionAnalysis(data.dataUrl));

export const editCreativeImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => EditRequestSchema.parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input))
  .handler(async ({ data }) => {
    if (!process.env.XAI_API_KEY) return { ok: false as const, error: "這個環境尚未開放 AI 圖片改版" };
    try {
      const response = await fetch("https://api.x.ai/v1/images/edits", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          model: "grok-imagine-image-2.0",
          prompt: `${data.instruction}。延續可辨識的活動與人物內容，調整成淡江禪學社明亮、年輕、有生活感的 IG 視覺；不要新增文字、Logo、浮水印、宗教法器或佛像。`,
          image: { type: "image_url", url: data.dataUrl },
          aspect_ratio: data.aspectRatio,
          resolution: "1k",
          response_format: "b64_json",
        }),
      });
      return { ok: true as const, image: await imageResult(response) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "圖片改版失敗" };
    }
  });
