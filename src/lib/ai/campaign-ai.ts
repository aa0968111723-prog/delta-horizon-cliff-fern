import { createServerFn } from "@tanstack/react-start";
import { uid } from "@/lib/studio/ids";
import { CONTENT_KIND_META } from "@/lib/studio/status";
import type { CampaignDirection, CampaignWave, ContentKind } from "@/lib/studio/types";
import { eventKindLabel } from "@/lib/zen/club";
import { z } from "zod";
import { aiAvailable, buildZenContext, extractJson, zenChat } from "./zen-context";

const CampaignBriefSchema = z.object({
  name: z.string().max(120).catch(""),
  kind: z.string().max(40).catch("class"),
  date: z.string().max(20).catch(""),
  time: z.string().max(40).catch(""),
  location: z.string().max(120).catch(""),
  oneLiner: z.string().max(300).catch(""),
  intro: z.string().max(1500).catch(""),
  theme: z.string().max(200).catch(""),
  painPoint: z.string().max(300).catch(""),
  cta: z.string().max(60).catch(""),
  signupUrl: z.string().max(300).catch(""),
  audienceIds: z.array(z.string().max(40)).max(8).catch([]),
  /** 宣傳期還有幾天，AI 用來決定波次密度 */
  daysUntil: z.number().int().min(-90).max(400).catch(14),
  /** 跨來源搜到的素材摘要，讓 AI 知道有什麼可用 */
  availableAssets: z.array(z.string().max(120)).max(20).catch([]),
  forceLocal: z.boolean().optional(),
});

export type CampaignBriefInput = z.infer<typeof CampaignBriefSchema>;

const KIND_VALUES = Object.keys(CONTENT_KIND_META) as ContentKind[];

const CampaignJsonSchema = z.object({
  axis: z.string().catch(""),
  directions: z
    .array(
      z.object({
        title: z.string().catch(""),
        concept: z.string().catch(""),
        visual: z.string().catch(""),
        sampleHook: z.string().catch(""),
      }),
    )
    .max(4)
    .catch([]),
  waves: z
    .array(
      z.object({
        offsetDays: z.number().int().min(-120).max(60).catch(0),
        stage: z.string().catch(""),
        title: z.string().catch(""),
        kind: z.string().catch("ig-post"),
        hook: z.string().catch(""),
        note: z.string().catch(""),
      }),
    )
    .max(16)
    .catch([]),
});

export type CampaignPlanResult =
  | {
      ok: true;
      adapter: "live";
      axis: string;
      directions: CampaignDirection[];
      waves: CampaignWave[];
    }
  | { ok: false; error: string; adapter: "local" };

function unwrap<T>(input: unknown, schema: z.ZodType<T>): T {
  if (input && typeof input === "object" && "data" in input) {
    return schema.parse((input as { data: unknown }).data);
  }
  return schema.parse(input);
}

function asContentKind(raw: string): ContentKind {
  return (KIND_VALUES as string[]).includes(raw) ? (raw as ContentKind) : "ig-post";
}

/**
 * 「AI 生成完整宣傳」：宣傳主軸 + 3 個創意方向 + 發布節奏。
 * 節奏由 AI 依活動類型、宣傳期長度自己決定，不是寫死的 14/10/7/5/3/2/1。
 */
