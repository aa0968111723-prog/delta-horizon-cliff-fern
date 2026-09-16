import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { mockPosterImage } from "@/lib/ai/poster";
import { mockVisionFromLook } from "@/lib/ai/vision-look";
import { formatById } from "@/lib/studio/formats";
import { studentSituation, zenSystemPrompt } from "@/lib/zen/context";
import { labelDirections } from "@/lib/zen/direction";
import { directionsFromResearch, researchInspiration } from "@/lib/zen/inspiration";
import type { FormatId, VisualDirection } from "@/lib/studio/types";

export const IMAGE_FORMAT_IDS = [
  "feed-portrait",
  "feed-square",
  "story",
  "reels-cover",
  "threads",
  "line",
] as const;

export type ImageFormatId = (typeof IMAGE_FORMAT_IDS)[number];

export function toImageFormat(id: FormatId | string): ImageFormatId {
  if (id === "feed-landscape") return "feed-square";
  return (IMAGE_FORMAT_IDS as readonly string[]).includes(id) ? (id as ImageFormatId) : "feed-portrait";
}

export function varyImagePrompt(
  prompt: string,
  kind: "composition" | "mood" | "background" | "style" | "text",
): string {
  const extra = {
    composition: "Change composition: more negative space, subject in the lower third, not a centered temple poster.",
    mood: "Shift mood quieter: Tamsui dusk humidity, young and lived-in, less dramatic lighting.",
    background: "Replace background with Tamsui river night or a Tamkang campus corridor, keep three soft colored lights.",
    style: "Less AI-smooth, more documentary photography, slight grain, not luxury branding.",
    text: "Leave empty room for a short Chinese headline; no English poster words baked into the image.",
  }[kind];
  return `${prompt}. ${extra}`;
}

const IdeaInput = z.object({
  idea: z.string().min(1).max(400),
  eventName: z.string().max(120).optional(),
  format: z.enum(IMAGE_FORMAT_IDS).optional(),
  memoryHint: z.string().max(1200).optional(),
  forceMock: z.boolean().optional(),
});

export type ImageGenResult =
  | { ok: true; adapter: "live" | "mock"; imageBase64: string; mime: string; prompt: string }
  | { ok: false; adapter: "live" | "mock"; error: string };

export type DirectionResult =
  | { ok: true; adapter: "live" | "mock"; directions: VisualDirection[] }
  | { ok: false; adapter: "live" | "mock"; error: string };

export type VisionAnalysis = {
  content: string;
  people: string;
  colors: string;
  lighting: string;
  composition: string;
  textRatio: string;
  hierarchy: string;
  brandFeel: string;
  studentFeel: string;
  dwell: string;
  tooReligious: boolean;
  tooOld: boolean;
  tooAi: boolean;
  fitsTamkang: boolean;
  suggestions: string[];
};

export type VisionResult =
  | { ok: true; adapter: "live" | "mock"; analysis: VisionAnalysis }
  | { ok: false; adapter: "live" | "mock"; error: string };

export function mockDirections(idea: string, eventName = "", memoryHint = ""): VisualDirection[] {
  const subject = eventName || idea;
  const research = researchInspiration({ idea: `${idea} ${memoryHint}`, eventName: subject });
  return directionsFromResearch(research, { eventName: subject });
}

function parseIdeaInput(input: unknown) {
  if (input && typeof input === "object" && "data" in input) {
    const inner = (input as { data: unknown }).data;
    if (inner && typeof inner === "object" && "idea" in inner) return IdeaInput.parse(inner);
  }
  return IdeaInput.parse(input);
}

export const generateVisualDirections = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseIdeaInput(input))
  .handler(async ({ data }): Promise<DirectionResult> => {
    const mock = labelDirections(mockDirections(data.idea, data.eventName, data.memoryHint));
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey || data.forceMock) return { ok: true, adapter: "mock", directions: mock };
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.7,
        max_tokens: 1600,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: zenSystemPrompt() },
          {
            role: "user",
            content: `為「${data.idea}」${data.eventName ? `（${data.eventName}）` : ""}提出 3 個 IG 視覺方向。
學生情境：${studentSituation()}
品牌記憶與過去 IG：${data.memoryHint || "問句 Hook、夜晚座位、三色光。學自己的 IG。"}
JSON:{directions:[{id,name,concept,palette,composition,typeDirection,prompt,headline,subhead}]} name 用「方向 A · …」這種形式。prompt 用英文、具體、不要寺廟、不要宗教海報。headline 先像在講淡江學生。`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: true, adapter: "mock", directions: mock };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    try {
      const parsed = JSON.parse(body.choices?.[0]?.message?.content ?? "{}") as { directions?: VisualDirection[] };
      if (!parsed.directions?.length) throw new Error("empty");
      return { ok: true, adapter: "live", directions: labelDirections(parsed.directions) };
    } catch {
      return { ok: true, adapter: "mock", directions: mock };
    }
  });

const ImageGenInput = z.object({
  prompt: z.string().min(8).max(1200),
  format: z.enum(IMAGE_FORMAT_IDS).optional(),
  headline: z.string().max(160).optional(),
  subhead: z.string().max(160).optional(),
  palette: z.string().max(80).optional(),
  name: z.string().max(80).optional(),
  variation: z.enum(["composition", "mood", "background", "style", "text"]).optional(),
  forceMock: z.boolean().optional(),
  memoryHint: z.string().max(1200).optional(),
  atmosphere: z.boolean().optional(),
  photoEmbed: z.string().max(400_000).optional(),
  sourceCredit: z.string().max(160).optional(),
});

