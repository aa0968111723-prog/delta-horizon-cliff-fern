import type { ProjectStatus } from "./types";

export const STATUS_META: Record<
  ProjectStatus,
  { label: string; tone: "default" | "warn" | "success" | "accent" }
> = {
  idea: { label: "想法", tone: "default" },
  creating: { label: "創作中", tone: "warn" },
  complete: { label: "完成", tone: "accent" },
  scheduled: { label: "已排程", tone: "accent" },
  published: { label: "已發布", tone: "success" },
};

export function migrateStatus(raw?: string | null): ProjectStatus {
  if (raw === "idea" || raw === "creating" || raw === "done" || raw === "scheduled" || raw === "published") {
    return raw;
  }
  if (raw === "draft") return "creating";
  if (raw === "ready") return "done";
  if (raw === "exported") return "published";
  return "creating";
}

export const STATUS_FLOW: ProjectStatus[] = ["idea", "creating", "done", "scheduled", "published"];
