import { createServerFn } from "@tanstack/react-start";
import { uid } from "@/lib/studio/ids";
import { VISUAL_ANCHORS } from "@/lib/zen/club";
import { z } from "zod";
import { buildEditPayload, buildGeneratePayload, hitToDataUrl, imagineResultFromBody } from "./imagine-request";
import { aiAvailable, buildZenContext, extractJson, zenChat } from "./zen-context";

/** 主視覺方向：一個方向包含概念、配色、構圖、字體與可直接送生成的圖片 prompt。 */
export type VisualDirection = {
  id: string;
  title: string;
  concept: string;
  palette: string;
  composition: string;
  typography: string;
  imagePrompt: string;
  headline: string;
  subhead: string;
};

const DirectionBriefSchema = z.object({
  intent: z.string().min(1).max(600),
  eventName: z.string().max(120).catch(""),
  schedule: z.string().max(120).catch(""),
  location: z.string().max(120).catch(""),
  painPoint: z.string().max(300).catch(""),
  audienceIds: z.array(z.string().max(40)).max(8).catch([]),
  imageStyle: z.string().max(600).optional(),
  brandMemoryText: z.string().max(2500).optional(),
  igDnaText: z.string().max(1500).optional(),
  forceLocal: z.boolean().optional(),
});

const DirectionJsonSchema = z.object({
  directions: z
    .array(
      z.object({
        title: z.string().catch(""),
        concept: z.string().catch(""),
        palette: z.string().catch(""),
        composition: z.string().catch(""),
        typography: z.string().catch(""),
        imagePrompt: z.string().catch(""),
        headline: z.string().catch(""),
        subhead: z.string().catch(""),
      }),
    )
    .max(4)
    .catch([]),
});

export type DirectionResult =
  | { ok: true; directions: VisualDirection[]; adapter: "live" }
  | { ok: false; error: string; directions: VisualDirection[]; adapter: "local" };

function unwrap<T>(input: unknown, schema: z.ZodType<T>): T {
  if (input && typeof input === "object" && "data" in input) {
    return schema.parse((input as { data: unknown }).data);
  }
  return schema.parse(input);
}

/** 沒有 AI 時的三個方向，仍然照品牌記憶走。 */
function localDirections(intent: string): VisualDirection[] {
  const subject = intent.trim().replace(/^我要宣傳/, "").trim() || "社課";
  return [
    {
      id: uid("vis"),
      title: "夜晚的安靜",
      concept: `把${subject}講成「一個安靜的晚上」，訴求晚上沒事做、腦袋停不下來的學生。`,
      palette: "夜光為主、曦光作點光，底色偏深但不壓抑",
      composition: "上三分之二留給夜色與燈光，下方紙白色塊放大標",
      typography: "襯線大標兩行，無襯線小字放時間地點",
      imagePrompt: `dim dorm desk at night lit by a single warm lamp, notebook and a mug, deep indigo shadows, soft glow, calm and spacious, muted film photo, no text, no religious symbols, ${VISUAL_ANCHORS.mood}`,
      headline: "有時候需要的\n只是一個安靜的晚上",
      subhead: "不用準備什麼，來就好。",
    },
    {
      id: uid("vis"),
      title: "窗邊的白天",
      concept: `讓${subject}看起來像社課現場，不像宗教場所。降低第一次來的不確定感。`,
      palette: "紙白底、澄光為主色，木頭與米色",
      composition: "主體偏左，右側大面留白給標題與流程三行字",
      typography: "無襯線為主，字級層級清楚，時間地點放大",
      imagePrompt: `sunlit corner of a university classroom, meditation cushions on wooden floor, soft daylight through window blinds, warm neutral palette, airy negative space, documentary photo, no text, no religious iconography, ${VISUAL_ANCHORS.mood}`,
      headline: "坐下來\n然後什麼都不用做",
      subhead: "引導十五分鐘 · 想講再講",
    },
    {
      id: uid("vis"),
      title: "淡水的光",
      concept: `用淡水河的傍晚做地方感，讓淡江學生一眼認出這是自己的生活場景。`,
      palette: "曦光與夜光漸層，紙白作文字底",
      composition: "滿版風景，標題壓在下三分之一半透明紙白區",
      typography: "襯線大標＋細長英文眉題",
      imagePrompt: `Tamsui riverside at dusk seen from a campus slope, warm amber sky fading into blue, distant ferry lights, silhouettes of trees, quiet and wide, cinematic photo, no text, ${VISUAL_ANCHORS.mood}`,
      headline: "走上坡的時候\n你通常在想什麼",
      subhead: "這週三晚上，來坐一小時。",
    },
  ];
}

/**
 * AI Image Studio 的第一步：不是直接生圖，而是先想清楚方向。
 * 使用者輸入「我要宣傳茶會」，AI 會先考慮活動、學生情境、淡水、品牌色，
 * 再提出三個可以各自往下生成的視覺方向。
 */
