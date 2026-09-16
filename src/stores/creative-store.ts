import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calendarFrom, rescheduleCalendarItem } from "@/lib/creative/calendar";
import { bindScheduledWave as placeOnWave, suggestWaves, isoFromMs } from "@/lib/creative/schedule";
import { annotateIgPosts, clubInsightsFromPosts, lastLearnFromInsights, lastLearnFromPosts } from "@/lib/club/insights";
import { prepareIgIngest } from "@/lib/creative/ig-memory";
import { applyMarkPublished } from "@/lib/creative/publish-flow";
import {
  SEED_CAMPAIGNS,
  SEED_CONNECTIONS,
  SEED_IG_POSTS,
  SEED_INSPIRATION,
  SEED_MEMORY,
} from "@/lib/creative/memory-seed";
import type {
  ClubCampaign,
  ConnectionId,
  ConnectionState,
  IgMemoryPost,
  Inspiration,
  LastLearn,
  MemoryItem,
} from "@/lib/creative/types";
import { uid } from "@/lib/studio/ids";
import type { ContentKind, ProjectStatus } from "@/lib/studio/types";
import { CAMPAIGN_TYPES, type CampaignType } from "@/lib/creative/types";

export { CAMPAIGN_TYPES, calendarFrom };

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
  rememberLearn: (hook: string, caption: string, mediaType?: IgMemoryPost["mediaType"]) => void;
  refreshLearnFromIg: () => void;
  addInspiration: (item: Inspiration) => void;
  markPublished: (opts: {
    campaignId?: string;
    waveId?: string;
    projectId?: string;
    title?: string;
    caption?: string;
    kind?: ContentKind;
    assetIds?: string[];
    mediaUrl?: string;
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
      lastLearn: lastLearnFromInsights(SEED_IG_POSTS),
      setHydrated: (v) => set({ hydrated: v }),
      setLastQuery: (q) => set({ lastQuery: q }),
      addCampaign: (input) => {
        const campaign: ClubCampaign = {
          ...emptyCampaign(input.name),
          ...input,
          id: input.id ?? uid("camp"),
          updatedAt: Date.now(),
        };
        if (!campaign.waves.length) {
          campaign.waves = suggestWaves(campaign, new Date(), clubInsightsFromPosts(get().igPosts).mixLesson);
        }
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
        get().updateCampaign(id, {
          waves: suggestWaves(campaign, new Date(), clubInsightsFromPosts(get().igPosts).mixLesson),
        });
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
        const result = rescheduleCalendarItem({ campaigns: get().campaigns, itemId: waveId, dateIso });
        if (result) set({ campaigns: result.campaigns });
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
        set((s) => {
          const next = prepareIgIngest(s.igPosts, posts);
          return {
            igPosts: next.posts,
            ...(next.lastLearn ? { lastLearn: next.lastLearn } : {}),
          };
        }),
      refreshLearnFromIg: () =>
        set((s) => {
          const posts = annotateIgPosts(s.igPosts);
          return { igPosts: posts, lastLearn: lastLearnFromInsights(posts, Date.now()) };
        }),
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
            { caption: result.post.caption, mediaType: result.post.mediaType },
          ),
        });
        return result.post;
      },
      rememberLearn: (hook, caption, mediaType) =>
        set({
          lastLearn: lastLearnFromPosts(get().igPosts, hook, Date.now(), {
            caption,
            mediaType,
          }),
        }),
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
