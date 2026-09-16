import type { ContentKind, ContentStatus, Project, ProjectStatus } from "./types";

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

const CURRENT: ProjectStatus[] = ["idea", "creating", "complete", "scheduled", "published"];

export function isProjectStatus(value: string | undefined): value is ProjectStatus {
  return Boolean(value && CURRENT.includes(value as ProjectStatus));
}

/** Map pre-禪作所 persist values without inventing a published IG post. */
export function migrateProjectStatus(status: string | undefined, hasPlan: boolean): ProjectStatus {
  if (isProjectStatus(status)) return status;
  if (status === "draft") return hasPlan ? "creating" : "idea";
  if (status === "ready" || status === "exported") return "complete";
  return hasPlan ? "complete" : "idea";
}
