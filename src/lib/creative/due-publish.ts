import type { ContentKind, Project, ProjectStatus } from "../studio/types.ts";
import { coverFromSourceRefs } from "./ig-feed.ts";
import { captionFromProject } from "./publish.ts";
import { applyMarkPublished } from "./publish-flow.ts";
import { isoFromMs } from "./schedule.ts";
import type { ClubCampaign, IgMemoryPost } from "./types.ts";

const READY: ProjectStatus[] = ["scheduled", "done"];

export type DueTarget = {
  campaignId?: string;
  waveId?: string;
  projectId?: string;
  title: string;
  caption: string;
  kind: ContentKind;
  scheduledAt: number;
  imageUrl?: string;
  assetIds?: string[];
};

type ProjectSlice = Pick<
  Project,
  "id" | "name" | "status" | "contentKind" | "campaignId" | "scheduledAt" | "publishedAt" | "sourceRefs" | "copy"
>;

function isReady(status: ProjectStatus) {
  return READY.includes(status);
}

function coverOf(project?: ProjectSlice) {
  const cover = coverFromSourceRefs(project?.sourceRefs);
  return { imageUrl: cover.mediaUrl, assetIds: cover.assetIds };
}

function captionOf(waveTopic: string, project?: ProjectSlice) {
  if (project) {
    const text = captionFromProject(project);
    if (text.trim()) return text;
  }
  return waveTopic;
}

/** 已排程／已完成、時間已到、還沒發布。想法與創作中不會自動發出。 */
export function duePublishTargets(input: {
  campaigns: ClubCampaign[];
  projects: ProjectSlice[];
  now?: number;
  sameDay?: boolean;
}): DueTarget[] {
  const now = input.now ?? Date.now();
  const today = isoFromMs(now);
  const projects = new Map(input.projects.map((project) => [project.id, project]));
  const targets: DueTarget[] = [];
  const seenProjects = new Set<string>();

  function isDue(scheduledAt: number | null | undefined) {
    if (!scheduledAt) return false;
    if (input.sameDay) return isoFromMs(scheduledAt) <= today;
    return scheduledAt <= now;
  }

  for (const campaign of input.campaigns) {
    for (const wave of campaign.waves) {
      if (!isReady(wave.status) || wave.status === "published") continue;
      if (!isDue(wave.scheduledAt)) continue;
      const project = wave.projectId ? projects.get(wave.projectId) : undefined;
      const title = wave.topic || project?.name || campaign.name;
      const cover = coverOf(project);
      targets.push({
        campaignId: campaign.id,
        waveId: wave.id,
        projectId: wave.projectId ?? project?.id,
        title,
        caption: captionOf(title, project),
        kind: wave.contentKind,
        scheduledAt: wave.scheduledAt ?? now,
        imageUrl: cover.imageUrl,
        assetIds: cover.assetIds,
      });
      if (wave.projectId) seenProjects.add(wave.projectId);
    }
  }

  for (const project of input.projects) {
    if (project.publishedAt || project.status === "published") continue;
    const alreadyOut = input.campaigns.some((campaign) =>
      campaign.waves.some((wave) => wave.projectId === project.id && wave.status === "published"),
    );
    if (alreadyOut) continue;
    if (!isReady(project.status)) continue;
    if (!isDue(project.scheduledAt)) continue;
    if (seenProjects.has(project.id)) continue;
    const cover = coverOf(project);
    targets.push({
      campaignId: project.campaignId ?? undefined,
      projectId: project.id,
      title: project.name,
      caption: captionOf(project.name, project),
      kind: project.contentKind,
      scheduledAt: project.scheduledAt ?? now,
      imageUrl: cover.imageUrl,
      assetIds: cover.assetIds,
    });
    seenProjects.add(project.id);
  }

  return targets;
}

export function dueTodayTargets(input: {
  campaigns: ClubCampaign[];
  projects: ProjectSlice[];
  now?: number;
}) {
  return duePublishTargets({ ...input, sameDay: true });
}

export function applyDuePublished(input: {
  campaigns: ClubCampaign[];
  targets: DueTarget[];
  now?: number;
}): { campaigns: ClubCampaign[]; posts: IgMemoryPost[] } {
  let campaigns = input.campaigns;
  const posts: IgMemoryPost[] = [];
  const now = input.now ?? Date.now();
  for (const target of input.targets) {
    const result = applyMarkPublished({
      campaigns,
      campaignId: target.campaignId,
      waveId: target.waveId,
      projectId: target.projectId,
      title: target.title,
      caption: target.caption,
      kind: target.kind,
      assetIds: target.assetIds,
      mediaUrl: target.imageUrl,
      now,
    });
    if (!result) continue;
    campaigns = result.campaigns;
    posts.push(result.post);
  }
  return { campaigns, posts };
}
