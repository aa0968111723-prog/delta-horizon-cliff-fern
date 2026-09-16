import { convertPackOf, packRootId } from "./convert-pack.ts";
import { startOfLocalDay } from "./schedule.ts";
import type { Project } from "./types.ts";

export type ReadyPostReason = "done" | "today";

export type ReadyPost = {
  project: Project;
  reason: ReadyPostReason;
};

/** 完成、或排在今天／已過期還沒標發布的內容。首頁「今天可以發」用這個。 */
export function readyPostRows(projects: Project[], now = Date.now()): ReadyPost[] {
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
  return rows;
}

export function readyToPost(projects: Project[], now = Date.now()): ReadyPost[] {
  return readyPostRows(projects, now).slice(0, 3);
}

export type ReadyPack = {
  rootId: string;
  reason: ReadyPostReason;
  primary: Project;
  ready: Project[];
  pack: Project[];
};

/** 同一則做成的全套算一組，避免首頁被貼文／限動／LINE 佔滿。 */
export function readyPacks(projects: Project[], now = Date.now(), limit = 3): ReadyPack[] {
  const rows = readyPostRows(projects, now);
  const seen = new Set<string>();
  const packs: ReadyPack[] = [];
  for (const row of rows) {
    const rootId = packRootId(row.project);
    if (seen.has(rootId)) continue;
    seen.add(rootId);
    const pack = convertPackOf(projects, rootId);
    const readyIds = new Set(rows.filter((item) => packRootId(item.project) === rootId).map((item) => item.project.id));
    const ready = pack.filter((item) => readyIds.has(item.id));
    const primary = ready[0] ?? row.project;
    const reason = rows.some((item) => packRootId(item.project) === rootId && item.reason === "today") ? "today" : "done";
    packs.push({ rootId, reason, primary, ready, pack: pack.length ? pack : [row.project] });
    if (packs.length >= limit) break;
  }
  return packs;
}

export function readyPostLabel(reason: ReadyPostReason): string {
  return reason === "today" ? "今天要發" : "可以發了";
}

export type ProjectPack = {
  rootId: string;
  primary: Project;
  members: Project[];
  pack: Project[];
};

/** 從挑出的內容裡，同一則做成的全套只留一組。 */
export function groupPickedByPack(projects: Project[], picked: Project[], limit: number): ProjectPack[] {
  const seen = new Set<string>();
  const packs: ProjectPack[] = [];
  for (const project of picked) {
    const rootId = packRootId(project);
    if (seen.has(rootId)) continue;
    seen.add(rootId);
    const pack = convertPackOf(projects, rootId);
    const pickedIds = new Set(picked.filter((item) => packRootId(item) === rootId).map((item) => item.id));
    const members = (pack.length ? pack : [project]).filter((item) => pickedIds.has(item.id));
    packs.push({
      rootId,
      primary: members[0] ?? project,
      members: members.length ? members : [project],
      pack: pack.length ? pack : [project],
    });
    if (packs.length >= limit) break;
  }
  return packs;
}

/** 排在今天之後的內容。首頁「已排程」用這個，今天要發的留給上面那塊。 */
export function upcomingScheduledPacks(projects: Project[], now = Date.now(), limit = 4): ProjectPack[] {
  const end = startOfLocalDay(now) + 36 * 60 * 60 * 1000;
  const picked = projects
    .filter((project) => project.status === "scheduled" && project.scheduledAt != null && project.scheduledAt >= end)
    .sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0));
  return groupPickedByPack(projects, picked, limit);
}

/** 最近編輯，同一套只出現一張卡。 */
export function recentPacks(projects: Project[], limit = 6): ProjectPack[] {
  const picked = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);
  return groupPickedByPack(projects, picked, limit);
}

/** 已發布的內容，同一套併一列。 */
export function publishedPacks(projects: Project[], limit = 4): ProjectPack[] {
  const picked = projects
    .filter((project) => project.status === "published")
    .sort((a, b) => (b.publishedAt ?? b.updatedAt) - (a.publishedAt ?? a.updatedAt));
  return groupPickedByPack(projects, picked, limit);
}

/** 完成了但還沒排進日曆。排程頁「完成了、還沒排」用這個。 */
export function unscheduledDone(projects: Project[]): Project[] {
  return projects
    .filter((project) => project.status === "done" && project.scheduledAt == null)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);
}

export type WaitingPack = {
  rootId: string;
  primary: Project;
  waiting: Project[];
  pack: Project[];
};

/** 完成了、還沒排：同一套只出現一列。 */
export function unscheduledDonePacks(projects: Project[], limit = 3): WaitingPack[] {
  const waiting = projects
    .filter((project) => project.status === "done" && project.scheduledAt == null)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const seen = new Set<string>();
  const packs: WaitingPack[] = [];
  for (const project of waiting) {
    const rootId = packRootId(project);
    if (seen.has(rootId)) continue;
    seen.add(rootId);
    const pack = convertPackOf(projects, rootId);
    const members = pack.filter((item) => item.status === "done" && item.scheduledAt == null);
    packs.push({
      rootId,
      primary: members[0] ?? project,
      waiting: members.length ? members : [project],
      pack: pack.length ? pack : [project],
    });
    if (packs.length >= limit) break;
  }
  return packs;
}
