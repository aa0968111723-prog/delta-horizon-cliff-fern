import type {
  ContentKind,
  ContentStatus,
  EventKind,
  FormatId,
  Project,
  ProjectStatus,
} from "./types";

export const CONTENT_KINDS: { id: ContentKind; label: string; hint: string }[] = [
  { id: "ig-post", label: "IG 貼文", hint: "單張主視覺" },
  { id: "carousel", label: "Carousel", hint: "多頁說完一件事" },
  { id: "story", label: "Story", hint: "3–5 則限動" },
  { id: "reels", label: "Reels", hint: "短影音腳本與影片" },
  { id: "threads", label: "Threads", hint: "短文延續" },
  { id: "line", label: "LINE", hint: "社團群組宣傳圖" },
  { id: "poster", label: "海報", hint: "活動主視覺" },
  { id: "recap", label: "活動回顧", hint: "當天之後" },
  { id: "member-story", label: "社員故事", hint: "人的聲音" },
  { id: "countdown", label: "倒數", hint: "出發前提醒" },
  { id: "qa", label: "Q&A", hint: "解惑" },
  { id: "poll", label: "互動投票", hint: "限動互動" },
  { id: "knowledge", label: "知識內容", hint: "生活裡的禪" },
];

export const CONTENT_STATUS: {
  id: ContentStatus;
  label: string;
  tone: "default" | "warn" | "success" | "accent";
}[] = [
  { id: "idea", label: "想法", tone: "default" },
  { id: "creating", label: "創作中", tone: "warn" },
  { id: "done", label: "完成", tone: "accent" },
  { id: "scheduled", label: "已排程", tone: "accent" },
  { id: "published", label: "已發布", tone: "success" },
];

export const EVENT_KINDS: { id: EventKind; label: string }[] = [
  { id: "tea", label: "茶會" },
  { id: "sitting", label: "靜坐／坐下來" },
  { id: "light", label: "光／夜晚活動" },
  { id: "workshop", label: "社課／工作坊" },
  { id: "recruit", label: "招生" },
  { id: "talk", label: "分享／對談" },
  { id: "other", label: "其他" },
];

export function contentKindLabel(id: ContentKind) {
  return CONTENT_KINDS.find((item) => item.id === id)?.label ?? id;
}

export function contentStatusMeta(id: ContentStatus) {
  return CONTENT_STATUS.find((item) => item.id === id) ?? CONTENT_STATUS[1];
}

export function contentStatusLabel(id: ContentStatus) {
  return contentStatusMeta(id).label;
}

export function eventKindLabel(id: EventKind) {
  return EVENT_KINDS.find((item) => item.id === id)?.label ?? id;
}

export function statusFromLegacy(status: ProjectStatus, scheduledAt?: number | null): ContentStatus {
  if (scheduledAt) return "scheduled";
  if (status === "exported") return "published";
  if (status === "ready") return "done";
  return "creating";
}

export function legacyFromContent(status: ContentStatus): ProjectStatus {
  if (status === "published") return "exported";
  if (status === "done" || status === "scheduled") return "ready";
  return "draft";
}

export function kindFromFormat(formatId: FormatId, carousel: boolean): ContentKind {
  if (formatId === "story") return "story";
  if (formatId === "reels-cover") return "reels";
  if (formatId === "threads") return "threads";
  if (formatId === "line") return "line";
  if (carousel) return "carousel";
  return "ig-post";
}

export function inferContentKind(project: Pick<Project, "activeFormatId" | "brief" | "slides">): ContentKind {
  const pages = project.slides?.[project.activeFormatId]?.length ?? 0;
  const carousel = Boolean(project.brief?.deliverables?.carousel) || pages > 1;
  return kindFromFormat(project.activeFormatId, carousel);
}
