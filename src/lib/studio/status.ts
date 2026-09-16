import type { ContentKind, ContentStatus, Project, ProjectStatus } from "./types";

export const STATUS_META: Record<
  ProjectStatus,
  { label: string; tone: "default" | "warn" | "success" | "accent" }
> = {
  draft: { label: "創作中", tone: "warn" },
  ready: { label: "完成", tone: "accent" },
  exported: { label: "已發布", tone: "success" },
};

export const CONTENT_STATUS_META: Record<
  ContentStatus,
  { label: string; tone: "default" | "warn" | "success" | "accent" }
> = {
  idea: { label: "想法", tone: "default" },
  creating: { label: "創作中", tone: "warn" },
  done: { label: "完成", tone: "accent" },
  scheduled: { label: "已排程", tone: "accent" },
  published: { label: "已發布", tone: "success" },
};

export const CONTENT_KIND_META: Record<ContentKind, { label: string }> = {
  "ig-post": { label: "IG 貼文" },
  carousel: { label: "Carousel" },
  story: { label: "Story" },
  reels: { label: "Reels" },
  threads: { label: "Threads" },
  line: { label: "LINE" },
  poster: { label: "海報" },
  recap: { label: "活動回顧" },
  "member-story": { label: "社員故事" },
  countdown: { label: "倒數" },
  qa: { label: "Q&A" },
  poll: { label: "互動投票" },
  knowledge: { label: "知識內容" },
};

export function contentStatusOf(project: Project): ContentStatus {
  if (project.contentStatus) return project.contentStatus;
  if (project.status === "exported") return "published";
  if (project.status === "ready") return project.scheduledAt ? "scheduled" : "done";
  return project.plan ? "creating" : "idea";
}

export function contentKindFromBrief(project: Pick<Project, "brief" | "contentKind">): ContentKind {
  if (project.contentKind) return project.contentKind;
  const d = project.brief?.deliverables;
  if (d?.carousel) return "carousel";
  if (d?.reels) return "reels";
  if (d?.story) return "story";
  return "ig-post";
}
