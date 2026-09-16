import { contentStatusMeta } from "./content";
import type { ContentStatus, ProjectStatus } from "./types";

export const STATUS_META: Record<
  ProjectStatus,
  { label: string; tone: "default" | "warn" | "success" | "accent" }
> = {
  draft: { label: "創作中", tone: "warn" },
  ready: { label: "完成", tone: "accent" },
  exported: { label: "已發布", tone: "success" },
};

export function statusLabel(status: ProjectStatus, contentStatus?: ContentStatus) {
  if (contentStatus) return contentStatusMeta(contentStatus).label;
  return STATUS_META[status].label;
}

export function statusTone(status: ProjectStatus, contentStatus?: ContentStatus) {
  if (contentStatus) return contentStatusMeta(contentStatus).tone;
  return STATUS_META[status].tone;
}
