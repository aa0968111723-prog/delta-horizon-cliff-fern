import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type LastPack, persistablePack } from "@/lib/club/last-pack";
import { FEATURED_EVENT } from "@/lib/club/memory";
import { buildCampaignRhythm, scheduleDraftsFromCampaign } from "@/lib/club/schedule";
import { uid } from "@/lib/studio/ids";
import type {
  CampaignWave,
  ContentKind,
  ContentStatus,
  CreativeDirection,
  CreativeSourceKind,
} from "@/lib/studio/types";

export type ClubCampaign = {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  location: string;
  oneLiner: string;
  description: string;
  theme: string;
  studentPain: string;
  cta: string;
  signupUrl: string;
  imageAssetIds: string[];
  relatedAssetIds: string[];
  projectIds: string[];
  waves: CampaignWave[];
  directions: CreativeDirection[];
  createdAt: number;
  updatedAt: number;
};

export type ScheduleItem = {
  id: string;
  campaignId: string | null;
  projectId: string | null;
  title: string;
  contentKind: ContentKind;
  status: ContentStatus;
  plannedAt: number;
  publishedAt: number | null;
  sourceLabel: string;
};

export type IgMemoryPost = {
  id: string;
  mediaType: "image" | "carousel" | "reels";
  caption: string;
  takenAt: number;
  thumb: string;
  permalink?: string;
  metrics?: { reach?: number; likes?: number; comments?: number; saves?: number };
  metricsSource: "live" | "memory";
  analysis?: string;
};

export type FolderPref = {
  driveFolder: string;
  driveFolderId: string;
};

type CreativeState = {
  hydrated: boolean;
  campaigns: ClubCampaign[];
  schedule: ScheduleItem[];
  igPosts: IgMemoryPost[];
  folder: FolderPref;
  lastSearch: string;
  lastPack: LastPack | null;
  setHydrated: (v: boolean) => void;
  upsertCampaign: (input: Partial<ClubCampaign> & Pick<ClubCampaign, "name">) => ClubCampaign;
  removeCampaign: (id: string) => void;
  attachProject: (campaignId: string, projectId: string) => void;
  setWaves: (campaignId: string, waves: CampaignWave[], opts?: { syncCalendar?: boolean }) => void;
  setDirections: (campaignId: string, directions: CreativeDirection[]) => void;
  upsertSchedule: (item: Partial<ScheduleItem> & Pick<ScheduleItem, "title" | "plannedAt" | "contentKind">) => ScheduleItem;
  moveSchedule: (id: string, plannedAt: number) => void;
  setScheduleStatus: (id: string, status: ContentStatus) => void;
  duplicateSchedule: (id: string) => void;
  setFolder: (patch: Partial<FolderPref>) => void;
  ingestIg: (posts: IgMemoryPost[]) => void;
  setLastSearch: (q: string) => void;
  setLastPack: (pack: LastPack | null) => void;
};

function seedCampaign(): ClubCampaign {
  const now = Date.parse("2026-09-12T19:00:00+08:00");
  return {
    id: FEATURED_EVENT.id,
    name: FEATURED_EVENT.name,
    type: FEATURED_EVENT.type,
    date: FEATURED_EVENT.date,
    time: FEATURED_EVENT.time,
    location: FEATURED_EVENT.location,
    oneLiner: FEATURED_EVENT.oneLiner,
    description: FEATURED_EVENT.description,
    theme: FEATURED_EVENT.theme,
    studentPain: FEATURED_EVENT.studentPain,
    cta: FEATURED_EVENT.cta,
    signupUrl: FEATURED_EVENT.signupUrl,
    imageAssetIds: ["asset_tricolor"],
    relatedAssetIds: ["asset_turtle", "asset_tea"],
    projectIds: ["proj_floating_light", "proj_sit_down"],
    waves: buildCampaignRhythm({ eventDate: FEATURED_EVENT.date, eventType: FEATURED_EVENT.name, leadDays: 8 }),
    directions: [],
    createdAt: now,
    updatedAt: now,
  };
}

function seedSchedule(campaign: ClubCampaign): ScheduleItem[] {
  return scheduleDraftsFromCampaign(campaign).map((row) => ({ ...row, id: uid("sch") }));
}

