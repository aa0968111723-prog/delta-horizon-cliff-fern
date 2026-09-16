import { create } from "zustand";
import { persist } from "zustand/middleware";
import { bindScheduledWave as placeOnWave, suggestWaves, isoFromMs } from "@/lib/creative/schedule";
import { lastLearnFromPosts } from "@/lib/club/insights";
import { mergeIgPosts } from "@/lib/creative/ig-memory";
import { applyMarkPublished } from "@/lib/creative/publish-flow";
import {
  SEED_CAMPAIGNS,
  SEED_CONNECTIONS,
  SEED_IG_POSTS,
  SEED_INSPIRATION,
  SEED_MEMORY,
} from "@/lib/creative/memory-seed";
import type {
  CalendarItem,
  ClubCampaign,
  ConnectionId,
  ConnectionState,
  IgMemoryPost,
  Inspiration,
  LastLearn,
  MemoryItem,
} from "@/lib/creative/types";
import { uid } from "@/lib/studio/ids";
import type { ContentKind, Project, ProjectStatus } from "@/lib/studio/types";
import { CAMPAIGN_TYPES, type CampaignType } from "@/lib/creative/types";

export { CAMPAIGN_TYPES };

type CreativeState = {
  hydrated: boolean;
  campaigns: ClubCampaign[];
  memory: MemoryItem[];
  igPosts: IgMemoryPost[];
  inspirations: Inspiration[];
  connections: ConnectionState[];
  lastQuery: string;
  lastLearn: LastLearn | null;
  setHydrated: (v: boolean) => void;
  setLastQuery: (q: string) => void;
  addCampaign: (input: Partial<ClubCampaign> & { name: string }) => ClubCampaign;
  updateCampaign: (id: string, patch: Partial<ClubCampaign>) => void;
  generateWaves: (id: string) => void;
  setWaveStatus: (campaignId: string, waveId: string, status: ProjectStatus, projectId?: string | null) => void;
  bindScheduledWave: (campaignId: string, input: {
    kind: ContentKind;
    projectId: string;
    scheduledAt: number;
    topic: string;
    status: ProjectStatus;
  }) => void;
  moveWave: (campaignId: string, waveId: string, dateIso: string) => void;
  duplicateWave: (campaignId: string, waveId: string) => void;
  setConnection: (id: ConnectionId, patch: Partial<ConnectionState>) => void;
  addMemory: (item: MemoryItem) => void;
  ingestIgPosts: (posts: IgMemoryPost[]) => void;
  analyzeIg: (id: string, analysis: IgMemoryPost["analysis"]) => void;
  addInspiration: (item: Inspiration) => void;
  markPublished: (opts: {
    campaignId?: string;
    waveId?: string;
    projectId?: string;
    title?: string;
    caption?: string;
    kind?: ContentKind;
    assetIds?: string[];
  }) => IgMemoryPost | null;
};

