import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";
import type {
  CampaignStrategy,
  CarouselSlideDraft,
  CopyDraft,
  CreativeDirection,
  PlanSource,
  ReelsBeat,
  StoryFrameDraft,
  StudentReview,
  ToneId,
} from "@/lib/studio/types";
import { TONES, contentTypeLabel, campaignTypeLabel, painPointLabel, WAVE_ROLES } from "@/lib/zen/labels";
import { personasPrompt } from "@/lib/zen/context";
import { normalizeReelsBeats, reelsCoverPrompt } from "@/lib/zen/reels";
import { AVOID_WORDS, deformalize, localStudentReview, toneInstruction, ZEN_TRANSLATIONS } from "@/lib/zen/voice";
import {
  localCaptionFromCarousel,
  localCarousel,
  localCopy,
  localDirections,
  localImagePrompt,
  localLine,
  localReels,
  localStory,
  localStrategy,
  localThreads,
  whenLine,
} from "./zen-local";
import {
  type CampaignContextInput,
  ConvertJsonSchema,
  ConvertRequestSchema,
  CopyRequestSchema,
  ReelsJsonSchema,
  ReelsRequestSchema,
  CopyResponseSchema,
  IgAnalyzeJsonSchema,
  IgAnalyzeRequestSchema,
  ImageAnalyzeJsonSchema,
  ImageAnalyzeRequestSchema,
  ImageGenerateRequestSchema,
  InspirationJsonSchema,
  InspirationRequestSchema,
  ReviewJsonSchema,
  ReviewRequestSchema,
  StrategyJsonSchema,
  StrategyRequestSchema,
  VisualJsonSchema,
  VisualRequestSchema,
} from "./zen-schema";

/* ------------------------------------------------------------------ */
/* xAI helpers（server only）                                            */
/* ------------------------------------------------------------------ */

const XAI_URL = "https://api.x.ai/v1";
const CHAT_MODEL = "grok-4.5";

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1] : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("模型未回傳 JSON");
  return JSON.parse(raw.slice(start, end + 1));
}

type ChatContent = string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[];