export const generateCampaignStrategy = createServerFn({ method: "POST" })
  .validator((input: unknown) => unwrap(input, CampaignBriefSchema))
  .handler(async ({ data }): Promise<CampaignPlanResult> => {
    if (data.forceLocal || !aiAvailable()) {
      return { ok: false, error: "目前沒有連上 AI，先用本機節奏草稿。", adapter: "local" };
    }

    const prompt = [
      buildZenContext({ audienceIds: data.audienceIds }),
      "",
      "【這場活動】",
      `名稱：${data.name || "未命名"}（${eventKindLabel(data.kind)}）`,
      data.date ? `日期：${data.date} ${data.time}` : "日期：未定",
      data.location ? `地點：${data.location}` : "",
      data.oneLiner ? `一句話介紹：${data.oneLiner}` : "",
      data.intro ? `完整介紹：${data.intro}` : "",
      data.theme ? `活動主題：${data.theme}` : "",
      data.painPoint ? `學生痛點：${data.painPoint}` : "",
      data.cta ? `主要行動：${data.cta}` : "",
      data.signupUrl ? `報名連結：有` : "報名方式：直接到現場",
      `距離活動還有 ${data.daysUntil} 天。`,
      data.availableAssets.length ? `現有素材：${data.availableAssets.join("、")}` : "",
      "",
      "【任務】規劃這場活動的完整 IG 宣傳。",
      "輸出 JSON：{axis, directions:[{title,concept,visual,sampleHook}], waves:[{offsetDays,stage,title,kind,hook,note}]}",
      "axis：這次宣傳的主軸，一到兩句。不是口號，是策略判斷。",
      "directions：正好 3 個創意方向，彼此角度要真的不同（不要只是換形容詞）。sampleHook 是那個方向的第一句示範。",
      `waves：發布節奏，${Math.max(4, Math.min(12, Math.round(data.daysUntil / 2) + 3))} 篇左右。`,
      "offsetDays 是相對活動日的天數（-14 代表提前 14 天，0 是當天，2 是活動後兩天）。",
      `kind 只能用：${KIND_VALUES.join("、")}`,
      "節奏規則：不要連續三篇都是活動廣告。要穿插生活、互動、知識、社員故事，讓版面不像一直在招生。",
      "宣傳期短就壓縮波次，宣傳期長就在前段多放情緒與生活內容。",
      "活動當天要有提醒，活動後要有回顧。",
      "每一篇的 hook 是第一句，title 是這篇要講什麼，note 是製作提醒（要什麼素材、注意什麼）。",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await zenChat({ prompt, maxTokens: 3600, temperature: 0.75 });
    if (!res.ok) {
      return { ok: false, error: res.error === "no-key" ? "目前沒有連上 AI" : res.error, adapter: "local" };
    }
    try {
      const parsed = CampaignJsonSchema.parse(extractJson(res.text));
      const waves: CampaignWave[] = parsed.waves
        .filter((w) => w.title || w.hook)
        .sort((a, b) => a.offsetDays - b.offsetDays)
        .map((w) => ({
          id: uid("wave"),
          offsetDays: w.offsetDays,
          stage: w.stage,
          title: w.title,
          kind: asContentKind(w.kind),
          hook: w.hook,
          note: w.note,
          contentId: null,
        }));
      const directions: CampaignDirection[] = parsed.directions
        .filter((d) => d.title)
        .map((d) => ({
          id: uid("dir"),
          title: d.title,
          concept: d.concept,
          visual: d.visual,
          sampleHook: d.sampleHook,
        }));
      if (!waves.length) {
        return { ok: false, error: "AI 回傳無法解析，先用本機節奏草稿。", adapter: "local" };
      }
      return { ok: true, adapter: "live", axis: parsed.axis, directions, waves };
    } catch {
      return { ok: false, error: "AI 回傳無法解析，先用本機節奏草稿。", adapter: "local" };
    }
  });

const IdeaSchema = z.object({
  audienceIds: z.array(z.string().max(40)).max(8).catch([]),
  recentTopics: z.array(z.string().max(120)).max(12).catch([]),
  upcoming: z.string().max(300).catch(""),
  forceLocal: z.boolean().optional(),
});

const IdeaJsonSchema = z.object({
  ideas: z
    .array(
      z.object({
        title: z.string().catch(""),
        hook: z.string().catch(""),
        kind: z.string().catch("ig-post"),
        why: z.string().catch(""),
      }),
    )
    .max(6)
    .catch([]),
});

export type IdeaItem = { id: string; title: string; hook: string; kind: ContentKind; why: string };

export type IdeaResult =
  | { ok: true; ideas: IdeaItem[]; adapter: "live" }
  | { ok: false; error: string; adapter: "local" };

/** 今日靈感：依現在的學期階段給幾個可以馬上開始的題目。 */
export const generateIdeas = createServerFn({ method: "POST" })
  .validator((input: unknown) => unwrap(input, IdeaSchema))
  .handler(async ({ data }): Promise<IdeaResult> => {
    if (data.forceLocal || !aiAvailable()) {
      return { ok: false, error: "目前沒有連上 AI。", adapter: "local" };
    }
    const prompt = [
      buildZenContext({ audienceIds: data.audienceIds }),
      "",
      data.upcoming ? `【近期活動】${data.upcoming}` : "【近期活動】沒有排定的活動。",
      data.recentTopics.length ? `【最近發過】${data.recentTopics.join("、")}（不要重複）` : "",
      "",
      "【任務】給 4 個今天就可以開始做的內容題目，要適合現在這個學期階段。",
      `輸出 JSON：{ideas:[{title,hook,kind,why}]}，kind 只能用：${KIND_VALUES.join("、")}`,
      "hook 是第一句示範。why 用一句話說為什麼現在適合發這個。",
      "至少一個題目跟活動無關，是純生活或知識型內容。",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await zenChat({ prompt, maxTokens: 1400, temperature: 0.9 });
    if (!res.ok) {
      return { ok: false, error: res.error === "no-key" ? "目前沒有連上 AI" : res.error, adapter: "local" };
    }
    try {
      const parsed = IdeaJsonSchema.parse(extractJson(res.text));
      const ideas = parsed.ideas
        .filter((i) => i.title || i.hook)
        .map((i) => ({
          id: uid("idea"),
          title: i.title,
          hook: i.hook,
          kind: asContentKind(i.kind),
          why: i.why,
        }));
      if (!ideas.length) return { ok: false, error: "AI 回傳無法解析。", adapter: "local" };
      return { ok: true, ideas, adapter: "live" };
    } catch {
      return { ok: false, error: "AI 回傳無法解析。", adapter: "local" };
    }
  });