function emptyCampaign(name: string): ClubCampaign {
  const now = Date.now();
  const date = isoFromMs(now + 7 * 86400000);
  return {
    id: uid("camp"),
    name,
    type: "tea",
    date,
    time: "19:30",
    location: "淡江校園",
    oneLiner: "",
    fullIntro: "",
    theme: "",
    studentPain: "",
    cta: "晚上來坐一下",
    signupUrl: "",
    coverAssetId: null,
    relatedAssetIds: [],
    projectIds: [],
    waves: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function calendarFrom(campaigns: ClubCampaign[], projects: Project[]): CalendarItem[] {
  const items: CalendarItem[] = [];
  for (const campaign of campaigns) {
    items.push({
      id: `event-${campaign.id}`,
      date: campaign.date,
      title: campaign.name,
      kind: "event",
      status: "done",
      campaignId: campaign.id,
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
      });
    }
  }
  for (const project of projects) {
    if (!project.scheduledAt) continue;
    if (items.some((item) => item.projectId === project.id)) continue;
    items.push({
      id: `proj-${project.id}`,
      date: isoFromMs(project.scheduledAt),
      title: project.name,
      kind: project.contentKind,
      status: project.status,
      projectId: project.id,
      campaignId: project.campaignId ?? undefined,
      publishedAt: project.publishedAt ?? undefined,
    });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

export const useCreative = create<CreativeState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      campaigns: SEED_CAMPAIGNS,
      memory: SEED_MEMORY,
      igPosts: SEED_IG_POSTS,
      inspirations: SEED_INSPIRATION,
      connections: SEED_CONNECTIONS,
      lastQuery: "",
      lastLearn: lastLearnFromPosts(
        SEED_IG_POSTS,
        SEED_IG_POSTS[0]?.analysis?.hook || SEED_IG_POSTS[0]?.caption || "",
        SEED_IG_POSTS[0]?.takenAt ?? Date.parse("2025-09-18T19:12:00+08:00"),
      ),
      setHydrated: (v) => set({ hydrated: v }),
      setLastQuery: (q) => set({ lastQuery: q }),
      addCampaign: (input) => {
        const campaign: ClubCampaign = {
          ...emptyCampaign(input.name),
          ...input,
          id: input.id ?? uid("camp"),
          updatedAt: Date.now(),
        };
        if (!campaign.waves.length) campaign.waves = suggestWaves(campaign);
        set((s) => ({ campaigns: [campaign, ...s.campaigns] }));
        return campaign;
      },
      updateCampaign: (id, patch) =>
        set((s) => ({
          campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)),
        })),
      generateWaves: (id) => {
        const campaign = get().campaigns.find((c) => c.id === id);
        if (!campaign) return;
        get().updateCampaign(id, { waves: suggestWaves(campaign) });
      },
      setWaveStatus: (campaignId, waveId, status, projectId) => {
        const campaign = get().campaigns.find((c) => c.id === campaignId);
        if (!campaign) return;
        get().updateCampaign(campaignId, {
          waves: campaign.waves.map((w) =>
            w.id === waveId ? { ...w, status, projectId: projectId === undefined ? w.projectId : projectId } : w,
          ),
          projectIds: projectId ? [...new Set([...campaign.projectIds, projectId])] : campaign.projectIds,
        });
      },
      bindScheduledWave: (campaignId, input) => {
        const campaign = get().campaigns.find((c) => c.id === campaignId);
        if (!campaign) return;
        get().updateCampaign(campaignId, {
          waves: placeOnWave(campaign.waves, { ...input, campaignDate: campaign.date }),
          projectIds: [...new Set([...campaign.projectIds, input.projectId])],
        });
      },
      moveWave: (campaignId, waveId, dateIso) => {
        const campaign = get().campaigns.find((c) => c.id === campaignId);
        if (!campaign) return;
        const event = new Date(`${campaign.date}T00:00:00+08:00`);
        const next = new Date(`${dateIso}T19:00:00+08:00`);
        const offsetDays = Math.round((next.getTime() - event.getTime()) / 86400000);
        get().updateCampaign(campaignId, {
          waves: campaign.waves.map((w) =>
            w.id === waveId ? { ...w, scheduledAt: next.getTime(), offsetDays } : w,
          ),
        });
      },
      duplicateWave: (campaignId, waveId) => {
        const campaign = get().campaigns.find((c) => c.id === campaignId);
        if (!campaign) return;
        const wave = campaign.waves.find((w) => w.id === waveId);
        if (!wave) return;
        const copy = {
          ...wave,
          id: uid("wave"),
          status: "idea" as const,
          projectId: null,
          publishedAt: null,
          scheduledAt: (wave.scheduledAt ?? Date.now()) + 86400000,
          topic: `${wave.topic}（延伸）`,
        };
        get().updateCampaign(campaignId, { waves: [...campaign.waves, copy] });
      },
      setConnection: (id, patch) =>
        set((s) => ({
          connections: s.connections.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      addMemory: (item) => set((s) => ({ memory: [item, ...s.memory.filter((m) => m.id !== item.id)] })),
      ingestIgPosts: (posts) =>
        set((s) => ({
          igPosts: mergeIgPosts(s.igPosts, posts),
        })),
      analyzeIg: (id, analysis) =>
        set((s) => ({
          igPosts: s.igPosts.map((p) => (p.id === id ? { ...p, analysis } : p)),
        })),
      addInspiration: (item) =>
        set((s) => ({
          inspirations: [item, ...s.inspirations.filter((row) => row.id !== item.id)].slice(0, 24),
        })),
      markPublished: (opts) => {
        const result = applyMarkPublished({
          campaigns: get().campaigns,
          ...opts,
        });
        if (!result) return null;
        set({ campaigns: result.campaigns });
        get().ingestIgPosts([result.post]);
        set({
          lastLearn: lastLearnFromPosts(
            get().igPosts,
            result.post.analysis?.hook || result.post.caption,
            result.post.takenAt,
          ),
        });
        return result.post;
      },
    }),
    {
      name: "tkz-creative-v1",
      skipHydration: true,
      version: 1,
      partialize: (s) => ({
        campaigns: s.campaigns,
        memory: s.memory,
        igPosts: s.igPosts,
        inspirations: s.inspirations,
        connections: s.connections,
        lastQuery: s.lastQuery,
        lastLearn: s.lastLearn,
      }),
    },
  ),
);

export type { CampaignType };
