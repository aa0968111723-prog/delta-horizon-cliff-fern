import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/studio/ids";
import { SEED_CAMPUS_ID, SEED_CUP_ID, SEED_DRAFT_ID, SEED_LIGHT_ID, SEED_PROJECT_ID } from "@/lib/studio/seed";
import { SEED_CAMPAIGN_ID, SEED_CONNECTIONS, SEED_IG_POSTS, SEED_MEMORY, SEED_TEA_ID } from "@/lib/zen/memory";
import { emptyCampaign, scheduleItemsFromCampaign, suggestWaves } from "@/lib/zen/schedule";
import type {
  CampaignWave,
  ClubCampaign,
  ConnectionId,
  ConnectionState,
  CreateIntent,
  CreativePack,
  IgMemoryPost,
  MemoryItem,
  ScheduleItem,
} from "@/lib/zen/types";

const STORAGE_KEY = "tkuzc-creative-v1";

function seedCampaigns(): ClubCampaign[] {
  const floating = emptyCampaign({
    id: SEED_CAMPAIGN_ID,
    name: "浮游禪光",
    type: "light",
    date: "2026-09-24",
    time: "19:30",
    location: "淡江大學淡水校園",
    tagline: "最近是不是很久沒有好好坐下來？",
    description: "開學後的晚上，把燈放下來。不是講座，是一個可以坐著的夜晚。",
    theme: "夜燈、三色光、慢下來",
    studentPain: "行程被填滿，連休息都有罪惡感。",
    cta: "晚上見",
    signupUrl: "",
    coverAssetId: SEED_LIGHT_ID,
    relatedAssetIds: [SEED_LIGHT_ID, SEED_CUP_ID],
    projectIds: [SEED_PROJECT_ID],
    createdAt: Date.parse("2026-09-08T12:00:00+08:00"),
    updatedAt: Date.parse("2026-09-14T18:00:00+08:00"),
  });
  floating.waves = suggestWaves({ date: floating.date, type: floating.type, name: floating.name });
  floating.waves = floating.waves.map((w) =>
    w.kind === "key-visual" ? { ...w, projectId: SEED_PROJECT_ID, status: "done" } : w,
  );

  const tea = emptyCampaign({
    id: SEED_TEA_ID,
    name: "開學茶會",
    type: "tea",
    date: "2026-09-19",
    time: "19:00",
    location: "淡江大學淡水校園",
    tagline: "來坐一下，不用先懂禪。",
    description: "給新生與想認識人的舊生。茶、聊天、可以不說話。",
    theme: "開學、認識、茶",
    studentPain: "剛到淡水，還沒有地方可以自然出現。",
    cta: "找一個朋友來",
    coverAssetId: SEED_CUP_ID,
    relatedAssetIds: [SEED_CUP_ID, SEED_CAMPUS_ID],
    projectIds: [SEED_DRAFT_ID],
    createdAt: Date.parse("2026-09-06T12:00:00+08:00"),
    updatedAt: Date.parse("2026-09-12T10:00:00+08:00"),
  });
  tea.waves = suggestWaves({ date: tea.date, type: tea.type, name: tea.name });
  return [floating, tea];
}

function seedSchedule(campaigns: ClubCampaign[]): ScheduleItem[] {
  return campaigns.flatMap((camp) => scheduleItemsFromCampaign(camp));
}

type IgView = "grid" | "preview" | "calendar";

type CreativeState = {
  hydrated: boolean;
  campaigns: ClubCampaign[];
  schedule: ScheduleItem[];
  igPosts: IgMemoryPost[];
  memory: MemoryItem[];
  connections: ConnectionState[];
  lastPack: CreativePack | null;
  lastVisualAssetId: string | null;
  igView: IgView;
  searchQuery: string;
  createIntent: CreateIntent | null;
  driveFolderQuery: string;
  setHydrated: (v: boolean) => void;
  setSearchQuery: (q: string) => void;
  setCreateIntent: (intent: CreateIntent | null) => void;
  consumeCreateIntent: () => CreateIntent | null;
  setDriveFolderQuery: (q: string) => void;
  setLastPack: (pack: CreativePack | null) => void;
  setIgView: (igView: IgView) => void;
  setIgPreview: (assetId: string | null) => void;
  upsertCampaign: (campaign: ClubCampaign) => void;
  patchCampaign: (id: string, patch: Partial<ClubCampaign>) => void;
  removeCampaign: (id: string) => void;
  attachProject: (campaignId: string, projectId: string) => void;
  upsertSchedule: (item: ScheduleItem) => void;
  moveSchedule: (id: string, scheduledAt: number) => void;
  patchSchedule: (id: string, patch: Partial<ScheduleItem>) => void;
  duplicateSchedule: (id: string) => ScheduleItem | null;
  removeSchedule: (id: string) => void;
  setConnection: (id: ConnectionId, patch: Partial<ConnectionState>) => void;
  addMemory: (item: MemoryItem) => void;
  addIgPost: (post: IgMemoryPost) => void;
  patchWave: (campaignId: string, waveId: string, patch: Partial<CampaignWave>) => void;
};

const initialCampaigns = seedCampaigns();

