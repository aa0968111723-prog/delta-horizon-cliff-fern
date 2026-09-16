import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildCampaignRhythm } from "@/lib/creative/rhythm";
import type {
  Campaign,
  CampaignInput,
  ContentItem,
  ContentStatus,
  OutcomeInput,
  PostOutcome,
} from "@/lib/creative/types";

const SEED_CAMPAIGN: Campaign = {
  id: "campaign_floating_zen_light",
  name: "09/24 浮游禪光",
  type: "社課",
  eventDate: "2026-09-24",
  eventTime: "19:00–21:00",
  location: "淡江大學校園",
  oneLiner: "一個可以慢下來、整理最近心情，也能自在認識新朋友的晚上。",
  description: "不需要懂禪，也不需要準備答案。一起坐坐、聊聊，或只是安靜待著。",
  theme: "在忙亂裡，留一點空間給自己",
  studentPain: "剛開學，課表、通勤、宿舍與新關係一起湧進來，連休息都還在想下一件事。",
  cta: "保留這個晚上",
  registrationUrl: "",
  assetIds: [],
  createdAt: Date.parse("2026-09-16T00:00:00+08:00"),
  updatedAt: Date.parse("2026-09-16T00:00:00+08:00"),
};

type CreativeState = {
  hydrated: boolean;
  campaigns: Campaign[];
  contentItems: ContentItem[];
  outcomes: PostOutcome[];
  activeCampaignId: string;
  setHydrated: (hydrated: boolean) => void;
  setActiveCampaignId: (id: string) => void;
  createCampaign: (input: CampaignInput) => Campaign;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  generateRhythm: (campaignId: string) => ContentItem[];
  setContentStatus: (id: string, status: ContentStatus) => void;
  rescheduleContent: (id: string, plannedAt: string) => void;
  linkProject: (id: string, projectId: string) => void;
  addOutcome: (input: OutcomeInput) => PostOutcome;
  removeOutcome: (id: string) => void;
};

function uid(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

const seedItems = buildCampaignRhythm(
  SEED_CAMPAIGN,
  new Date("2026-09-16T00:00:00+08:00"),
);

export const useCreative = create<CreativeState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      campaigns: [SEED_CAMPAIGN],
      contentItems: seedItems,
      outcomes: [],
      activeCampaignId: SEED_CAMPAIGN.id,
      setHydrated: (hydrated) => set({ hydrated }),
      setActiveCampaignId: (id) => set({ activeCampaignId: id }),
      createCampaign: (input) => {
        const now = Date.now();
        const campaign: Campaign = {
          ...input,
          id: uid("campaign"),
          assetIds: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          campaigns: [campaign, ...state.campaigns],
          activeCampaignId: campaign.id,
        }));
        return campaign;
      },
      updateCampaign: (id, patch) =>
        set((state) => ({
          campaigns: state.campaigns.map((campaign) =>
            campaign.id === id ? { ...campaign, ...patch, updatedAt: Date.now() } : campaign,
          ),
        })),
      generateRhythm: (campaignId) => {
        const campaign = get().campaigns.find((item) => item.id === campaignId);
        if (!campaign) return [];
        const existing = get().contentItems.filter((item) => item.campaignId === campaignId);
        const previous = new Map(existing.map((item) => [item.id, item]));
        const generated = buildCampaignRhythm(campaign).map((item) => {
          const saved = previous.get(item.id);
          return saved
            ? {
                ...item,
                status: saved.status,
                publishedAt: saved.publishedAt,
                projectId: saved.projectId,
                createdAt: saved.createdAt,
              }
            : item;
        });
        set((state) => ({
          contentItems: [
            ...state.contentItems.filter((item) => item.campaignId !== campaignId),
            ...generated,
          ],
        }));
        return generated;
      },
      setContentStatus: (id, status) =>
        set((state) => ({
          contentItems: state.contentItems.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status,
                  publishedAt: status === "published" ? new Date().toISOString() : item.publishedAt,
                  updatedAt: Date.now(),
                }
              : item,
          ),
        })),
      rescheduleContent: (id, plannedAt) =>
        set((state) => ({
          contentItems: state.contentItems.map((item) =>
            item.id === id ? { ...item, plannedAt, updatedAt: Date.now() } : item,
          ),
        })),
      linkProject: (id, projectId) =>
        set((state) => ({
          contentItems: state.contentItems.map((item) =>
            item.id === id
              ? { ...item, projectId, status: "creating", updatedAt: Date.now() }
              : item,
          ),
        })),
      addOutcome: (input) => {
        const outcome: PostOutcome = {
          ...input,
          hashtags: input.hashtags ?? [],
          id: uid("outcome"),
          createdAt: Date.now(),
        };
        set((state) => ({ outcomes: [outcome, ...state.outcomes].slice(0, 40) }));
        return outcome;
      },
      removeOutcome: (id) =>
        set((state) => ({
          outcomes: state.outcomes.filter((item) => item.id !== id),
        })),
    }),
    {
      name: "zen-creative-brain-v1",
      version: 4,
      skipHydration: true,
      migrate: (persisted) => {
        const state = persisted as {
          campaigns?: Campaign[];
          contentItems?: ContentItem[];
          outcomes?: PostOutcome[];
          activeCampaignId?: string;
        };
        return {
          campaigns: state.campaigns ?? [SEED_CAMPAIGN],
          contentItems: state.contentItems ?? seedItems,
          outcomes: (state.outcomes ?? []).map((item) => ({
            ...item,
            hashtags: item.hashtags ?? [],
          })),
          activeCampaignId: state.activeCampaignId ?? state.campaigns?.[0]?.id ?? SEED_CAMPAIGN.id,
        };
      },
      partialize: (state) => ({
        campaigns: state.campaigns,
        contentItems: state.contentItems,
        outcomes: state.outcomes,
        activeCampaignId: state.activeCampaignId,
      }),
    },
  ),
);
