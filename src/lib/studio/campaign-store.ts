import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Campaign, ScheduledPost, ThirdPartyConnection, CreativeSourceItem, ContentStatus } from "./campaign-types.ts";
import { DEFAULT_CAMPAIGNS, DEFAULT_SCHEDULED_POSTS, DEFAULT_CONNECTIONS, DEFAULT_CREATIVE_SOURCES } from "./campaign-seed.ts";
import { uid } from "./ids.ts";

interface CampaignState {
  campaigns: Campaign[];
  scheduledPosts: ScheduledPost[];
  connections: ThirdPartyConnection[];
  creativeSources: CreativeSourceItem[];
  selectedCampaignId: string | null;
  
  // Actions
  selectCampaign: (id: string | null) => void;
  addCampaign: (campaign: Omit<Campaign, "id" | "createdAt" | "updatedAt">) => Campaign;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  
  addScheduledPost: (post: Omit<ScheduledPost, "id">) => ScheduledPost;
  updateScheduledPost: (id: string, patch: Partial<ScheduledPost>) => void;
  setPostStatus: (id: string, status: ContentStatus) => void;
  deleteScheduledPost: (id: string) => void;
  
  updateConnection: (id: "google-drive" | "canva" | "instagram", patch: Partial<ThirdPartyConnection>) => void;
  syncConnection: (id: "google-drive" | "canva" | "instagram") => Promise<void>;
  
  searchCreativeSources: (query: string, filterSource?: string) => CreativeSourceItem[];
  addCreativeSource: (item: Omit<CreativeSourceItem, "id">) => CreativeSourceItem;
  updateCreativeSource: (id: string, patch: Partial<CreativeSourceItem>) => void;
  tagCreativeSource: (id: string, tags: string[]) => void;
}

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set, get) => ({
      campaigns: DEFAULT_CAMPAIGNS,
      scheduledPosts: DEFAULT_SCHEDULED_POSTS,
      connections: DEFAULT_CONNECTIONS,
      creativeSources: DEFAULT_CREATIVE_SOURCES,
      selectedCampaignId: "camp_floating_light_0924",

      selectCampaign: (id) => set({ selectedCampaignId: id }),

      addCampaign: (input) => {
        const now = Date.now();
        const campaign: Campaign = {
          ...input,
          id: uid("camp"),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ campaigns: [campaign, ...state.campaigns] }));
        return campaign;
      },

      updateCampaign: (id, patch) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c
          ),
        }));
      },

      deleteCampaign: (id) => {
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
          selectedCampaignId: state.selectedCampaignId === id ? null : state.selectedCampaignId,
        }));
      },

      addScheduledPost: (input) => {
        const post: ScheduledPost = {
          ...input,
          id: uid("post"),
        };
        set((state) => ({ scheduledPosts: [post, ...state.scheduledPosts] }));
        return post;
      },

      updateScheduledPost: (id, patch) => {
        set((state) => ({
          scheduledPosts: state.scheduledPosts.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        }));
      },

      setPostStatus: (id, status) => {
        set((state) => ({
          scheduledPosts: state.scheduledPosts.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status,
                  publishedAt: status === "published" ? new Date().toISOString() : p.publishedAt,
                }
              : p
          ),
        }));
      },

      deleteScheduledPost: (id) => {
        set((state) => ({
          scheduledPosts: state.scheduledPosts.filter((p) => p.id !== id),
        }));
      },

      updateConnection: (id, patch) => {
        set((state) => ({
          connections: state.connections.map((conn) =>
            conn.id === id ? { ...conn, ...patch } : conn
          ),
        }));
      },

      syncConnection: async (id) => {
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, status: "syncing" } : c
          ),
        }));

        await new Promise((resolve) => setTimeout(resolve, 800));

        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: c.status === "demo" ? "demo" : "connected",
                  lastSyncedAt: Date.now(),
                }
              : c
          ),
        }));
      },

      searchCreativeSources: (query, filterSource) => {
        const q = query.trim().toLowerCase();
        return get().creativeSources.filter((item) => {
          if (filterSource && filterSource !== "all" && item.source !== filterSource) {
            return false;
          }
          if (!q) return true;
          return (
            item.title.toLowerCase().includes(q) ||
            item.subtitle.toLowerCase().includes(q) ||
            item.tags.some((t) => t.toLowerCase().includes(q))
          );
        });
      },

      addCreativeSource: (input) => {
        const item: CreativeSourceItem = {
          ...input,
          id: uid("src"),
        };
        set((state) => ({ creativeSources: [item, ...state.creativeSources] }));
        return item;
      },

      updateCreativeSource: (id, patch) => {
        set((state) => ({
          creativeSources: state.creativeSources.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        }));
      },

      tagCreativeSource: (id, tags) => {
        set((state) => ({
          creativeSources: state.creativeSources.map((item) =>
            item.id === id ? { ...item, tags: [...new Set(tags.map((t) => t.trim()).filter(Boolean))] } : item,
          ),
        }));
      },
    }),
    {
      name: "tamkang-zen-campaigns-v2",
    }
  )
);