async function xaiJson<T extends z.ZodTypeAny>(
  schema: T,
  system: string,
  user: ChatContent,
  opts?: { maxTokens?: number; temperature?: number },
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; error: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI 尚未連線" };
  const res = await fetch(`${XAI_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 3000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) return { ok: false, error: `AI 服務暫時無法使用（${res.status}）` };
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = body.choices?.[0]?.message?.content ?? "";
  try {
    return { ok: true, data: schema.parse(extractJson(text)) };
  } catch {
    return { ok: false, error: "AI 回傳無法解析，再試一次。" };
  }
}

const SYSTEM_VOICE = `你是淡江大學禪學社的社群編輯，也是唯一的企劃、文案、設計。你寫的東西要像真的社團人在發文，不是廣告公司。
受眾只有一個：淡江大學的學生（大一新生、大二到大四、研究生、住宿生、通勤生、剛到淡水的人、社團新鮮人、課業壓力大的人、人際困擾的人、對未來迷惘的人、想找歸屬感的人、對禪完全不了解的人）。
「禪」要轉譯成：${ZEN_TRANSLATIONS.join("、")}。不要宗教詞、不要說教、不要「誠摯邀請您」。
第一句 Hook 要讓學生覺得「這在講我」，先講狀態再講活動。
避免 AI 味：不要過度完整、不要每句都像金句、不要破折號、不要大量抽象詞、不要過度勵志或詩意；可以口語、可以不完整句、要有人味。
禁用詞：${AVOID_WORDS.join("、")}。
只輸出一個 JSON 物件，不要 markdown。`;

function campaignBlock(c: CampaignContextInput) {
  return [
    `活動：${c.name}（${campaignTypeLabel(c.type)}）`,
    `時間：${whenLine(c)}`,
    `地點：${c.location || "未定"}`,
    `一句介紹：${c.oneLiner || "無"}`,
    `完整介紹：${c.description || "無"}`,
    `主題：${c.theme || "無"}`,
    `學生痛點：${c.painPoints.map(painPointLabel).join("、") || "無"}`,
    `CTA：${c.cta || "直接來就好"}`,
    `報名：${c.signupUrl || "不用報名"}`,
    "",
    "== Brand Memory ==",
    c.brandContext,
    "",
    "== 淡江學生情境 ==",
    c.studentContext,
    c.igDna ? `\n== 自己 IG 的 DNA ==\n${c.igDna}` : "",
    c.sourceNotes ? `\n== 找到的過去素材 ==\n${c.sourceNotes}` : "",
    "",
    "== 分眾 ==",
    personasPrompt(),
  ].join("\n");
}

export type AiAdapter = { available: boolean; adapter: PlanSource };

export const getZenAiStatus = createServerFn({ method: "POST" }).handler(async (): Promise<AiAdapter> => {
  const available = Boolean(process.env.XAI_API_KEY);
  return { available, adapter: available ? "live" : "mock" };
});

/* ------------------------------------------------------------------ */
/* IG Copy AI                                                          */
/* ------------------------------------------------------------------ */

export type CopyResult = {
  ok: true;
  source: PlanSource;
  variants: CopyDraft[];
  imagePrompt: string;
  visualDirection: string;
  altText: string;
} | { ok: false; error: string };

function localCopyResult(data: z.infer<typeof CopyRequestSchema>): CopyResult {
  const seed = Math.floor(Math.random() * 7);
  const variants = TONES.map((t) => localCopy(data.campaign, t.id, seed, data.angle));
  const primary = variants.find((v) => v.tone === data.tone) ?? variants[1];
  const ordered = [primary, ...variants.filter((v) => v !== primary)];
  const dir = localDirections(data.campaign)[0];
  return {
    ok: true,
    source: "mock",
    variants: ordered,
    imagePrompt: localImagePrompt(data.campaign),
    visualDirection: dir.concept,
    altText: `${data.campaign.name} 宣傳圖：${dir.mood}，畫面下方留白放標題。`,
  };
}

export const generateZenCopy = createServerFn({ method: "POST" })
  .validator((input: unknown) => CopyRequestSchema.parse(unwrap(input)))
  .handler(async ({ data }): Promise<CopyResult> => {
    if (!process.env.XAI_API_KEY || data.forceMock) return localCopyResult(data);
    const toneList = TONES.map((t) => `${t.id}（${t.label}）：${toneInstruction(t.id)}`).join("\n");
    const user = `${campaignBlock(data.campaign)}

要寫的內容類型：${contentTypeLabel(data.contentType)}
${data.waveRole ? `這一波的角色：${WAVE_ROLES[data.waveRole as keyof typeof WAVE_ROLES]?.label ?? data.waveRole}` : ""}
${data.angle ? `角度：${data.angle}` : ""}
${data.idea ? `我的一句想法：${data.idea}` : ""}

請寫 6 個語氣版本，第一個是「${data.tone}」：
${toneList}

每個版本：hook（第一句，最多 26 字，先講學生狀態，不要出現社團名）、body（正文，含時間地點與怎麼參加，繁體中文，可以換行）、cta（2–8 字）、hashtags（6–10 個，含 #淡江大學禪學社 #淡江）。
另外給：imagePrompt（英文，描述一張適合這篇的 IG 4:5 主視覺，寫實、學生感、淡水或校園、無宗教符號、無文字）、visualDirection（中文一句）、altText（中文一句）。

JSON：{ "variants":[{ "tone","hook","body","cta","hashtags":[] }], "imagePrompt", "visualDirection", "altText" }`;
    const res = await xaiJson(CopyResponseSchema, SYSTEM_VOICE, user, { maxTokens: 3500 });
    if (!res.ok) return { ok: false, error: res.error };
    const variants: CopyDraft[] = res.data.variants
      .filter((v) => v.hook || v.body)
      .map((v) => ({
        tone: v.tone as ToneId,
        hook: deformalize(v.hook),
        body: deformalize(v.body),
        cta: v.cta || data.campaign.cta || "直接來就好",
        hashtags: v.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)),
      }));
    if (!variants.length) return localCopyResult(data);
    return {
      ok: true,
      source: "live",
      variants,
      imagePrompt: res.data.imagePrompt || localImagePrompt(data.campaign),
      visualDirection: res.data.visualDirection,
      altText: res.data.altText,
    };
  });

/* ------------------------------------------------------------------ */
/* Campaign Generator                                                  */
/* ------------------------------------------------------------------ */

export type StrategyResult = { ok: true; strategy: CampaignStrategy } | { ok: false; error: string };

export const generateZenStrategy = createServerFn({ method: "POST" })
  .validator((input: unknown) => StrategyRequestSchema.parse(unwrap(input)))
  .handler(async ({ data }): Promise<StrategyResult> => {
    if (!process.env.XAI_API_KEY || data.forceMock) return { ok: true, strategy: localStrategy(data.campaign) };
    const roles = Object.entries(WAVE_ROLES)
      .map(([id, v]) => `${id}（${v.label}：${v.hint}）`)
      .join("、");
    const user = `${campaignBlock(data.campaign)}

請為這個活動產生完整宣傳策略：
- axis：宣傳主軸（2–3 句，禪不出現在第一句）
- directions：3 個創意方向，每個含 title（A/B/C · 名稱）、concept、palette（3–4 個 hex，需含品牌色）、composition、typography、imagePrompt（英文、寫實或插畫、無文字無宗教符號）、headline（最多 14 字）、subhead、mood
- waves：發布節奏 6–12 波。依活動類型決定宣傳期長度（社課短、迎新 / 招生長）。offsetDays 是距活動日天數（-14 到 +1）。角色從：${roles}。要穿插生活 / 互動 / 知識 / 故事，不要連續三篇都是活動廣告。每波含 role、offsetDays、contentType（ig-post|carousel|story|reels|threads|line|poster|recap|member-story|countdown|qa|poll|knowledge）、title、hook（第一句）、angle（這篇怎麼寫）
- rhythmNote：一句話說明節奏

JSON：{ "axis","rhythmNote","directions":[...],"waves":[...] }`;
    const res = await xaiJson(StrategyJsonSchema, SYSTEM_VOICE, user, { maxTokens: 4000 });
    if (!res.ok) return { ok: false, error: res.error };
    const local = localStrategy(data.campaign);
    const directions: CreativeDirection[] = res.data.directions.length
      ? res.data.directions.map((d, i) => ({ id: `dir_${"abc"[i] ?? i}`, ...d }))
      : local.directions;
    const waves = res.data.waves.length
      ? res.data.waves.map((w, i) => ({ id: `wave_${i}_${w.role}`, ...w, hook: deformalize(w.hook), contentId: null }))
      : local.waves;
    return {
      ok: true,
      strategy: {
        axis: res.data.axis || local.axis,
        directions,
        chosenDirectionId: null,
        waves,
        rhythmNote: res.data.rhythmNote || local.rhythmNote,
        generatedAt: Date.now(),
        source: "live",
      },
    };
  });

/* ------------------------------------------------------------------ */
/* 一鍵轉換                                                             */
/* ------------------------------------------------------------------ */

export type ConvertResult = {
  ok: true;
  source: PlanSource;
  carousel: CarouselSlideDraft[];
  storyFrames: StoryFrameDraft[];
  reels: ReelsBeat[];
  threads: string;
  line: string;
  caption: string;
} | { ok: false; error: string };

function localConvert(data: z.infer<typeof ConvertRequestSchema>): ConvertResult {
  const copy: CopyDraft = { ...data.from, tone: "normal" };
  const carousel = localCarousel(data.campaign, copy);
  return {
    ok: true,
    source: "mock",
    carousel,
    storyFrames: localStory(data.campaign, copy),
    reels: normalizeReelsBeats(localReels(data.campaign, copy)),
    threads: localThreads(data.campaign, copy),
    line: localLine(data.campaign, copy),
    caption: localCaptionFromCarousel(carousel, copy),
  };
}

export const convertZenContent = createServerFn({ method: "POST" })
  .validator((input: unknown) => ConvertRequestSchema.parse(unwrap(input)))
  .handler(async ({ data }): Promise<ConvertResult> => {
    if (!process.env.XAI_API_KEY || data.forceMock) return localConvert(data);
    const user = `${campaignBlock(data.campaign)}

原始內容：
Hook：${data.from.hook}
正文：${data.from.body}
CTA：${data.from.cta}

請把它同時轉成：
- carousel：5 頁 [{role: hook|scene|pain|event|cta, title(≤14字), text(≤60字), visualNote}]
- storyFrames：3–5 張 [{text(≤40字), sticker(投票/倒數/連結/問答或空), visualNote}]
- reels：20 秒腳本 [{from,to,visual,caption,voiceover,transition,assetHint}]，分段 0–3 Hook / 3–7 / 7–12 / 12–17 / 17–20 CTA
- threads：Threads 短文（≤120 字，口語）
- line：LINE 群組轉發文（含時間地點報名，可用 1–2 個 emoji）
- caption：Carousel 用的 IG caption

JSON：{ "carousel":[],"storyFrames":[],"reels":[],"threads","line","caption" }`;
    const res = await xaiJson(ConvertJsonSchema, SYSTEM_VOICE, user, { maxTokens: 3500 });
    if (!res.ok) return { ok: false, error: res.error };
    const local = localConvert(data);
    if (!local.ok) return local;
    return {
      ok: true,
      source: "live",
      carousel: res.data.carousel.length ? res.data.carousel.map((s, i) => ({ index: i, ...s })) : local.carousel,
      storyFrames: res.data.storyFrames.length ? res.data.storyFrames.map((s, i) => ({ index: i, ...s })) : local.storyFrames,
      reels: normalizeReelsBeats(res.data.reels.length ? res.data.reels : local.reels),
      threads: res.data.threads || local.threads,
      line: res.data.line || local.line,
      caption: res.data.caption || local.caption,
    };
  });

/* ------------------------------------------------------------------ */
/* Reels 20 秒腳本                                                      */
/* ------------------------------------------------------------------ */

export type ReelsResult = {
  ok: true;
  source: PlanSource;
  reels: ReelsBeat[];
  coverPrompt: string;
  hook: string;
  body: string;
  cta: string;
} | { ok: false; error: string };

function copyForReels(data: z.infer<typeof ReelsRequestSchema>): CopyDraft {
  if (data.from?.hook) {
    return { hook: data.from.hook, body: data.from.body, cta: data.from.cta, hashtags: data.from.hashtags, tone: "normal" };
  }
  return localCopy(data.campaign, "normal", 0, data.idea);
}

function localReelsResult(data: z.infer<typeof ReelsRequestSchema>): ReelsResult {
  const copy = copyForReels(data);
  return {
    ok: true,
    source: "mock",
    reels: normalizeReelsBeats(localReels(data.campaign, copy)),
    coverPrompt: reelsCoverPrompt(localImagePrompt(data.campaign), copy.hook),
    hook: copy.hook,
    body: copy.body,
    cta: copy.cta,
  };
}

export const generateZenReels = createServerFn({ method: "POST" })
  .validator((input: unknown) => ReelsRequestSchema.parse(unwrap(input)))
  .handler(async ({ data }): Promise<ReelsResult> => {
    if (!process.env.XAI_API_KEY || data.forceMock) return localReelsResult(data);
    const copy = copyForReels(data);
    const user = `${campaignBlock(data.campaign)}

現有 Hook：${copy.hook || "（還沒有，請寫一句讓淡江學生停下來的第一句）"}
正文：${copy.body || data.idea || "（可依活動重寫）"}
CTA：${copy.cta || "直接來就好"}

請寫一支 20 秒 IG Reels 拍攝腳本，給一個人拿手機拍：
- hook：畫面上第一句字幕（≤22 字，先講學生狀態）
- body：Reels caption 用的短正文（時間地點怎麼來）
- cta：最後一句
- coverPrompt：英文 9:16 封面生圖提示，no text
- reels：正好 5 段 [{from,to,visual,caption,voiceover,transition,assetHint}]
  0–3 Hook（質問或生活畫面）/ 3–7 校園情境 / 7–12 為什麼值得進來 / 12–17 現場（茶、燈、人）/ 17–20 時間地點 CTA
  caption 是畫面上的字，短；voiceover 可空；assetHint 寫要準備哪種素材（自拍 / 校園夜景 / 社辦 / 茶杯 / 龜龜）
  transition 用：硬切 / 慢推 / 跟拍 / 疊化 / 定格

JSON：{ "hook","body","cta","coverPrompt","reels":[] }`;
    const res = await xaiJson(ReelsJsonSchema, SYSTEM_VOICE, user, { maxTokens: 2200 });
    if (!res.ok) return { ok: false, error: res.error };
    const local = localReelsResult(data);
    if (!local.ok) return local;
    return {
      ok: true,
      source: "live",
      reels: normalizeReelsBeats(res.data.reels.length ? res.data.reels : local.reels),
      coverPrompt: res.data.coverPrompt || local.coverPrompt,
      hook: res.data.hook || local.hook,
      body: res.data.body || local.body,
      cta: res.data.cta || local.cta,
    };
  });

/* ------------------------------------------------------------------ */
/* 反向學生模擬                                                          */
/* ------------------------------------------------------------------ */

export type ReviewResult = { ok: true; source: PlanSource; review: StudentReview } | { ok: false; error: string };

export const reviewAsStudent = createServerFn({ method: "POST" })
  .validator((input: unknown) => ReviewRequestSchema.parse(unwrap(input)))
  .handler(async ({ data }): Promise<ReviewResult> => {
    const local = localStudentReview({
      hook: data.hook,
      body: data.body,
      cta: data.cta,
      when: data.campaign.date,
      where: data.campaign.location,
      signupUrl: data.campaign.signupUrl,
    });
    if (!process.env.XAI_API_KEY || data.forceMock) return { ok: true, source: "mock", review: local };
    const user = `${campaignBlock(data.campaign)}

你現在切換成「一個滑 IG 的淡江學生」，晚上 11 點在宿舍床上看到這篇：
Hook：${data.hook}
正文：${data.body}
CTA：${data.cta}

請誠實回答（true/false）：wouldStop 我會停下來嗎、understandable 我看得懂嗎、tooReligious 太宗教、tooSerious 太嚴肅、tooArtsy 太文青、tooAi 太 AI、tooLong 太長、knowsWhat 我知道這活動在幹嘛、knowsWhenWhere 我知道時間地點、wouldBringFriend 我會想找朋友一起來、knowsHowToSignup 我知道怎麼報名。
verdict：一句學生口吻的整體感受。suggestions：3–5 個具體修改。rewriteHook：重寫一個更像在講我的第一句。score：0–100。

JSON：{ ...上述欄位 }`;
    const res = await xaiJson(ReviewJsonSchema, SYSTEM_VOICE, user, { maxTokens: 1200, temperature: 0.5 });
    if (!res.ok) return { ok: true, source: "mock", review: local };
    return { ok: true, source: "live", review: { ...res.data, rewriteHook: deformalize(res.data.rewriteHook) || local.rewriteHook } };
  });

/* ------------------------------------------------------------------ */
/* 視覺方向 A/B/C                                                       */
/* ------------------------------------------------------------------ */

export type VisualResult = { ok: true; source: PlanSource; directions: CreativeDirection[] } | { ok: false; error: string };

export const generateVisualDirections = createServerFn({ method: "POST" })
  .validator((input: unknown) => VisualRequestSchema.parse(unwrap(input)))
  .handler(async ({ data }): Promise<VisualResult> => {
    if (!process.env.XAI_API_KEY || data.forceMock) {
      return { ok: true, source: "mock", directions: localDirections(data.campaign) };
    }
    const user = `${campaignBlock(data.campaign)}
${data.idea ? `我想做：${data.idea}` : ""}
${data.referenceNotes ? `參考素材 / 風格分析：${data.referenceNotes}` : ""}

先想：活動主題、時間、學生情境、淡水生活、夜晚 / 校園、壓力、朋友感、氣氛、品牌色、龜龜、三色光、IG 停留感。
再提出 3 個視覺方向（A/B/C），每個：title、concept（視覺概念）、palette（3–4 hex，含品牌色）、composition（構圖）、typography（字體方向）、imagePrompt（英文，具體到光線、鏡頭、材質；無文字、無宗教符號、無水印）、headline（主文案 ≤14 字）、subhead（副文案）、mood。
三個方向要真的不一樣：一個照片寫實、一個場景 / 生活、一個插畫 / 角色。

JSON：{ "directions":[...] }`;
    const res = await xaiJson(VisualJsonSchema, SYSTEM_VOICE, user, { maxTokens: 2500 });
    if (!res.ok) return { ok: false, error: res.error };
    const directions = res.data.directions.length
      ? res.data.directions.map((d, i) => ({ id: `dir_${"abc"[i] ?? i}`, ...d }))
      : localDirections(data.campaign);
    return { ok: true, source: "live", directions };
  });

/* ------------------------------------------------------------------ */
/* 圖片理解（Vision）                                                    */
/* ------------------------------------------------------------------ */

export type AnalyzeResult = {
  ok: true;
  source: PlanSource;
  insight: z.infer<typeof ImageAnalyzeJsonSchema>;
} | { ok: false; error: string };

function localAnalyze(data: z.infer<typeof ImageAnalyzeRequestSchema>): AnalyzeResult {
  const name = (data.fileName ?? "").toLowerCase();
  const hints = (data.hints ?? "").toLowerCase();
  const blob = `${name} ${hints}`;
  const isPoster = /poster|海報|文宣/.test(blob);
  const isPeople = /人|社員|合照|people|group/.test(blob);
  const isCampus = /校園|淡江|宮燈|campus|tku/.test(blob);
  const isTamsui = /淡水|河|夕陽|tamsui|river/.test(blob);
  const subjects = [
    isPoster && "海報 / 文字版面",
    isPeople && "人物、社員",
    isCampus && "淡江校園",
    isTamsui && "淡水河岸",
    !isPoster && !isPeople && !isCampus && !isTamsui && "場景 / 物件",
  ].filter(Boolean) as string[];
  return {
    ok: true,
    source: "mock",
    insight: {
      summary: `本機推斷（尚未連線 AI 視覺）：這張是${subjects.join("、")}。連線後 AI 會實際看圖分析色彩、光線、構圖與學生感。`,
      subjects,
      palette: ["#F2B56B", "#7FB7A8", "#C9B8E8"],
      mood: isPeople ? "有人、熱鬧" : "安靜",
      studentFit: isPeople || isCampus || isTamsui ? 75 : 60,
      brandFit: isPoster ? 70 : 60,
      stopPower: isPeople ? 70 : 55,
      warnings: isPoster ? ["海報文字在 IG 縮圖可能太小"] : [],
      suggestions: [
        isPeople ? "做成「社員故事」或活動回顧，人物照停留感高。" : "適合當背景，主體上方留白放 Hook。",
        "延伸同風格：保留色調，換成夜晚 / 期中情境。",
      ],
      tags: subjects,
      extendPrompt: `same visual style and palette as the reference, ${isTamsui ? "Tamsui riverside" : "Tamkang University campus"} at dusk, relaxed students, soft three-color glow, no text`,
    },
  };
}

export const analyzeZenImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => ImageAnalyzeRequestSchema.parse(unwrap(input)))
  .handler(async ({ data }): Promise<AnalyzeResult> => {
    const src = data.imageDataUrl || data.imageUrl;
    if (!process.env.XAI_API_KEY || data.forceMock || !src) return localAnalyze(data);
    const text = `你是淡江禪學社的視覺總監。請分析這張圖：畫面內容、人物、色彩、光線、構圖、文字比例、視覺層級、品牌感、學生感、IG 停留感；並判斷是否太宗教、太老氣、太像 AI、是否符合淡江學生。
Brand Memory：${data.brandContext}
${data.hints ? `提示：${data.hints}` : ""}
回 JSON：{ "summary"(中文 2–3 句), "subjects":[], "palette":[hex x3-5], "mood", "studentFit"0-100, "brandFit"0-100, "stopPower"0-100, "warnings":[], "suggestions":[延續風格 / 重新設計 / 做成限動 / Carousel / Reels Cover 的具體建議], "tags":[中文標籤 5-8], "extendPrompt"(英文，延伸同風格素材的生圖提示，無文字) }`;
    const res = await xaiJson(
      ImageAnalyzeJsonSchema,
      "You are a visual director for a university zen club in Taiwan. Reply with one JSON object only.",
      [
        { type: "text", text },
        { type: "image_url", image_url: { url: src } },
      ],
      { maxTokens: 1500, temperature: 0.4 },
    );
    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, source: "live", insight: res.data };
  });

/* ------------------------------------------------------------------ */
/* 圖片生成（Imagine）                                                   */
/* ------------------------------------------------------------------ */

export type ImageResult = { ok: true; url: string; b64?: string; revisedPrompt?: string } | { ok: false; error: string; unavailable?: boolean };

export const generateZenImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => ImageGenerateRequestSchema.parse(unwrap(input)))
  .handler(async ({ data }): Promise<ImageResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "AI 圖片生成尚未連線。目前可先用視覺方向與 Prompt，連線後一鍵生成。", unavailable: true };
    const prompt = `${data.prompt}\nStyle constraints: ${data.brandContext.slice(0, 600)}. Aspect ratio ${data.aspect}. No text, no letters, no watermark, no religious symbols.`;
    const res = await fetch(`${XAI_URL}/images/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: data.quality === "quality" ? "grok-imagine-image-quality" : "grok-imagine-image",
        prompt,
        n: 1,
        response_format: "b64_json",
      }),
    });
    if (!res.ok) return { ok: false, error: `圖片服務暫時無法使用（${res.status}）` };
    const body = (await res.json()) as { data?: { url?: string; b64_json?: string; revised_prompt?: string }[] };
    const first = body.data?.[0];
    if (!first) return { ok: false, error: "沒有拿到圖片，再試一次。" };
    const url = first.b64_json ? `data:image/jpeg;base64,${first.b64_json}` : first.url ?? "";
    if (!url) return { ok: false, error: "沒有拿到圖片，再試一次。" };
    return { ok: true, url, revisedPrompt: first.revised_prompt };
  });