export const generateVisualDirections = createServerFn({ method: "POST" })
  .validator((input: unknown) => unwrap(input, DirectionBriefSchema))
  .handler(async ({ data }): Promise<DirectionResult> => {
    const fallback = localDirections(data.intent);
    if (data.forceLocal || !aiAvailable()) {
      return { ok: false, error: "目前沒有連上 AI，先給你本機的三個方向。", directions: fallback, adapter: "local" };
    }

    const prompt = [
      buildZenContext({
        audienceIds: data.audienceIds,
        imageStyle: data.imageStyle,
        brandMemoryText: data.brandMemoryText,
        igDnaText: data.igDnaText,
      }),
      "",
      "【使用者想做的事】",
      data.intent,
      data.eventName ? `活動：${data.eventName}｜${data.schedule}｜${data.location}` : "",
      data.painPoint ? `學生痛點：${data.painPoint}` : "",
      "",
      "【任務】先想，再給方向。不要直接產出「禪風海報」這種模板答案。",
      "想的順序：活動主題 → 活動時間（白天／夜晚）→ 學生情境 → 淡水生活 → 校園 → 壓力 → 朋友感 → 氣氛 → 品牌色與三色光 → IG 上會不會讓人停下來。",
      "",
      "輸出 JSON：{directions:[{title,concept,palette,composition,typography,imagePrompt,headline,subhead}]}",
      "正好 3 個方向，角度要真的不同（例如：夜晚情緒／白天現場／地方感）。",
      "imagePrompt 用英文寫，給文生圖模型用：具體場景、光線、色調、鏡頭感，結尾加 no text。",
      "imagePrompt 不要出現蓮花、佛像、金光、宗教符號、擺拍的笑臉。",
      "headline 最多兩行，用 \\n 分行，每行不超過 10 個中文字。subhead 一句。",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await zenChat({ prompt, maxTokens: 2200, temperature: 0.85 });
    if (!res.ok) {
      return {
        ok: false,
        error: res.error === "no-key" ? "目前沒有連上 AI" : res.error,
        directions: fallback,
        adapter: "local",
      };
    }
    try {
      const parsed = DirectionJsonSchema.parse(extractJson(res.text));
      const directions = parsed.directions
        .filter((d) => d.title || d.imagePrompt)
        .map((d) => ({
          id: uid("vis"),
          title: d.title,
          concept: d.concept,
          palette: d.palette,
          composition: d.composition,
          typography: d.typography,
          imagePrompt: d.imagePrompt,
          headline: d.headline,
          subhead: d.subhead,
        }));
      if (!directions.length) {
        return { ok: false, error: "AI 回傳無法解析。", directions: fallback, adapter: "local" };
      }
      return { ok: true, directions, adapter: "live" };
    } catch {
      return { ok: false, error: "AI 回傳無法解析。", directions: fallback, adapter: "local" };
    }
  });

const ImageGenSchema = z.object({
  prompt: z.string().min(1).max(1200),
  /** 產出比例，會影響加在 prompt 後面的說明 */
  ratio: z.enum(["4:5", "1:1", "9:16", "1.91:1"]).catch("4:5"),
  /** 品牌頁的畫面風格，接到 Imagine prompt 後面 */
  styleHint: z.string().max(400).optional(),
});

export type ImageGenResult =
  | { ok: true; dataUrl: string; revisedPrompt?: string }
  | { ok: false; error: string };

async function imagineFromResponse(res: Response): Promise<ImageGenResult> {
  if (!res.ok) {
    return { ok: false, error: `圖片生成失敗（${res.status}）。稍後再試一次。` };
  }
  const body: unknown = await res.json();
  const hit = imagineResultFromBody(body);
  if (!hit) return { ok: false, error: "圖片生成沒有回傳結果。" };
  const dataUrl = hitToDataUrl(hit);
  if (dataUrl) return { ok: true, dataUrl, revisedPrompt: hit.revisedPrompt };
  if (hit.url) {
    const fetched = await fetch(hit.url);
    if (!fetched.ok) return { ok: false, error: "圖片下載失敗。" };
    const buffer = Buffer.from(await fetched.arrayBuffer());
    const mime = fetched.headers.get("content-type") ?? "image/png";
    return {
      ok: true,
      dataUrl: `data:${mime};base64,${buffer.toString("base64")}`,
      revisedPrompt: hit.revisedPrompt,
    };
  }
  return { ok: false, error: "圖片生成沒有回傳結果。" };
}

/**
 * 真的呼叫 xAI Imagine 生圖。金鑰是社團擁有者的，所以只在使用者按下按鈕時呼叫，
 * 一次一張，不做自動重試風暴。
 */
export const generateImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => unwrap(input, ImageGenSchema))
  .handler(async ({ data }): Promise<ImageGenResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "這個環境沒有連上圖片生成服務。可以先用素材庫的圖，或之後再生成。" };
    }
    try {
      const res = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildGeneratePayload(data.prompt, data.ratio, data.styleHint)),
      });
      return imagineFromResponse(res);
    } catch {
      return { ok: false, error: "無法連上圖片生成服務。" };
    }
  });

