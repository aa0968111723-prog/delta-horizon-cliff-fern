import { coverFromSourceRefs } from "./ig-feed.ts";
import { isoFromMs } from "./schedule.ts";
import type { CalendarItem, ClubCampaign } from "./types.ts";
import type { Artboard, Project, SourceRef } from "../studio/types.ts";

export type CalendarProject = Pick<
  Project,
  "id" | "name" | "status" | "contentKind" | "scheduledAt" | "publishedAt" | "campaignId" | "sourceRefs"
> &
  Partial<Pick<Project, "artboards" | "activeFormatId">>;

function imageAssetFromBoard(board?: Artboard) {
  const layer = board?.layers.find((item) => item.type === "image");
  return layer?.type === "image" ? layer.assetId : undefined;
}

function imageAssetFromProject(project?: CalendarProject) {
  if (!project?.artboards) return undefined;
  const board =
    (project.activeFormatId ? project.artboards[project.activeFormatId] : undefined) ??
    Object.values(project.artboards)[0];
  return imageAssetFromBoard(board);
}

export function calendarCoverOf(input: {
  refs?: SourceRef[];
  project?: CalendarProject;
  campaign?: Pick<ClubCampaign, "coverAssetId" | "relatedAssetIds">;
}): Pick<CalendarItem, "coverAssetId" | "coverUrl" | "coverFromCanva"> {
  const refs = input.refs ?? input.project?.sourceRefs;
  const fromRefs = coverFromSourceRefs(refs);
  const coverAssetId =
    fromRefs.assetIds[0] ??
    imageAssetFromProject(input.project) ??
    input.campaign?.coverAssetId ??
    input.campaign?.relatedAssetIds[0] ??
    undefined;
  const fromCanva = Boolean(refs?.some((ref) => ref.source === "canva"));
  return {
    coverAssetId: coverAssetId || undefined,
    coverUrl: fromRefs.mediaUrl,
    coverFromCanva: fromCanva && Boolean(fromRefs.assetIds[0] || fromRefs.mediaUrl),
  };
}

export function calendarCoverIds(items: CalendarItem[]) {
  return [...new Set(items.map((item) => item.coverAssetId).filter((id): id is string => Boolean(id)))];
}

export function calendarFrom(campaigns: ClubCampaign[], projects: CalendarProject[]): CalendarItem[] {
  const items: CalendarItem[] = [];
  for (const campaign of campaigns) {
    items.push({
      id: `event-${campaign.id}`,
      date: campaign.date,
      title: campaign.name,
      kind: "event",
      status: "done",
      campaignId: campaign.id,
      ...calendarCoverOf({ campaign }),
    });
    for (const wave of campaign.waves) {
      if (!wave.scheduledAt) continue;
      const project = wave.projectId ? projects.find((item) => item.id === wave.projectId) : undefined;
      items.push({
        id: wave.id,
        date: isoFromMs(wave.scheduledAt),
        title: project?.name ?? `${wave.intent} · ${wave.topic}`,
        kind: project?.contentKind ?? wave.contentKind,
        status: wave.status,
        campaignId: campaign.id,
        waveId: wave.id,
        projectId: wave.projectId ?? undefined,
        publishedAt: wave.publishedAt ?? undefined,
        ...calendarCoverOf({ project, campaign }),
      });
    }
  }
  for (const project of projects) {
    if (!project.scheduledAt) continue;
    if (items.some((item) => item.projectId === project.id)) continue;
    const campaign = project.campaignId ? campaigns.find((item) => item.id === project.campaignId) : undefined;
    items.push({
      id: `proj-${project.id}`,
      date: isoFromMs(project.scheduledAt),
      title: project.name,
      kind: project.contentKind,
      status: project.status,
      projectId: project.id,
      campaignId: project.campaignId ?? undefined,
      publishedAt: project.publishedAt ?? undefined,
      ...calendarCoverOf({ project, campaign }),
    });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}
