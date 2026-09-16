import type { ConvertedPack } from "../convert/pack.ts";
import type { CampaignPlan, ContentKind, FormatId } from "../studio/types.ts";

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
  converted: ConvertedPack["items"];
  directionName?: string;
  updatedAt: number;
};

export function fallbackHeroThumb(eventName: string) {
  if (eventName.includes("茶")) return "/seed/tea.svg";
  if (eventName.includes("浮游") || eventName.includes("禪光") || eventName.includes("三色光")) return "/seed/tricolor.svg";
  if (eventName.includes("龜")) return "/seed/turtle.svg";
  return "/seed/tamsui.svg";
}

export function formatIdFromKind(kind: ContentKind): FormatId {
  if (kind === "story") return "story";
  if (kind === "reels") return "reels-cover";
  if (kind === "threads") return "threads";
  if (kind === "line") return "line-promo";
  return "feed-portrait";
}

export function kindFromFormat(formatId: FormatId): ContentKind {
  if (formatId === "story") return "story";
  if (formatId === "reels-cover") return "reels";
  if (formatId === "threads") return "threads";
  if (formatId === "line-promo") return "line";
  return "ig-post";
}

export function kindAspectClass(kind: ContentKind) {
  if (kind === "story" || kind === "reels") return "aspect-[9/16]";
  if (kind === "threads" || kind === "line") return "aspect-square";
  return "aspect-[4/5]";
}

export function lastPackFromPlan(input: {
  projectId: string;
  campaignId: string;
  eventName: string;
  plan: Pick<CampaignPlan, "hook" | "captions" | "hashtags">;
  kind?: ContentKind;
  converted?: ConvertedPack["items"];
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
    converted: input.converted ?? [],
    directionName: input.directionName,
    updatedAt: input.updatedAt ?? Date.now(),
  };
}

export function withPackKind(pack: LastPack, kind: ContentKind, converted?: ConvertedPack["items"]): LastPack {
  return {
    ...pack,
    kind,
    converted: converted ?? pack.converted,
    updatedAt: Date.now(),
  };
}

export function lastPackPreviewSrc(pack: LastPack, assetUrls: Record<string, string>) {
  if (pack.heroAssetId && assetUrls[pack.heroAssetId]) return assetUrls[pack.heroAssetId];
  return pack.heroThumb || fallbackHeroThumb(pack.eventName);
}