const ImageEditSchema = z.object({
  imageUrl: z.string().min(8).max(4_000_000),
  instruction: z.string().min(1).max(600),
  ratio: z.enum(["4:5", "1:1", "9:16", "1.91:1"]).catch("4:5"),
});

/**
 * 圖片改版：拿現有照片／海報／IG 截圖，用自然語言改一版。
 * 走官方 Imagine edits，沒有金鑰就誠實說，不拿假圖充數。
 */
export const editImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => unwrap(input, ImageEditSchema))
  .handler(async ({ data }): Promise<ImageGenResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "這個環境沒有連上圖片改版服務。不會用假圖代替。" };
    }
    try {
      const res = await fetch("https://api.x.ai/v1/images/edits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(
          buildEditPayload({
            imageUrl: data.imageUrl,
            instruction: data.instruction,
            ratio: data.ratio,
          }),
        ),
      });
      return imagineFromResponse(res);
    } catch {
      return { ok: false, error: "無法連上圖片改版服務。" };
    }
  });

const VisionSchema = z.object({
  imageUrl: z.string().min(1).max(3_000_000),
  question: z.string().max(600).catch(""),
  audienceIds: z.array(z.string().max(40)).max(8).catch([]),
  brandMemoryText: z.string().max(2500).optional(),
  igDnaText: z.string().max(1500).optional(),
});

const VisionJsonSchema = z.object({
  summary: z.string().catch(""),
  content: z.string().catch(""),
  people: z.string().catch(""),
  color: z.string().catch(""),
  light: z.string().catch(""),
  composition: z.string().catch(""),
  textRatio: z.string().catch(""),
  hierarchy: z.string().catch(""),
  brandFit: z.string().catch(""),
  studentFit: z.string().catch(""),
  stopPower: z.string().catch(""),
  tooReligious: z.boolean().catch(false),
  tooOld: z.boolean().catch(false),
  tooAi: z.boolean().catch(false),
  fitsTku: z.boolean().catch(true),
  nextSteps: z.array(z.string()).max(8).catch([]),
  stylePrompt: z.string().catch(""),
  captionIdea: z.string().catch(""),
});

export type ImageAnalysis = z.infer<typeof VisionJsonSchema>;

export type VisionResult =
  | { ok: true; analysis: ImageAnalysis }
  | { ok: false; error: string };

/** 圖片理解：丟一張照片、歷屆海報、IG 截圖或 Canva 設計進來，AI 讀它。 */
export const analyzeImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => unwrap(input, VisionSchema))
  .handler(async ({ data }): Promise<VisionResult> => {
    if (!aiAvailable()) {
      return { ok: false, error: "這個環境沒有連上圖片理解服務。" };
    }
    const prompt = [
      buildZenContext({
        audienceIds: data.audienceIds,
        brandMemoryText: data.brandMemoryText,
        igDnaText: data.igDnaText,
      }),
      "",
      "【任務】看這張圖，用禪學社小編的眼光判斷它能不能用、怎麼用。",
      data.question ? `使用者特別想知道：${data.question}` : "",
      "",
      "輸出 JSON：{summary,content,people,color,light,composition,textRatio,hierarchy,brandFit,studentFit,stopPower,tooReligious,tooOld,tooAi,fitsTku,nextSteps[],stylePrompt,captionIdea}",
      "summary 一句話講這張圖是什麼。content 畫面內容。people 人物（沒有就寫沒有）。",
      "color 色彩、light 光線、composition 構圖、textRatio 文字比例、hierarchy 視覺層級。",
      "brandFit 跟禪學社品牌感的距離；studentFit 淡江學生看了的感覺；stopPower 會不會讓人停下來。",
      "tooReligious/tooOld/tooAi/fitsTku 用 true / false 誠實判斷。",
      "nextSteps 是 3-5 個可以直接做的下一步（例如：延續這個風格、保留內容重新設計、做成限動、做成輪播、做成 Reels 封面）。",
      "stylePrompt 用英文寫，是「延續這個風格」時可以送去生圖的 prompt。",
      "captionIdea 是看到這張圖時想到的第一句文案。",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await zenChat({
      prompt,
      imageUrls: [data.imageUrl],
      maxTokens: 2000,
      temperature: 0.5,
    });
    if (!res.ok) {
      return { ok: false, error: res.error === "no-key" ? "目前沒有連上 AI" : res.error };
    }
    try {
      return { ok: true, analysis: VisionJsonSchema.parse(extractJson(res.text)) };
    } catch {
      return { ok: false, error: "AI 回傳無法解析。" };
    }
  });
