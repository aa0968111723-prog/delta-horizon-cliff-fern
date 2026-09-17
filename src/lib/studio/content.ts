import type { ContentKind, FormatId, Project, ProjectStatus } from "./types";

export const CONTENT_KINDS: { id: ContentKind; label: string }[] = [
  { id: "ig-post", label: "IG 貼文" },
  { id: "carousel", label: "Carousel" },
  { id: "story", label: "Story" },
  { id: "reels", label: "Reels" },
  { id: "threads", label: "Threads" },
  { id: "line", label: "LINE" },
  { id: "poster", label: "海報" },
  { id: "recap", label: "活動回顧" },
  { id: "member-story", label: "社員故事" },
  { id: "countdown", label: "倒數" },
  { id: "qa", label: "Q&A" },
  { id: "poll", label: "互動投票" },
  { id: "knowledge", label: "知識內容" },
];

export const CONTENT_KIND_META: Record<ContentKind, { label: string }> = Object.fromEntries(
  CONTENT_KINDS.map((item) => [item.id, { label: item.label }]),
) as Record<ContentKind, { label: string }>;

export function contentKindLabel(id: ContentKind) {
  return CONTENT_KINDS.find((item) => item.id === id)?.label ?? id;
}

export function formatForKind(kind: ContentKind): FormatId {
  if (kind === "story" || kind === "countdown") return "story";
  if (kind === "reels") return "reels-cover";
  if (kind === "threads") return "threads";
  if (kind === "line" || kind === "poster") return "line";
  return "feed-portrait";
}

export function kindFromFormat(formatId: FormatId): ContentKind {
  if (formatId === "story") return "story";
  if (formatId === "reels-cover") return "reels";
  if (formatId === "threads") return "threads";
  if (formatId === "line") return "line";
  return "ig-post";
}

export function inferContentKind(project: Pick<Project, "activeFormatId" | "slides" | "contentKind">): ContentKind {
  if (project.contentKind) return project.contentKind;
  const pages = project.slides?.[project.activeFormatId];
  if ((pages?.length ?? 0) > 1) return "carousel";
  return kindFromFormat(project.activeFormatId);
}

export function migrateStatus(raw?: string | null): ProjectStatus {
  if (raw === "draft") return "creating";
  if (raw === "ready") return "done";
  if (raw === "exported") return "published";
  if (raw === "idea" || raw === "creating" || raw === "done" || raw === "scheduled" || raw === "published") {
    return raw;
  }
  return "creating";
}

export const COPY_TONES = [
  { id: "short", label: "短版" },
  { id: "normal", label: "一般版" },
  { id: "emotional", label: "感性版" },
  { id: "student", label: "學生版" },
  { id: "life", label: "生活版" },
  { id: "humor", label: "幽默版" },
] as const;

export type CopyToneId = (typeof COPY_TONES)[number]["id"];
