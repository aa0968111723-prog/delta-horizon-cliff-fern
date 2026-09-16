import { CONVERT_TARGETS } from "./convert-copy.ts";
import type { ContentKind, Project } from "./types.ts";

export function packRootId(project: Pick<Project, "id" | "convertedFromId">): string {
  return project.convertedFromId ?? project.id;
}

/**
 * 同一則內容做成的全套：原本那則加上從它轉換出來的貼文／輪播／限動／Threads／LINE／Reels。
 * 同一型態只留最新的一則，避免重複轉換堆很多份。
 */
export function convertPackOf<T extends Pick<Project, "id" | "contentKind" | "convertedFromId" | "updatedAt">>(
  projects: T[],
  projectId: string,
): T[] {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return [];
  const rootId = packRootId(project);
  const members = projects.filter((item) => item.id === rootId || item.convertedFromId === rootId);
  const byKind = new Map<ContentKind, T>();
  for (const item of [...members].sort((a, b) => b.updatedAt - a.updatedAt)) {
    if (!byKind.has(item.contentKind)) byKind.set(item.contentKind, item);
  }
  const order = CONVERT_TARGETS.map((item) => item.id);
  return [...byKind.values()].sort((a, b) => {
    const ai = order.indexOf(a.contentKind);
    const bi = order.indexOf(b.contentKind);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
}

/** 這則全套裡還沒有的型態。一次做成全套時只補這些，不會再複製一份 LINE。 */
export function missingConvertTargets(
  project: Pick<Project, "id" | "convertedFromId">,
  projects: Array<Pick<Project, "id" | "contentKind" | "convertedFromId" | "updatedAt">>,
) {
  const have = new Set(convertPackOf(projects, project.id).map((item) => item.contentKind));
  return CONVERT_TARGETS.filter((item) => !have.has(item.id));
}
