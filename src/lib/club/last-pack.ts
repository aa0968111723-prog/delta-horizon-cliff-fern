import type { CampaignPlan, ContentKind } from "../studio/types.ts";

export type LastPack = {
  projectId: string;
  campaignId: string;
  eventName: string;
  hook: string;
  caption: string;
  hashtags: string[];
  heroAssetId: string | null;
  heroThumb: string;
  kind: ContentKind;
  directionName?: string;
  updatedAt: number;
};

export function fallbackHeroThumb(eventName: string) {
  if (eventName.includes("茶")) return "/seed/tea.svg";
  if (eventName.includes("浮游") || eventName.includes("禪光") || eventName.includes("三色光")) return "/seed/tricolor.svg";
  if (eventName.includes("龜")) return "/seed/turtle.svg";
  return "/seed/tamsui.svg";
}

export function lastPackFromPlan(input: {
  projectId: string;
  campaignId: string;
  eventName: string;
  plan: Pick<CampaignPlan, "hook" | "captions" | "hashtags">;
  kind?: ContentKind;
  directionName?: string;
  heroAssetId?: string | null;
  heroThumb?: string;
  updatedAt?: number;
}): LastPack {
  return {
    projectId: input.projectId,
    campaignId: input.campaignId,
    eventName: input.eventName,
    hook: input.plan.hook,
    caption: input.plan.captions[0]?.text ?? input.plan.hook,
    hashtags: input.plan.hashtags ?? [],
    heroAssetId: input.heroAssetId ?? null,
    heroThumb: input.heroThumb || fallbackHeroThumb(input.eventName),
    kind: input.kind ?? "ig-post",
    directionName: input.directionName,
    updatedAt: input.updatedAt ?? Date.now(),
  };
}

export function lastPackPreviewSrc(pack: LastPack, assetUrls: Record<string, string>) {
  if (pack.heroAssetId && assetUrls[pack.heroAssetId]) return assetUrls[pack.heroAssetId];
  return pack.heroThumb || fallbackHeroThumb(pack.eventName);
}
