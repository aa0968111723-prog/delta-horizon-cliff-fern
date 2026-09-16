import { createServerFn } from "@tanstack/react-start";
import { localAltText } from "@/lib/studio/copy-alt";
import { uid } from "@/lib/studio/ids";
import type { CopyDraft, CopyTone, ReelsScript, StudentReview } from "@/lib/studio/types";
import { STUDENT_REVIEW_QUESTIONS } from "@/lib/zen/voice";
import { z } from "zod";
import {
  buildLocalCopyDraft,
  buildLocalReels,
  buildLocalStudentReview,
  toneLabel,
  topicLabel,
  type CopyBriefLocal,
  type CopyTopic,
} from "./copy-local";
import { aiAvailable, buildZenContext, extractJson, zenChat } from "./zen-context";

const ToneSchema = z.enum(["short", "normal", "emotional", "student", "life", "humor"]);

const CopyBriefSchema = z.object({
  topic: z
    .enum(["event", "emotion", "campus", "recruit", "member", "zen-life", "countdown", "recap", "knowledge"])
    .catch("event"),
  tones: z.array(ToneSchema).min(1).max(4),
  eventName: z.string().max(120).catch(""),
  schedule: z.string().max(120).catch(""),
  location: z.string().max(120).catch(""),
  detail: z.string().max(1200).catch(""),
  painPoint: z.string().max(300).catch(""),
  cta: z.string().max(60).catch(""),
  audienceIds: z.array(z.string().max(40)).max(8).catch([]),
  signupUrl: z.string().max(300).catch(""),
  brandVoice: z.string().max(600).optional(),
  brandDontSay: z.string().max(300).optional(),
  forbiddenWords: z.array(z.string().max(40)).max(20).optional(),
  brandMemoryText: z.string().max(2500).optional(),
  igDnaText: z.string().max(1500).optional(),
  insightsText: z.string().max(1200).optional(),
  imageUrl: z.string().min(8).max(3_000_000).optional(),
  imageCue: z.string().max(80).optional(),
  forceLocal: z.boolean().optional(),
});

export type CopyBriefInput = z.infer<typeof CopyBriefSchema>;

export type CopyResult =
  | { ok: true; drafts: CopyDraft[]; adapter: "live" | "local"; note?: string }
  | { ok: false; error: string; drafts: CopyDraft[]; adapter: "local" };

function toLocalBrief(data: CopyBriefInput): CopyBriefLocal {
  return {
    topic: data.topic as CopyTopic,
    tone: data.tones[0],
    eventName: data.eventName,
    schedule: data.schedule,
    location: data.location,
    detail: data.detail,
    painPoint: data.painPoint,
    cta: data.cta,
    audienceIds: data.audienceIds,
    signupUrl: data.signupUrl,
    imageCue: data.imageCue,
  };
}

function localDrafts(data: CopyBriefInput): CopyDraft[] {
  const brief = toLocalBrief(data);
  return data.tones.map((tone) => buildLocalCopyDraft(brief, tone));
}

function unwrap<T>(input: unknown, schema: z.ZodType<T>): T {
  if (input && typeof input === "object" && "data" in input) {
    return schema.parse((input as { data: unknown }).data);
  }
  return schema.parse(input);
}

const CopyJsonSchema = z.object({
  drafts: z
    .array(
      z.object({
        tone: ToneSchema.catch("normal"),
        hook: z.string().catch(""),
        body: z.string().catch(""),
        cta: z.string().catch(""),
        hashtags: z.array(z.string()).max(15).catch([]),
        altText: z.string().max(240).catch(""),
      }),
    )
    .max(6)
    .catch([]),
});