/* ------------------------------------------------------------------ */
/* IG 歷史分析                                                          */
/* ------------------------------------------------------------------ */

export type IgAnalyzeResult = { ok: true; source: PlanSource; analysis: z.infer<typeof IgAnalyzeJsonSchema> } | { ok: false; error: string };

function localIgAnalyze(data: z.infer<typeof IgAnalyzeRequestSchema>): IgAnalyzeResult {
  const first = data.caption.split("\n").map((s) => s.trim()).find(Boolean) ?? "";
  const tooClub = /禪學社誠摯|邀請您/.test(data.caption);
  return {
    ok: true,
    source: "mock",
    analysis: {
      hook: first.slice(0, 40),
      visual: "本機無法看圖；連線後會分析主視覺。",
      theme: data.kind || "貼文",
      captionLength: data.caption.replace(/\s+/g, "").length,
      cta: data.caption.match(/直接來|報名|私訊|bio/)?.[0] ?? "不明顯",
      direction: tooClub ? "太像公告" : "先講狀態再講活動",
      improvements: [
        tooClub ? "第一句拿掉社團名，改成學生狀態。" : "Hook 可以再更口語一點。",
        data.caption.length > 400 ? "正文太長，手機只會看到前三行。" : "長度還可以。",
        "時間地點要出現在前半。",
      ],
    },
  };
}

