import type { ContentKind, Project } from "./types.ts";

const HIGHLIGHT_KINDS = new Set<ContentKind>(["story", "countdown", "poll", "reels"]);
/** Threads／LINE 不是 IG 九宮格上的貼文。 */
const OFF_GRID_KINDS = new Set<ContentKind>(["threads", "line"]);

export type IgHighlight = {
  id: string;
  label: string;
  projectId: string;
  kind: ContentKind;
};

export function isHighlightKind(kind: ContentKind): boolean {
  return HIGHLIGHT_KINDS.has(kind);
}

/** IG 個人頁九宮格／動態：貼文、輪播、知識卡；不含限動、Reels、Threads、LINE。 */
export function isIgFeedKind(kind: ContentKind): boolean {
  return !HIGHLIGHT_KINDS.has(kind) && !OFF_GRID_KINDS.has(kind);
}

export function igHighlights(
  projects: Array<Pick<Project, "id" | "name" | "contentKind" | "copy" | "status">>,
): IgHighlight[] {
  const seen = new Set<string>();
  const out: IgHighlight[] = [];
  for (const project of projects) {
    if (project.status === "idea") continue;
    if (!HIGHLIGHT_KINDS.has(project.contentKind)) continue;
    const label = (project.copy.headline || project.name).replace(/\s+/g, " ").trim().slice(0, 6);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push({ id: project.id, label, projectId: project.id, kind: project.contentKind });
    if (out.length >= 6) break;
  }
  return out;
}

export function igGridProjects<T extends Pick<Project, "status" | "contentKind">>(projects: T[]): T[] {
  return projects.filter((project) => project.status !== "idea" && isIgFeedKind(project.contentKind));
}

export function igFeedPostCount(projects: Array<Pick<Project, "status" | "contentKind">>): number {
  return igGridProjects(projects).length;
}

/** 限動／Reels 直式預覽：跳過還只是想法的。 */
export function storyPreviewProjects<T extends Pick<Project, "status" | "contentKind">>(projects: T[]): T[] {
  return projects.filter((project) => project.status !== "idea" && HIGHLIGHT_KINDS.has(project.contentKind));
}

/** 編輯裡「用 IG 看」：限動走 9:16，貼文走 4:5。Threads／LINE 不是 IG 畫面。 */
export function igPeekMode(kind: ContentKind): "story" | "feed" | null {
  if (isHighlightKind(kind)) return "story";
  if (isIgFeedKind(kind)) return "feed";
  return null;
}

/** 精選圓圈點開時，從那一則開始看。找不到就從頭。 */
export function indexOfId<T extends { id: string }>(rows: T[], id: string | null | undefined): number {
  if (!id) return 0;
  const index = rows.findIndex((row) => row.id === id);
  return index >= 0 ? index : 0;
}