export const generateIgCopy = createServerFn({ method: "POST" })
  .validator((input: unknown) => unwrap(input, CopyBriefSchema))
  .handler(async ({ data }): Promise<CopyResult> => {
    const fallback = localDrafts(data);
    if (data.forceLocal || !aiAvailable()) {
      return { ok: true, drafts: fallback, adapter: "local" };
    }

    const prompt = [
      buildZenContext({
        audienceIds: data.audienceIds,
        brandVoice: data.brandVoice,
        brandDontSay: data.brandDontSay,
        forbiddenWords: data.forbiddenWords,
        brandMemoryText: data.brandMemoryText,
        igDnaText: data.igDnaText,
        insightsText: data.insightsText,
      }),
      "",
      "【這次要寫的內容】",
      `類型：${topicLabel(data.topic as CopyTopic)}`,
      data.eventName ? `活動：${data.eventName}` : "",
      data.schedule ? `時間：${data.schedule}` : "",
      data.location ? `地點：${data.location}` : "",
      data.detail ? `內容說明：${data.detail}` : "",
      data.painPoint ? `想打到的痛點：${data.painPoint}` : "",
      data.cta ? `希望的行動：${data.cta}` : "",
      data.signupUrl ? `報名連結：${data.signupUrl}` : "",
      "",
      `請寫 ${data.tones.length} 個版本，語氣分別是：${data.tones.map((t) => `${t}(${toneLabel(t)})`).join("、")}`,
      "",
      "輸出 JSON：{drafts:[{tone,hook,body,cta,hashtags[],altText}]}",
      "hook 是第一句，一句話，最多 30 個字，要讓淡江學生覺得「這在講我」。",
      "body 是 IG 內文，用 \\n 分段，2-4 段，短版只要 1-2 段。有活動就一定要寫清楚時間、地點、怎麼參加。",
      "cta 4-10 個字，用社團自己的口氣。",
      "hashtags 6-8 個，要含 #淡江大學 與社團標籤，不要塞滿。",
      "altText 是給視障同學聽的畫面說明，一句話，講畫面裡有什麼、標題寫什麼、時間地點。不要寫成行銷文案。",
      data.imageCue ? `圖裡抽出的第一句／畫面線索：${data.imageCue}` : "",
      data.imageUrl ? "有附一張圖：先看畫面裡的人、光、地方，再寫文案。不要描述成「一張海報」。" : "",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await zenChat({
      prompt,
      maxTokens: 2400,
      temperature: 0.8,
      imageUrls: data.imageUrl ? [data.imageUrl] : undefined,
    });
    if (!res.ok) {
      return { ok: false, error: res.error === "no-key" ? "目前沒有連上 AI" : res.error, drafts: fallback, adapter: "local" };
    }
    try {
      const parsed = CopyJsonSchema.parse(extractJson(res.text));
      const drafts: CopyDraft[] = parsed.drafts
        .filter((d) => d.hook || d.body)
        .map((d) => ({
          id: uid("copy"),
          tone: d.tone as CopyTone,
          hook: d.hook.trim(),
          body: d.body.trim(),
          cta: d.cta.trim() || data.cta || "來坐一下",
          hashtags: d.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)),
          altText:
            d.altText.trim() ||
            localAltText({
              hook: d.hook,
              eventName: data.eventName,
              schedule: data.schedule,
              location: data.location,
              scene: data.imageCue,
            }),
          createdAt: Date.now(),
          source: "live" as const,
        }));
      if (!drafts.length) {
        return { ok: false, error: "AI 回傳無法解析，先給你本機草稿。", drafts: fallback, adapter: "local" };
      }
      return { ok: true, drafts, adapter: "live" };
    } catch {
      return { ok: false, error: "AI 回傳無法解析，先給你本機草稿。", drafts: fallback, adapter: "local" };
    }
  });

const ReviewSchema = z.object({
  text: z.string().min(1).max(4000),
  eventName: z.string().max(120).catch(""),
  schedule: z.string().max(120).catch(""),
  location: z.string().max(120).catch(""),
  signupUrl: z.string().max(300).catch(""),
  painPoint: z.string().max(300).catch(""),
  audienceIds: z.array(z.string().max(40)).max(8).catch([]),
  brandMemoryText: z.string().max(2500).optional(),
  igDnaText: z.string().max(1500).optional(),
  insightsText: z.string().max(1200).optional(),
  forceLocal: z.boolean().optional(),
});

