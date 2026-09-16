import type { ContentKind, ContentStatus, FormatId } from "./types";

export const STATUS_META: Record<
  ContentStatus,
  { label: string; tone: "default" | "warn" | "success" | "accent"; hint: string }
> = {
  idea: { label: "想法", tone: "default", hint: "只有一句方向，還沒開始寫。" },
  making: { label: "創作中", tone: "warn", hint: "文案或畫面正在做。" },
  done: { label: "完成", tone: "accent", hint: "可以發了，還沒排時間。" },
  scheduled: { label: "已排程", tone: "accent", hint: "已經排進日曆。" },
  published: { label: "已發布", tone: "success", hint: "已經發出去了。" },
};

export const STATUS_ORDER: ContentStatus[] = ["idea", "making", "done", "scheduled", "published"];

export function statusLabel(status: ContentStatus): string {
  return STATUS_META[status].label;
}

export const CONTENT_KIND_META: Record<
  ContentKind,
  { label: string; hint: string; formatId: FormatId; slides: number }
> = {
  "ig-post": { label: "IG 貼文", hint: "單張 4:5，最大曝光。", formatId: "feed-portrait", slides: 1 },
  carousel: { label: "輪播", hint: "多頁把一件事講完。", formatId: "feed-portrait", slides: 5 },
  story: { label: "限時動態", hint: "9:16，三到五張。", formatId: "story", slides: 3 },
  reels: { label: "Reels", hint: "短影音腳本＋封面。", formatId: "reels-cover", slides: 1 },
  threads: { label: "Threads", hint: "純文字為主，語氣更口語。", formatId: "feed-square", slides: 1 },
  line: { label: "LINE 宣傳圖", hint: "群組轉發用，資訊要一眼看完。", formatId: "feed-square", slides: 1 },
  poster: { label: "海報", hint: "實體或系板張貼。", formatId: "feed-portrait", slides: 1 },
  recap: { label: "活動回顧", hint: "活動後兩天內發效果最好。", formatId: "feed-portrait", slides: 3 },
  "member-story": { label: "社員故事", hint: "真人真話，最能建立信任。", formatId: "feed-portrait", slides: 1 },
  countdown: { label: "倒數", hint: "限動為主，短。", formatId: "story", slides: 1 },
  qa: { label: "Q&A", hint: "回答「第一次來會怎樣」。", formatId: "feed-square", slides: 3 },
  poll: { label: "互動投票", hint: "限動投票貼圖，累積互動。", formatId: "story", slides: 1 },
  knowledge: { label: "知識內容", hint: "可收藏的內容，養帳號。", formatId: "feed-portrait", slides: 4 },
};

export const CONTENT_KIND_ORDER: ContentKind[] = [
  "ig-post",
  "carousel",
  "story",
  "reels",
  "threads",
  "line",
  "knowledge",
  "recap",
  "member-story",
  "countdown",
  "qa",
  "poll",
  "poster",
];

export function contentKindLabel(kind: ContentKind): string {
  return CONTENT_KIND_META[kind]?.label ?? "內容";
}

export function isContentKind(value: unknown): value is ContentKind {
  return typeof value === "string" && value in CONTENT_KIND_META;
}

export function isContentStatus(value: unknown): value is ContentStatus {
  return typeof value === "string" && value in STATUS_META;
}

/** 舊資料（draft / ready / exported）轉成新的五狀態。 */
export function migrateStatus(raw: unknown, hasPlan: boolean): ContentStatus {
  if (isContentStatus(raw)) return raw;
  if (raw === "exported" || raw === "ready") return "done";
  if (raw === "draft") return hasPlan ? "making" : "idea";
  return hasPlan ? "making" : "idea";
}

/** 從尺寸與頁數猜內容型態，用在舊資料遷移。 */
export function inferContentKind(formatId: FormatId, slideCount: number): ContentKind {
  if (formatId === "story") return slideCount > 1 ? "story" : "countdown";
  if (formatId === "reels-cover") return "reels";
  if (slideCount > 1) return "carousel";
  return "ig-post";
}