export const analyzeIgPost = createServerFn({ method: "POST" })
  .validator((input: unknown) => IgAnalyzeRequestSchema.parse(unwrap(input)))
  .handler(async ({ data }): Promise<IgAnalyzeResult> => {
    const local = localIgAnalyze(data);
    if (!process.env.XAI_API_KEY || data.forceMock) return local;
    const user = `這是淡江禪學社 IG 的一篇過去內容。
類型：${data.kind ?? "貼文"}
Caption：
${data.caption}
${data.metrics ? `成效：觸及 ${data.metrics.reach ?? "?"}、讚 ${data.metrics.likes ?? "?"}、留言 ${data.metrics.comments ?? "?"}、收藏 ${data.metrics.saves ?? "?"}、分享 ${data.metrics.shares ?? "?"}` : ""}
Brand：${data.brandContext}

請分析：hook（第一句）、visual（從文案推畫面）、theme、captionLength（字數）、cta、direction（內容方向）、improvements（3–5 個可改善的地方，針對淡江學生）。
JSON：{ hook, visual, theme, captionLength, cta, direction, improvements:[] }`;
    const res = await xaiJson(IgAnalyzeJsonSchema, SYSTEM_VOICE, user, { maxTokens: 900, temperature: 0.4 });
    if (!res.ok) return local;
    return { ok: true, source: "live", analysis: res.data };
  });

