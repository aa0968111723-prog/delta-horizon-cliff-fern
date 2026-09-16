import type { ContentKind, Project, ProjectStatus } from "../studio/types.ts";
import { isoFromMs } from "./schedule.ts";
import { captionFromProject, mediaTypeFromKind } from "./publish.ts";
import type { IgMemoryPost } from "./types.ts";

const IG_GRID_KINDS = new Set<ContentKind>([
  "ig-post",
  "carousel",
  "story",
  "reels",
  "countdown",
  "recap",
  "member-story",
  "qa",
  "poll",
  "knowledge",
]);

export type IgGridSlot = {
  id: string;
  origin: "upcoming" | "published";
  title: string;
  caption: string;
  takenAt: number;
  projectId?: string;
  postId?: string;
  assetIds: string[];
  mediaType: IgMemoryPost["mediaType"];
  mediaUrl?: string;
  status?: ProjectStatus;
  scheduledAt?: number | null;
  analysis?: IgMemoryPost["analysis"];
  saves?: number;
  comments?: number;
  reach?: number;
  shares?: number;
};

type ProjectSlice = Pick<
  Project,
  "id" | "name" | "status" | "contentKind" | "scheduledAt" | "copy"
>;

export function upcomingSlotId(projectId: string) {
  return `up-${projectId}`;
}

export function upcomingStatusCopy(input: { status?: ProjectStatus; takenAt: number; scheduledAt?: number | null }) {
  const at = input.scheduledAt ?? (input.status === "scheduled" ? input.takenAt : null);
  if (at) {
    return `排在 ${isoFromMs(at).slice(5).replace("-", "/")} · 還沒進帳號`;
  }
  return "還沒排程 · 先看 Grid，再排進月曆";
}

/** 即將發的排在 Grid 最前，再接過去貼文。LINE／海報不進 IG Grid。 */
export function igGridSlots(input: { projects: ProjectSlice[]; posts: IgMemoryPost[] }): IgGridSlot[] {
  const upcoming = input.projects
    .filter((project) => (project.status === "scheduled" || project.status === "done") && IG_GRID_KINDS.has(project.contentKind))
    .sort((a, b) => (a.scheduledAt ?? Number.MAX_SAFE_INTEGER) - (b.scheduledAt ?? Number.MAX_SAFE_INTEGER))
    .map(
      (project): IgGridSlot => ({
        id: upcomingSlotId(project.id),
        origin: "upcoming",
        title: project.name,
        caption: captionFromProject(project),
        takenAt: project.scheduledAt ?? Date.now(),
        projectId: project.id,
        assetIds: [],
        mediaType: mediaTypeFromKind(project.contentKind),
        status: project.status,
        scheduledAt: project.scheduledAt,
      }),
    );

  const published = [...input.posts]
    .sort((a, b) => b.takenAt - a.takenAt)
    .map(
      (post): IgGridSlot => ({
        id: post.id,
        origin: "published",
        title: post.caption.split("\n")[0] ?? "IG",
        caption: post.caption,
        takenAt: post.takenAt,
        postId: post.id,
        assetIds: post.assetIds,
        mediaType: post.mediaType,
        mediaUrl: post.mediaUrl,
        status: "published",
        analysis: post.analysis,
        saves: post.saves,
        comments: post.comments,
        reach: post.reach,
        shares: post.shares,
      }),
    );

  return [...upcoming, ...published];
}