export const useCreative = create<CreativeState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      campaigns: initialCampaigns,
      schedule: seedSchedule(initialCampaigns),
      igPosts: SEED_IG_POSTS,
      memory: SEED_MEMORY,
      connections: SEED_CONNECTIONS,
      lastPack: null,
      lastVisualAssetId: null,
      igView: "grid",
      searchQuery: "",
      createIntent: null,
      driveFolderQuery: "淡江禪學社",
      setHydrated: (v) => set({ hydrated: v }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setCreateIntent: (createIntent) =>
        set({
          createIntent,
          searchQuery: createIntent?.idea ?? "",
        }),
      consumeCreateIntent: () => {
        const intent = get().createIntent;
        const q = get().searchQuery.trim();
        if (intent) {
          set({ createIntent: null, searchQuery: "" });
          return intent;
        }
        if (q) {
          set({ searchQuery: "" });
          return { idea: q, kind: "emotion", autoGenerate: true };
        }
        return null;
      },
      setDriveFolderQuery: (driveFolderQuery) => set({ driveFolderQuery }),
      setLastPack: (lastPack) => set({ lastPack }),
      setIgView: (igView) => set({ igView }),
      setIgPreview: (assetId) => set({ lastVisualAssetId: assetId, igView: assetId ? "preview" : "grid" }),
      upsertCampaign: (campaign) =>
        set((s) => {
          const exists = s.campaigns.some((c) => c.id === campaign.id);
          const campaigns = exists
            ? s.campaigns.map((c) => (c.id === campaign.id ? campaign : c))
            : [campaign, ...s.campaigns];
          const extra = scheduleItemsFromCampaign(campaign);
          const schedule = [...extra, ...s.schedule.filter((item) => item.campaignId !== campaign.id)];
          return { campaigns, schedule };
        }),
      patchCampaign: (id, patch) => {
        const current = get().campaigns.find((c) => c.id === id);
        if (!current) return;
        get().upsertCampaign({ ...current, ...patch, updatedAt: Date.now() });
      },
      removeCampaign: (id) =>
        set((s) => ({
          campaigns: s.campaigns.filter((c) => c.id !== id),
          schedule: s.schedule.filter((item) => item.campaignId !== id),
        })),
      attachProject: (campaignId, projectId) =>
        set((s) => ({
          campaigns: s.campaigns.map((c) =>
            c.id === campaignId && !c.projectIds.includes(projectId)
              ? { ...c, projectIds: [...c.projectIds, projectId], updatedAt: Date.now() }
              : c,
          ),
        })),
      upsertSchedule: (item) =>
        set((s) => {
          const exists = s.schedule.some((row) => row.id === item.id);
          return {
            schedule: exists ? s.schedule.map((row) => (row.id === item.id ? item : row)) : [item, ...s.schedule],
          };
        }),
      moveSchedule: (id, scheduledAt) =>
        set((s) => ({
          schedule: s.schedule.map((row) => (row.id === id ? { ...row, scheduledAt, status: row.status === "published" ? row.status : "scheduled" } : row)),
        })),
      patchSchedule: (id, patch) =>
        set((s) => ({
          schedule: s.schedule.map((row) => (row.id === id ? { ...row, ...patch } : row)),
        })),
      duplicateSchedule: (id) => {
        const item = get().schedule.find((row) => row.id === id);
        if (!item) return null;
        const copy: ScheduleItem = {
          ...item,
          id: uid("sch"),
          title: item.title.includes("（複本）") ? item.title : `${item.title}（複本）`,
          status: "idea",
          scheduledAt: item.scheduledAt + 86_400_000,
          publishedAt: null,
        };
        get().upsertSchedule(copy);
        return copy;
      },
      removeSchedule: (id) => set((s) => ({ schedule: s.schedule.filter((row) => row.id !== id) })),
      setConnection: (id, patch) =>
        set((s) => ({
          connections: s.connections.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      addMemory: (item) => set((s) => ({ memory: [item, ...s.memory.filter((m) => m.id !== item.id)] })),
      addIgPost: (post) => set((s) => ({ igPosts: [post, ...s.igPosts.filter((p) => p.id !== post.id)] })),
      patchWave: (campaignId, waveId, patch) =>
        set((s) => ({
          campaigns: s.campaigns.map((c) =>
            c.id === campaignId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  waves: c.waves.map((w) => (w.id === waveId ? { ...w, ...patch } : w)),
                }
              : c,
          ),
          schedule: s.schedule.map((item) =>
            item.id === `sch_${waveId}`
              ? {
                  ...item,
                  title: patch.title ?? item.title,
                  status: patch.status ?? item.status,
                  scheduledAt: patch.scheduledAt ?? item.scheduledAt,
                  projectId: patch.projectId === undefined ? item.projectId : patch.projectId,
                  captionPreview: patch.copyPreview ?? item.captionPreview,
                }
              : item,
          ),
        })),
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
      version: 3,
      migrate: (persisted) => {
        const row = (persisted ?? {}) as {
          campaigns: ClubCampaign[];
          schedule: ScheduleItem[];
          igPosts: IgMemoryPost[];
          memory: MemoryItem[];
          connections: ConnectionState[];
          lastPack: CreativePack | null;
          lastVisualAssetId?: string | null;
          igView?: IgView;
          driveFolderQuery?: string;
        };
        return {
          campaigns: row.campaigns,
          schedule: row.schedule,
          igPosts: row.igPosts,
          memory: row.memory,
          connections: row.connections,
          lastPack: row.lastPack ?? null,
          lastVisualAssetId: row.lastVisualAssetId ?? null,
          igView: row.igView === "preview" || row.igView === "calendar" ? row.igView : "grid",
          driveFolderQuery: row.driveFolderQuery || "淡江禪學社",
        };
      },
      partialize: (s) => ({
        campaigns: s.campaigns,
        schedule: s.schedule,
        igPosts: s.igPosts,
        memory: s.memory,
        connections: s.connections,
        lastPack: s.lastPack,
        lastVisualAssetId: s.lastVisualAssetId,
        igView: s.igView,
        driveFolderQuery: s.driveFolderQuery,
      }),
    },
  ),
);