function seedIg(): IgMemoryPost[] {
  return [
    {
      id: "ig_20250918",
      mediaType: "image",
      caption: "有時候我們需要的不是答案，只是一個安靜的晚上。\n下週三，浮游禪光。人到了就好。",
      takenAt: Date.parse("2025-09-18T19:12:00+08:00"),
      thumb: "/seed/tamsui.svg",
      metrics: { reach: 1820, likes: 96, comments: 11, saves: 48 },
      metricsSource: "memory",
      analysis: "Hook 有效。活動資訊可以再早兩行出現。",
    },
    {
      id: "ig_tea_recap",
      mediaType: "carousel",
      caption: "來的人比想像中多。有人問「我不會禪也可以嗎？」\n可以。",
      takenAt: Date.parse("2025-11-13T21:40:00+08:00"),
      thumb: "/seed/tea.svg",
      metrics: { reach: 2410, likes: 154, comments: 23, saves: 71 },
      metricsSource: "memory",
      analysis: "回顧比預告更有停留。Carousel 第三頁互動最高。",
    },
    {
      id: "ig_lights",
      mediaType: "reels",
      caption: "燈會先亮。人慢慢到。",
      takenAt: Date.parse("2025-09-24T20:02:00+08:00"),
      thumb: "/seed/tricolor.svg",
      metrics: { reach: 3102, likes: 188, comments: 9, saves: 40 },
      metricsSource: "memory",
      analysis: "夜間光的停留感好。CTA 出現偏晚。",
    },
    {
      id: "ig_turtle",
      mediaType: "image",
      caption: "龜龜今天也在。",
      takenAt: Date.parse("2026-03-04T18:00:00+08:00"),
      thumb: "/seed/turtle.svg",
      metrics: { reach: 990, likes: 72, comments: 6, saves: 12 },
      metricsSource: "memory",
      analysis: "角色可愛，但要搭配一句學生生活才會停。",
    },
  ];
}

