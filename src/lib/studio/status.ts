import type { ProjectStatus } from "./types";

export const STATUS_META: Record<
  ProjectStatus,
  { label: string; tone: "default" | "warn" | "success" | "accent" }
> = {
  draft: { label: "草稿", tone: "warn" },
  ready: { label: "可輸出", tone: "accent" },
  exported: { label: "已輸出", tone: "success" },
};
