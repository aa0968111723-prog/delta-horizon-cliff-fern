import { contentKindLabel } from "./content";
import type { ContentKind, ContentStatus, ProjectStatus } from "./types";

export { CONTENT_KIND_META, contentKindLabel, inferContentKind, migrateStatus } from "./content";

export const STATUS_META: Record<
  ProjectStatus,
  { label: string; tone: "default" | "warn" | "success" | "accent" }
> = {
  idea: { label: "想法", tone: "default" },
  creating: { label: "創作中", tone: "warn" },
  done: { label: "完成", tone: "accent" },
  scheduled: { label: "已排程", tone: "accent" },
  published: { label: "已發布", tone: "success" },
};

const CONTENT_STATUS_META: Record<
  ContentStatus,
  { label: string; tone: "default" | "warn" | "success" | "accent" }
> = {
  idea: { label: "想法", tone: "default" },
  drafting: { label: "創作中", tone: "warn" },
  done: { label: "完成", tone: "accent" },
  scheduled: { label: "已排程", tone: "accent" },
  published: { label: "已發布", tone: "success" },
};

function resolveMeta(status: ProjectStatus, contentStatus?: ContentStatus) {
  if (contentStatus && CONTENT_STATUS_META[contentStatus]) return CONTENT_STATUS_META[contentStatus];
  return STATUS_META[status] ?? STATUS_META.creating;
}

export function statusLabel(status: ProjectStatus, contentStatus?: ContentStatus) {
  return resolveMeta(status, contentStatus).label;
}

export function statusTone(status: ProjectStatus, contentStatus?: ContentStatus) {
  return resolveMeta(status, contentStatus).tone;
}

export function slideBarKindLabel(kind?: ContentKind | null) {
  return kind ? contentKindLabel(kind) : "頁面";
}

export function slideBarCanExpand(kind?: ContentKind | null) {
  return kind === "carousel" || kind === "ig-post" || !kind;
}
