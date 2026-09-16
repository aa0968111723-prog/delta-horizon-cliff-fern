import type { ContentKind, Project } from "./types.ts";

const HIGHLIGHT_KINDS = new Set<ContentKind>(["story", "countdown", "poll", "reels"]);

export type IgHighlight = {
  id: string;
  label: string;
  projectId: string;
  kind: ContentKind;
};

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

export function igFeedPostCount(projects: Array<Pick<Project, "status" | "contentKind">>): number {
  return projects.filter((project) => project.status !== "idea" && !HIGHLIGHT_KINDS.has(project.contentKind)).length;
}
