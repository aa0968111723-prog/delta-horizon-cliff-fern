import { startOfLocalDay } from "./schedule.ts";
import type { Project } from "./types.ts";

export type ReadyPostReason = "done" | "today";

export type ReadyPost = {
  project: Project;
  reason: ReadyPostReason;
};

/** 完成、或排在今天／已過期還沒標發布的內容。首頁「今天可以發」用這個。 */
export function readyToPost(projects: Project[], now = Date.now()): ReadyPost[] {
  const end = startOfLocalDay(now) + 36 * 60 * 60 * 1000;
  const rows: ReadyPost[] = [];
  for (const project of projects) {
    if (project.status === "published" || project.status === "idea") continue;
    if (project.status === "done") {
      rows.push({ project, reason: "done" });
      continue;
    }
    if (project.status === "scheduled" && project.scheduledAt != null && project.scheduledAt < end) {
      rows.push({ project, reason: "today" });
    }
  }
  rows.sort((a, b) => {
    if (a.reason !== b.reason) return a.reason === "today" ? -1 : 1;
    const aAt = a.project.scheduledAt ?? a.project.updatedAt;
    const bAt = b.project.scheduledAt ?? b.project.updatedAt;
    return aAt - bAt;
  });
  return rows.slice(0, 3);
}

export function readyPostLabel(reason: ReadyPostReason): string {
  return reason === "today" ? "今天要發" : "可以發了";
}