const ReviewJsonSchema = z.object({
  score: z.number().min(0).max(100).catch(70),
  items: z
    .array(
      z.object({
        question: z.string().catch(""),
        verdict: z.enum(["ok", "risk"]).catch("ok"),
        note: z.string().catch(""),
      }),
    )
    .max(14)
    .catch([]),
  rewriteHook: z.string().catch(""),
  suggestions: z.array(z.string()).max(8).catch([]),
});

export type ReviewResult =
  | { ok: true; review: StudentReview; adapter: "live" | "local" }
  | { ok: false; error: string; review: StudentReview; adapter: "local" };

/** 反向學生模擬：用淡江學生視角重看一次自己寫的東西。 */
export const reviewAsStudent = createServerFn({ method: "POST" })
  .validator((input: unknown) => unwrap(input, ReviewSchema))
  .handler(async ({ data }): Promise<ReviewResult> => {
    const brief: CopyBriefLocal = {
      topic: "event",
      tone: "normal",
      eventName: data.eventName,
      schedule: data.schedule,
      location: data.location,
      detail: "",
      painPoint: data.painPoint,
      cta: "",
      audienceIds: data.audienceIds,
      signupUrl: data.signupUrl,
    };
    const fallback = buildLocalStudentReview(data.text, brief);
    if (data.forceLocal || !aiAvailable()) {
      return { ok: true, review: fallback, adapter: "local" };
    }

    const prompt = [
      buildZenContext({ audienceIds: data.audienceIds, brandMemoryText: data.brandMemoryText, igDnaText: data.igDnaText, insightsText: data.insightsText }),
      "",
      "【任務】現在把身分切換成一個滑到這篇貼文的淡江學生（不是小編）。",
      "誠實回答下面每一題，會覺得怪就說怪。不要客套。",
      STUDENT_REVIEW_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join("\n"),
      "",
      "【要看的內容】",
      data.text.slice(0, 3000),
      data.eventName ? `\n（活動：${data.eventName}｜時間：${data.schedule || "未寫"}｜地點：${data.location || "未寫"}）` : "",
      "",
      "輸出 JSON：{score, items:[{question,verdict:\"ok\"|\"risk\",note}], rewriteHook, suggestions[]}",
      "score 是 0-100，代表淡江學生會停下來看的可能。",
      "items 要覆蓋上面每一題，note 用學生的口氣寫，一句話。",
      "rewriteHook 是你會更想看的第一句。suggestions 是 2-4 個具體修改，不要空話。",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await zenChat({ prompt, maxTokens: 1800, temperature: 0.6 });
    if (!res.ok) {
      return { ok: false, error: res.error === "no-key" ? "目前沒有連上 AI" : res.error, review: fallback, adapter: "local" };
    }
    try {
      const parsed = ReviewJsonSchema.parse(extractJson(res.text));
      const items = parsed.items.filter((i) => i.question);
      if (!items.length) return { ok: false, error: "AI 回傳無法解析。", review: fallback, adapter: "local" };
      return {
        ok: true,
        adapter: "live",
        review: {
          score: Math.round(parsed.score),
          items,
          rewriteHook: parsed.rewriteHook,
          suggestions: parsed.suggestions,
          createdAt: Date.now(),
          source: "live",
        },
      };
    } catch {
      return { ok: false, error: "AI 回傳無法解析。", review: fallback, adapter: "local" };
    }
  });

const ReelsSchema = z.object({
  eventName: z.string().max(120).catch(""),
  schedule: z.string().max(120).catch(""),
  location: z.string().max(120).catch(""),
  detail: z.string().max(1200).catch(""),
  painPoint: z.string().max(300).catch(""),
  cta: z.string().max(60).catch(""),
  audienceIds: z.array(z.string().max(40)).max(8).catch([]),
  brandMemoryText: z.string().max(2500).optional(),
  igDnaText: z.string().max(1500).optional(),
  insightsText: z.string().max(1200).optional(),
  imageCue: z.string().max(80).optional(),
  forceLocal: z.boolean().optional(),
});

const ReelsJsonSchema = z.object({
  hook: z.string().catch(""),
  cover: z.string().catch(""),
  beats: z
    .array(
      z.object({
        range: z.string().catch(""),
        visual: z.string().catch(""),
        caption: z.string().catch(""),
        voice: z.string().catch(""),
        transition: z.string().catch(""),
        asset: z.string().catch(""),
      }),
    )
    .max(8)
    .catch([]),
});

export type ReelsResult =
  | { ok: true; reels: ReelsScript; adapter: "live" | "local" }
  | { ok: false; error: string; reels: ReelsScript; adapter: "local" };

export const generateReelsScript = createServerFn({ method: "POST" })
  .validator((input: unknown) => unwrap(input, ReelsSchema))
  .handler(async ({ data }): Promise<ReelsResult> => {
    const brief: CopyBriefLocal = {
      topic: "event",
      tone: "student",
      eventName: data.eventName,
      schedule: data.schedule,
      location: data.location,
      detail: data.detail,
      painPoint: data.painPoint,
      cta: data.cta,
      audienceIds: data.audienceIds,
      signupUrl: "",
      imageCue: data.imageCue,
    };
    const fallback = buildLocalReels(brief);
    if (data.forceLocal || !aiAvailable()) {
      return { ok: true, reels: fallback, adapter: "local" };
    }

    const prompt = [
      buildZenContext({ audienceIds: data.audienceIds, brandMemoryText: data.brandMemoryText, igDnaText: data.igDnaText, insightsText: data.insightsText }),
      "",
      "【任務】寫一支 20 秒的 Reels 腳本，拍攝者只有一個人、只有手機。",
      data.eventName ? `活動：${data.eventName}｜${data.schedule}｜${data.location}` : "",
      data.detail ? `內容：${data.detail}` : "",
      data.painPoint ? `痛點：${data.painPoint}` : "",
      data.imageCue
        ? `封面要用這張圖。Hook 接畫面線索，不要寫成與圖無關的套話：${data.imageCue}`
        : "",
      "",
      "輸出 JSON：{hook, cover, beats:[{range,visual,caption,voice,transition,asset}]}",
      "beats 固定五段：0–3 秒、3–7 秒、7–12 秒、12–17 秒、17–20 秒。",
      "0–3 秒要能讓人停下來，不要出現社團名稱。",
      data.imageCue ? "0–3 秒用這張封面照片定格，再拉開。" : "",
      "visual 要能用手機在淡江校園拍到；asset 寫需要什麼素材。",
      "caption 是畫面上的字幕，短。voice 是旁白，沒有就寫「（無旁白）」。",
      "cover 描述封面畫面。有圖時 cover 要寫用這張照片當 9:16 封面。",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await zenChat({ prompt, maxTokens: 1800, temperature: 0.75 });
    if (!res.ok) {
      return { ok: false, error: res.error === "no-key" ? "目前沒有連上 AI" : res.error, reels: fallback, adapter: "local" };
    }
    try {
      const parsed = ReelsJsonSchema.parse(extractJson(res.text));
      const beats = parsed.beats.filter((b) => b.visual || b.caption);
      if (!beats.length) return { ok: false, error: "AI 回傳無法解析。", reels: fallback, adapter: "local" };
      return {
        ok: true,
        adapter: "live",
        reels: {
          hook: parsed.hook || fallback.hook,
          cover: parsed.cover || fallback.cover,
          beats,
          createdAt: Date.now(),
          source: "live",
        },
      };
    } catch {
      return { ok: false, error: "AI 回傳無法解析。", reels: fallback, adapter: "local" };
    }
  });

export type AiAvailability = { available: boolean; label: string; detail: string };

export const getZenAiStatus = createServerFn({ method: "POST" }).handler(async (): Promise<AiAvailability> => {
  if (aiAvailable()) {
    return {
      available: true,
      label: "AI 已連線",
      detail: "會先讀品牌記憶、淡江學生情境與現在的學期階段，再生成內容。",
    };
  }
  return {
    available: false,
    label: "本機草稿模式",
    detail: "目前沒有連上 AI。按生成會用本機規則寫一版可以直接編輯的草稿，不是線上模型的回覆。",
  };
});