function parseImageGen(input: unknown) {
  if (input && typeof input === "object" && "data" in input) {
    const inner = (input as { data: unknown }).data;
    if (inner && typeof inner === "object" && "prompt" in inner) return ImageGenInput.parse(inner);
  }
  return ImageGenInput.parse(input);
}

export function mockStudioImage(data: z.infer<typeof ImageGenInput>): ImageGenResult {
  const format = data.format ?? "feed-portrait";
  const spec = formatById(format);
  const atmosphere = data.atmosphere === true || format === "reels-cover";
  const poster = mockPosterImage({
    prompt: data.prompt,
    headline: atmosphere ? "" : data.headline || "最近是不是很久沒坐好",
    subhead: atmosphere ? undefined : data.subhead,
    palette: data.palette,
    name: atmosphere ? undefined : data.name,
    width: spec.width,
    height: spec.height,
    variation: data.variation ?? (atmosphere ? "mood" : undefined),
    atmosphere,
    photoEmbed: data.photoEmbed,
    sourceCredit: data.sourceCredit,
  });
  return { ok: true, adapter: "mock", ...poster };
}

export const generateStudioImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseImageGen(input))
  .handler(async ({ data }): Promise<ImageGenResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey || data.forceMock) return mockStudioImage(data);
    const aspect =
      data.format === "story" || data.format === "reels-cover"
        ? "9:16"
        : data.format === "feed-portrait"
          ? "4:5"
          : "1:1";
    const prompt = `${data.prompt}. Aspect ${aspect}. ${data.memoryHint ? `Club memory: ${data.memoryHint.slice(0, 180)}.` : ""}${data.sourceCredit ? ` Continue ${data.sourceCredit}; do not duplicate the old poster.` : ""}${data.format === "reels-cover" || data.atmosphere ? " Absolutely no Chinese or English words, logos, or captions in the image; empty lower third." : ""} Airy Tamkang student life, not temple, not luxury brand, not stock influencer.`;
    const photoUrl =
      data.photoEmbed?.startsWith("data:")
        ? data.photoEmbed
        : data.photoEmbed?.startsWith("<?xml") || data.photoEmbed?.startsWith("<svg")
          ? `data:image/svg+xml;base64,${Buffer.from(data.photoEmbed, "utf8").toString("base64")}`
          : undefined;
    if (photoUrl) {
      const edited = await fetch("https://api.x.ai/v1/images/edits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-imagine-image",
          prompt,
          image: { url: photoUrl },
          n: 1,
          resolution: "1k",
          response_format: "b64_json",
        }),
      });
      if (edited.ok) {
        const body = (await edited.json()) as { data?: { b64_json?: string }[] };
        const b64 = body.data?.[0]?.b64_json;
        if (b64) return { ok: true, adapter: "live", imageBase64: b64, mime: "image/png", prompt: data.prompt };
      }
    }
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
        resolution: "1k",
        response_format: "b64_json",
      }),
    });
    if (!res.ok) return mockStudioImage(data);
    const body = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
    const b64 = body.data?.[0]?.b64_json;
    if (b64) return { ok: true, adapter: "live", imageBase64: b64, mime: "image/png", prompt: data.prompt };
    const url = body.data?.[0]?.url;
    if (!url) return mockStudioImage(data);
    const img = await fetch(url);
    if (!img.ok) return mockStudioImage(data);
    const buf = Buffer.from(await img.arrayBuffer());
    return { ok: true, adapter: "live", imageBase64: buf.toString("base64"), mime: img.headers.get("content-type") || "image/png", prompt: data.prompt };
  });

function parseVisionInput(input: unknown) {
  const schema = z.object({
    imageBase64: z.string().min(20).max(2_000_000),
    mime: z.string().max(40).optional(),
    sourceNote: z.string().max(200).optional(),
  });
  if (input && typeof input === "object" && "data" in input) {
    const inner = (input as { data: unknown }).data;
    if (inner && typeof inner === "object" && "imageBase64" in inner) return schema.parse(inner);
  }
  return schema.parse(input);
}

export const analyzeStudioImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseVisionInput(input))
  .handler(async ({ data }): Promise<VisionResult> => {
    const apiKey = process.env.XAI_API_KEY;
    const mock = mockVisionFromLook({
      imageBase64: data.imageBase64,
      mime: data.mime,
      sourceNote: data.sourceNote,
    });
    if (!apiKey) return { ok: true, adapter: "mock", analysis: mock };
    const mime = data.mime || "image/jpeg";
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: zenSystemPrompt() },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `分析這張給淡江禪學社 IG 的圖。${data.sourceNote ? `來源：${data.sourceNote}。` : ""}不要一開始就當成宗教海報。JSON:{content,people,colors,lighting,composition,textRatio,hierarchy,brandFeel,studentFeel,dwell,tooReligious,tooOld,tooAi,fitsTamkang,suggestions[]}`,
              },
              { type: "image_url", image_url: { url: `data:${mime};base64,${data.imageBase64}` } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return { ok: true, adapter: "mock", analysis: mock };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    try {
      const analysis = JSON.parse(body.choices?.[0]?.message?.content ?? "{}") as Partial<VisionAnalysis>;
      return { ok: true, adapter: "live", analysis: { ...mock, ...analysis } };
    } catch {
      return { ok: true, adapter: "mock", analysis: mock };
    }
  });
