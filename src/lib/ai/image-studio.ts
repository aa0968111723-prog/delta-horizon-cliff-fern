import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { zenSystemPrompt } from "@/lib/zen/context";
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

export function mockDirections(idea: string, eventName = ""): VisualDirection[] {
  const subject = eventName || idea;
  return [
    {
      id: "a",
      name: "方向 A · 淡水夜",
      concept: "夜晚、光、可以坐下的空氣。不是禪風海報。",
      palette: "墨松、靜水、琥珀點",
      composition: "上半光、下半問句。",
      typeDirection: "像訊息，不要美術字牆。",
      prompt: `Quiet Tamsui night near Tamkang campus, three soft orbs of amber teal and dusk-violet light floating, airy, photographic, young students implied not posed, ${subject}, no temple, no incense, no monk robes`,
      headline: "最近是不是很久沒坐好",
      subhead: subject,
    },
    {
      id: "b",
      name: "方向 B · 朋友位",
      concept: "空一個位子，讓人想揪人。",
      palette: "霧園、水色",
      composition: "杯子與座位，人只露局部。",
      typeDirection: "CTA 口語。",
      prompt: `Close-up of tea cups and an empty chair in a calm campus room, window light, Tamkang student life, ${subject}, documentary, not stock-photo smile`,
      headline: "可以自己來",
      subhead: "也可以揪人",
    },
    {
      id: "c",
      name: "方向 C · 龜龜與光",
      concept: "吉祥物當同伴，三色光當氣氛。",
      palette: "霧園紙、小色光",
      composition: "大留白，角色角落。",
      typeDirection: "標題先問生活。",
      prompt: `Small geometric turtle mascot in the corner, three colored lights, paper-like mist background, Tamkang Zen Club poster mood, ${subject}, not religious, not luxury`,
      headline: "先坐下來",
      subhead: subject,
    },
  ];
}

export const generateVisualDirections = createServerFn({ method: "POST" })
  .validator((input: unknown) => IdeaInput.parse(input))
  .handler(async ({ data }): Promise<DirectionResult> => {
    const mock = mockDirections(data.idea, data.eventName);
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
            content: `為「${data.idea}」${data.eventName ? `（${data.eventName}）` : ""}提出 3 個 IG 視覺方向。JSON:{directions:[{id,name,concept,palette,composition,typeDirection,prompt,headline,subhead}]} prompt 用英文、具體、不要寺廟。`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false, adapter: "live", error: `視覺方向暫時無法使用（${res.status}）。` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    try {
      const parsed = JSON.parse(body.choices?.[0]?.message?.content ?? "{}") as { directions?: VisualDirection[] };
      if (!parsed.directions?.length) throw new Error("empty");
      return { ok: true, adapter: "live", directions: parsed.directions };
    } catch {
      return { ok: false, adapter: "live", error: "視覺方向無法解析。" };
    }
  });

export const generateStudioImage = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        prompt: z.string().min(8).max(1200),
        format: z.enum(IMAGE_FORMAT_IDS).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ImageGenResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, adapter: "mock", error: "圖片生成需要連線 AI。可先用視覺方向與本機素材。" };
    const aspect =
      data.format === "story" || data.format === "reels-cover"
        ? "9:16"
        : data.format === "feed-portrait"
          ? "4:5"
          : "1:1";
    const res = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-imagine-image",
        prompt: `${data.prompt}. Aspect ${aspect}. Airy Tamkang student life, not temple, not luxury brand, not stock influencer.`,
        n: 1,
        resolution: "1k",
        response_format: "b64_json",
      }),
    });
    if (!res.ok) return { ok: false, adapter: "live", error: `圖片生成暫時無法使用（${res.status}）。` };
    const body = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
    const b64 = body.data?.[0]?.b64_json;
    if (b64) return { ok: true, adapter: "live", imageBase64: b64, mime: "image/png", prompt: data.prompt };
    const url = body.data?.[0]?.url;
    if (!url) return { ok: false, adapter: "live", error: "沒有收到圖片。" };
    const img = await fetch(url);
    if (!img.ok) return { ok: false, adapter: "live", error: "圖片下載失敗。" };
    const buf = Buffer.from(await img.arrayBuffer());
    return { ok: true, adapter: "live", imageBase64: buf.toString("base64"), mime: img.headers.get("content-type") || "image/png", prompt: data.prompt };
  });

export const analyzeStudioImage = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ imageBase64: z.string().min(20).max(2_000_000), mime: z.string().max(40).optional() }).parse(input),
  )
  .handler(async ({ data }): Promise<VisionResult> => {
    const apiKey = process.env.XAI_API_KEY;
    const mock = {
      content: "畫面偏抽象或海報感，需對照是否太宗教或太 AI。",
      people: "人物不明顯。",
      colors: "需核對霧園／靜水／琥珀。",
      lighting: "光線層級待看。",
      composition: "文字與圖像比例待調。",
      textRatio: "未知",
      hierarchy: "未知",
      brandFeel: "待對品牌記憶。",
      studentFeel: "是否像淡江學生會停？",
      dwell: "問句與光點較容易停留。",
      tooReligious: false,
      tooOld: false,
      tooAi: true,
      fitsTamkang: true,
      suggestions: ["延續這個風格", "做成限動", "做成 Carousel 封面"],
    };
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
                text: "分析這張給淡江禪學社 IG 的圖。JSON:{content,people,colors,lighting,composition,textRatio,hierarchy,brandFeel,studentFeel,dwell,tooReligious,tooOld,tooAi,fitsTamkang,suggestions[]}",
              },
              { type: "image_url", image_url: { url: `data:${mime};base64,${data.imageBase64}` } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false, adapter: "live", error: `圖片理解暫時無法使用（${res.status}）。` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    try {
      const analysis = JSON.parse(body.choices?.[0]?.message?.content ?? "{}") as Partial<VisionAnalysis>;
      return { ok: true, adapter: "live", analysis: { ...mock, ...analysis } };
    } catch {
      return { ok: false, adapter: "live", error: "圖片分析無法解析。" };
    }
  });