export const useCreative = create<CreativeState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      campaigns: [seedCampaign()],
      schedule: seedSchedule(seedCampaign()),
      igPosts: seedIg(),
      folder: { driveFolder: "淡江禪學社主要資料夾", driveFolderId: "" },
      lastSearch: "",
      lastPack: null,
      setHydrated: (hydrated) => set({ hydrated }),
      upsertCampaign: (input) => {
        const existing = input.id ? get().campaigns.find((c) => c.id === input.id) : undefined;
        const next: ClubCampaign = {
          ...(existing ?? {
            id: uid("camp"),
            type: "活動",
            date: FEATURED_EVENT.date,
            time: "19:30",
            location: "淡江校園",
            oneLiner: "",
            description: "",
            theme: "",
            studentPain: "",
            cta: "來坐一下",
            signupUrl: "",
            imageAssetIds: [],
            relatedAssetIds: [],
            projectIds: [],
            waves: [],
            directions: [],
            createdAt: Date.now(),
          }),
          ...input,
          name: input.name.trim() || existing?.name || "未命名活動",
          updatedAt: Date.now(),
        };
        if (!next.waves.length) next.waves = buildCampaignRhythm({ eventDate: next.date, eventType: next.type || next.name });
        set((s) => ({
          campaigns: existing
            ? s.campaigns.map((c) => (c.id === next.id ? next : c))
            : [next, ...s.campaigns],
        }));
        if (!existing) {
          const items = seedSchedule(next).map((row) => ({ ...row, campaignId: next.id, projectId: null, status: "idea" as const }));
          set((s) => ({ schedule: [...items, ...s.schedule] }));
        }
        return next;
      },
      removeCampaign: (id) =>
        set((s) => ({
          campaigns: s.campaigns.filter((c) => c.id !== id),
          schedule: s.schedule.filter((row) => row.campaignId !== id),
        })),
      attachProject: (campaignId, projectId) =>
        set((s) => ({
          campaigns: s.campaigns.map((c) =>
            c.id === campaignId && !c.projectIds.includes(projectId)
              ? { ...c, projectIds: [...c.projectIds, projectId], updatedAt: Date.now() }
              : c,
          ),
        })),
      setWaves: (campaignId, waves, opts) =>
        set((s) => {
          const campaigns = s.campaigns.map((c) => (c.id === campaignId ? { ...c, waves, updatedAt: Date.now() } : c));
          const campaign = campaigns.find((c) => c.id === campaignId);
          if (!opts?.syncCalendar || !campaign) return { campaigns };
          const kept = s.schedule.filter((row) => row.campaignId !== campaignId);
          return { campaigns, schedule: [...seedSchedule({ ...campaign, waves }), ...kept] };
        }),
      setDirections: (campaignId, directions) =>
        set((s) => ({
          campaigns: s.campaigns.map((c) => (c.id === campaignId ? { ...c, directions, updatedAt: Date.now() } : c)),
        })),
      upsertSchedule: (item) => {
        const next: ScheduleItem = {
          id: item.id || uid("sch"),
          campaignId: item.campaignId ?? null,
          projectId: item.projectId ?? null,
          title: item.title,
          contentKind: item.contentKind,
          status: item.status ?? "idea",
          plannedAt: item.plannedAt,
          publishedAt: item.publishedAt ?? null,
          sourceLabel: item.sourceLabel ?? "手動",
        };
        set((s) => ({
          schedule: s.schedule.some((row) => row.id === next.id)
            ? s.schedule.map((row) => (row.id === next.id ? next : row))
            : [next, ...s.schedule],
        }));
        return next;
      },
      moveSchedule: (id, plannedAt) =>
        set((s) => ({
          schedule: s.schedule.map((row) => (row.id === id ? { ...row, plannedAt } : row)),
        })),
      setScheduleStatus: (id, status) =>
        set((s) => ({
          schedule: s.schedule.map((row) =>
            row.id === id
              ? { ...row, status, publishedAt: status === "published" ? Date.now() : row.publishedAt }
              : row,
          ),
        })),
      duplicateSchedule: (id) => {
        const src = get().schedule.find((row) => row.id === id);
        if (!src) return;
        get().upsertSchedule({
          ...src,
          id: uid("sch"),
          title: `${src.title} 延伸`,
          status: "idea",
          plannedAt: src.plannedAt + 86_400_000,
          sourceLabel: "複製",
        });
      },
      setFolder: (patch) =>
        set((s) => ({
          folder: {
            driveFolder: patch.driveFolder ?? s.folder?.driveFolder ?? "",
            driveFolderId: patch.driveFolderId ?? s.folder?.driveFolderId ?? "",
          },
        })),
      ingestIg: (posts) =>
        set((s) => {
          const byId = new Map(s.igPosts.map((post) => [post.id, post]));
          for (const post of posts) {
            const prev = byId.get(post.id);
            byId.set(post.id, {
              ...prev,
              ...post,
              metrics: post.metrics ?? prev?.metrics,
              analysis: post.analysis ?? prev?.analysis,
            });
          }
          return { igPosts: [...byId.values()].sort((a, b) => b.takenAt - a.takenAt) };
        }),
      setLastSearch: (lastSearch) => set({ lastSearch }),
      setLastPack: (lastPack) => set({ lastPack: persistablePack(lastPack) }),
    }),
    {
      name: "zen-creative-v1",
      skipHydration: true,
      version: 1,
      partialize: (s) => ({
        campaigns: s.campaigns,
        schedule: s.schedule,
        igPosts: s.igPosts,
        folder: s.folder,
        lastSearch: s.lastSearch,
        lastPack: persistablePack(s.lastPack),
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CreativeState>;
        return {
          ...current,
          ...p,
          folder: {
            driveFolder: p.folder?.driveFolder || current.folder.driveFolder,
            driveFolderId: p.folder?.driveFolderId || "",
          },
          lastPack: p.lastPack
            ? {
                ...(current.lastPack ?? {
                  projectId: "",
                  campaignId: "",
                  eventName: "",
                  hook: "",
                  caption: "",
                  hashtags: [],
                  heroAssetId: null,
                  heroThumb: "/seed/tea.svg",
                  kind: "ig-post",
                  converted: [],
                  updatedAt: 0,
                }),
                ...p.lastPack,
                converted: p.lastPack.converted ?? current.lastPack?.converted ?? [],
                packs: p.lastPack.packs ?? current.lastPack?.packs ?? {},
                formatAssetIds: p.lastPack.formatAssetIds ?? current.lastPack?.formatAssetIds ?? {},
                formatPublicUrls: p.lastPack.formatPublicUrls ?? current.lastPack?.formatPublicUrls ?? {},
                canvaDesignId: p.lastPack.canvaDesignId ?? current.lastPack?.canvaDesignId,
                canvaEditUrl: p.lastPack.canvaEditUrl ?? current.lastPack?.canvaEditUrl,
                canvaExportUrl: p.lastPack.canvaExportUrl ?? current.lastPack?.canvaExportUrl,
              }
            : current.lastPack ?? null,
        };
      },
    },
  ),
);

export type { LastPack };

export function sourceLabel(kind: CreativeSourceKind) {
  if (kind === "drive") return "Google Drive";
  if (kind === "canva") return "Canva";
  if (kind === "instagram") return "Instagram";
  if (kind === "generated") return "AI Generated";
  return "Brand Memory";
}