/* ------------------------------------------------------------------ */
/* 靈感研究                                                             */
/* ------------------------------------------------------------------ */

export type InspirationResult =
  | { ok: true; source: PlanSource; patterns: z.infer<typeof InspirationJsonSchema>["patterns"] }
  | { ok: false; error: string };

export const researchInspiration = createServerFn({ method: "POST" })
  .validator((input: unknown) => InspirationRequestSchema.parse(unwrap(input)))
  .handler(async ({ data }): Promise<InspirationResult> => {
    const { INSPIRATION_PATTERNS } = await import("@/lib/zen/inspiration");
    const local = INSPIRATION_PATTERNS.map((p) => ({
      observed: p.observed,
      composition: p.abstract.composition,
      color: p.abstract.color,
      layout: p.abstract.layout,
      hook: p.abstract.hook,
      form: p.abstract.form,
      zenUse: p.zenUse,
    }));
    if (!process.env.XAI_API_KEY || data.forceMock) return { ok: true, source: "mock", patterns: local };
    const user = `${data.studentContext}

Brand Memory：
${data.brandContext}

請研究「大學生社團 IG / 校園活動視覺」常見手法，但不要抄任何真實帳號。抽象成 4–6 個可重組元素：observed（你看到的現象）、composition、color、layout、hook、form、zenUse（轉成淡江禪學社可以怎麼用，一句具體的）。
不要宗教符號，不要企業感。

JSON：{ "patterns":[...] }`;
    const res = await xaiJson(InspirationJsonSchema, SYSTEM_VOICE, user, { maxTokens: 1800, temperature: 0.6 });
    if (!res.ok) return { ok: true, source: "mock", patterns: local };
    return { ok: true, source: "live", patterns: res.data.patterns.length ? res.data.patterns : local };
  });

/* ------------------------------------------------------------------ */

function unwrap(input: unknown): unknown {
  if (input && typeof input === "object" && "data" in input) {
    const inner = (input as { data: unknown }).data;
    if (inner && typeof inner === "object") return inner;
  }
  return input;
}
