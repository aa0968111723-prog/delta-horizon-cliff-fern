import type { ProjectStatus } from "./types";

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
