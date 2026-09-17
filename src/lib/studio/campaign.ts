import { uid } from "./ids";
import type { Campaign, CampaignStrategy, CampaignWave } from "./types";

export function migrateCampaign(raw: Partial<Campaign> & { name?: string; id?: string }): Campaign {
  const now = Date.now();
  return {
    id: raw.id ?? uid("camp"),
    name: raw.name ?? "未命名活動",
    type: raw.type ?? "other",
    date: raw.date ?? "",
    time: raw.time ?? "",
    location: raw.location ?? "",
    oneLiner: raw.oneLiner ?? "",
    description: raw.description ?? "",
    theme: raw.theme ?? "",
    painPoints: raw.painPoints ?? [],
    cta: raw.cta ?? "來坐一下",
    signupUrl: raw.signupUrl ?? "",
    coverAssetId: raw.coverAssetId ?? null,
    assetIds: raw.assetIds ?? [],
    strategy: raw.strategy ?? null,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}

const WAVE_OFFSETS = [-10, -7, -3, -1, 0, 1];

export function defaultWavePlan(campaign: Campaign): CampaignWave[] {
  if (campaign.strategy?.waves?.length) return campaign.strategy.waves;
  return WAVE_OFFSETS.map((offsetDays, index) => ({
    id: uid("wave"),
    role: index === 0 ? "teaser" : index === WAVE_OFFSETS.length - 1 ? "recap" : "info",
    offsetDays,
    contentType: index === 1 ? "carousel" : "ig-post",
    title: campaign.name,
    hook: campaign.oneLiner,
    angle: campaign.theme,
    contentId: null,
  }));
}

export function withStrategy(campaign: Campaign, strategy: CampaignStrategy): Campaign {
  return { ...campaign, strategy, updatedAt: Date.now() };
}
