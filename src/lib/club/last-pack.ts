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
  packs?: Partial<Record<ContentKind, ConvertedPack["items"]>>;
  formatAssetIds?: Partial<Record<ContentKind, string>>;
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
  plan: Pick<CampaignPlan, "hook" | "captions" | "hashtags"> & Partial<CampaignPlan>;
  kind?: ContentKind;
  converted?: ConvertedPack["items"];
  packs?: Partial<Record<ContentKind, ConvertedPack["items"]>>;
  formatAssetIds?: Partial<Record<ContentKind, string>>;
  directionName?: string;
  heroAssetId?: string | null;
  heroThumb?: string;
  updatedAt?: number;
}): LastPack {
  const kind = input.kind ?? "ig-post";
  const packs = input.packs ?? {};
  const converted = input.converted ?? packs[kind] ?? [];
  const formatAssetIds = input.formatAssetIds ?? {};
  const heroThumb = input.heroThumb?.startsWith("data:") ? fallbackHeroThumb(input.eventName) : input.heroThumb;
  return {
    projectId: input.projectId,
    campaignId: input.campaignId,
    eventName: input.eventName,
    hook: input.plan.hook,
    caption: input.plan.captions[0]?.text ?? input.plan.hook,
    hashtags: input.plan.hashtags ?? [],
    heroAssetId: formatAssetIds[kind] ?? input.heroAssetId ?? null,
    heroThumb: heroThumb || fallbackHeroThumb(input.eventName),
    kind,
    converted,
    packs,
    formatAssetIds,
    directionName: input.directionName,
    updatedAt: input.updatedAt ?? Date.now(),
  };
}

export function withPackKind(pack: LastPack, kind: ContentKind, converted?: ConvertedPack["items"]): LastPack {
  const items = converted ?? pack.packs?.[kind] ?? pack.converted;
  return {
    ...pack,
    kind,
    converted: items,
    packs: { ...pack.packs, [kind]: items },
    heroAssetId: pack.formatAssetIds?.[kind] ?? pack.heroAssetId,
    updatedAt: Date.now(),
  };
}

export function lastPackPreviewSrc(pack: LastPack, assetUrls: Record<string, string>, kind = pack.kind) {
  const assetId = pack.formatAssetIds?.[kind] ?? pack.heroAssetId;
  if (assetId && assetUrls[assetId]) return assetUrls[assetId];
  return pack.heroThumb || fallbackHeroThumb(pack.eventName);
}

export function packAssetIds(pack: LastPack | null) {
  if (!pack) return [];
  return [pack.heroAssetId, ...Object.values(pack.formatAssetIds ?? {})].filter((id): id is string => Boolean(id));
}

export function persistablePack(pack: LastPack | null): LastPack | null {
  if (!pack) return null;
  return {
    ...pack,
    heroThumb: pack.heroThumb?.startsWith("data:") ? fallbackHeroThumb(pack.eventName) : pack.heroThumb,
    packs: pack.packs ?? {},
    formatAssetIds: pack.formatAssetIds ?? {},
  };
}
