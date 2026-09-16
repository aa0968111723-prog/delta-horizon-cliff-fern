import type { ContentKind, ContentStatus, DeliverableFlags, FormatId, Project } from "./types";

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

/** 一人網宣：做完 → 排程 → 發出去。沒有審核。 */
export type FlowActionId = "making" | "done" | "scheduled" | "published" | "unschedule" | "unpublish";

export type FlowAction = {
  id: FlowActionId;
  label: string;
  hint: string;
};

export function flowActions(status: ContentStatus): FlowAction[] {
  if (status === "published") {
    return [{ id: "unpublish", label: "還沒發", hint: "改回完成，還可以再改。" }];
  }
  if (status === "scheduled") {
    return [
      { id: "published", label: "已發出去", hint: "在 IG 貼完之後點這個。" },
      { id: "unschedule", label: "取消排程", hint: "從日曆拿下來。" },
    ];
  }
  if (status === "done") {
    return [
      { id: "scheduled", label: "排到日曆", hint: "選一個晚上發。" },
      { id: "published", label: "已發出去", hint: "已經貼到 IG 了。" },
      { id: "making", label: "還要改", hint: "改回創作中。" },
    ];
  }
  return [
    { id: "done", label: "這則完成了", hint: "可以發了。" },
    { id: "scheduled", label: "排到日曆", hint: "直接排時間。" },
    { id: "published", label: "已發出去", hint: "已經貼到 IG 了。" },
  ];
}

export function primaryFlowAction(status: ContentStatus): FlowAction | null {
  return flowActions(status)[0] ?? null;
}

export function applyFlowToProject(
  project: Pick<Project, "status" | "scheduledAt" | "publishedAt">,
  action: FlowActionId,
  at: number,
): Pick<Project, "status" | "scheduledAt" | "publishedAt"> {
  switch (action) {
    case "making":
      return { status: "making", scheduledAt: project.scheduledAt, publishedAt: project.publishedAt };
    case "done":
      return { status: "done", scheduledAt: null, publishedAt: project.publishedAt };
    case "scheduled":
      return { status: "scheduled", scheduledAt: at, publishedAt: project.publishedAt };
    case "published":
      return { status: "published", scheduledAt: project.scheduledAt, publishedAt: at };
    case "unschedule":
      return { status: "done", scheduledAt: null, publishedAt: project.publishedAt };
    case "unpublish":
      return {
        status: project.scheduledAt ? "scheduled" : "done",
        scheduledAt: project.scheduledAt,
        publishedAt: project.publishedAt,
      };
  }
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
  line: { label: "LINE 宣傳圖", hint: "群組轉發用，橫式 1.91:1，時間地點一眼看完。", formatId: "feed-landscape", slides: 1 },
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

/** 畫面編輯頁列名稱：限動／知識卡不是輪播，單張貼文也不是。 */
export function slideBarKindLabel(kind: ContentKind): string {
  switch (kind) {
    case "story":
    case "countdown":
    case "poll":
      return "限動";
    case "carousel":
      return "輪播";
    case "knowledge":
      return "知識卡";
    case "recap":
      return "回顧";
    case "qa":
      return "Q&A";
    default:
      return "各頁";
  }
}

/** 只有輪播才展開成六頁腳本。限動三到五張，不要套輪播展開。 */
export function slideBarCanExpand(kind: ContentKind): boolean {
  return kind === "carousel";
}

export function isContentKind(value: unknown): value is ContentKind {
  return typeof value === "string" && value in CONTENT_KIND_META;
}

/** 輪播、知識卡、回顧、限動這類要拆成多頁，不能只留一張圖。 */
export function kindUsesPagedLayout(kind: ContentKind): boolean {
  return CONTENT_KIND_META[kind].slides > 1;
}

/** 依內容型態勾選 brief.deliverables，首頁／活動／轉換共用。 */
export function deliverablesForKind(kind: ContentKind): DeliverableFlags {
  return {
    post: kind === "ig-post",
    story: kind === "story" || kind === "countdown" || kind === "poll",
    carousel: kind === "carousel" || kind === "knowledge" || kind === "qa" || kind === "recap",
    reels: kind === "reels",
  };
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
  if (formatId === "feed-landscape") return "line";
  if (slideCount > 1) return "carousel";
  return "ig-post";
}
