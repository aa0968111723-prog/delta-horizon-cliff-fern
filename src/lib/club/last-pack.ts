import type { ConvertedPack } from "../convert/pack.ts";
import type { CampaignPlan, ContentKind, CreativeDirection, FormatId } from "../studio/types.ts";

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
  formatPublicUrls?: Partial<Record<ContentKind, string>>;
  canvaDesignId?: string;
  canvaEditUrl?: string;
  canvaExportUrl?: string;
  reelsVideoUrl?: string;
  reelsJobId?: string;
  directionName?: string;
  plan?: CampaignPlan;
  sourceIdea?: string;
  updatedAt: number;
};

export function httpsVideoUrl(src?: string | null) {
  const raw = src?.trim() || "";
  if (!raw.startsWith("https://")) return "";
  if (/\.(mp4|mov|webm)(\?|$)/i.test(raw)) return raw;
  if (/x\.ai|imgen|grok|fbcdn|cdninstagram|scontent|instagram\.com/i.test(raw)) return raw;
  return "";
}

export function httpsRasterUrl(src?: string | null) {
  const raw = src?.trim() || "";
  if (!raw.startsWith("https://")) return "";
  if (/\.svg(\?|$)/i.test(raw) || /image\/svg/i.test(raw)) return "";
  if (/\.(jpe?g|png|webp)(\?|$)/i.test(raw)) return raw;
  if (/fbcdn|cdninstagram|scontent|instagram\.com|googleusercontent|canva|x\.ai|imgen|grok/i.test(raw)) return raw;
  return "";
}

export function needsPublicRaster(pack: LastPack) {
  return !httpsRasterUrl(pack.formatPublicUrls?.[pack.kind]) && !httpsRasterUrl(pack.canvaExportUrl);
}

export function rasterReadyMessage(pack: LastPack) {
  if (!needsPublicRaster(pack)) return "已有公開圖，可以官方發布到 IG。";
  if (pack.canvaEditUrl) return "Canva 設計已開。匯出 JPG 後，才能官方發布。";
  return "還沒連接 Canva。可以先看 IG Preview 與排程，連接後再送進 Canva。";
}

function httpsUrlMap(urls?: Partial<Record<ContentKind, string>>) {
  const next: Partial<Record<ContentKind, string>> = {};
  for (const [kind, url] of Object.entries(urls ?? {})) {
    const publicUrl = httpsRasterUrl(url);
    if (publicUrl) next[kind as ContentKind] = publicUrl;
  }
  return next;
}

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
  formatPublicUrls?: Partial<Record<ContentKind, string>>;
  canvaDesignId?: string;
  canvaEditUrl?: string;
  canvaExportUrl?: string;
  reelsVideoUrl?: string;
  reelsJobId?: string;
  directionName?: string;
  sourceIdea?: string;
  heroAssetId?: string | null;
  heroThumb?: string;
  updatedAt?: number;
}): LastPack {
  const kind = input.kind ?? "ig-post";
  const packs = input.packs ?? {};
  const converted = input.converted ?? packs[kind] ?? [];
  const formatAssetIds = input.formatAssetIds ?? {};
  const formatPublicUrls = httpsUrlMap(input.formatPublicUrls);
  const heroThumb = input.heroThumb?.startsWith("data:") ? fallbackHeroThumb(input.eventName) : input.heroThumb;
  const plan = input.plan.campaignName ? (input.plan as CampaignPlan) : undefined;
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
    formatPublicUrls,
    canvaDesignId: input.canvaDesignId,
    canvaEditUrl: input.canvaEditUrl?.startsWith("https://") ? input.canvaEditUrl : undefined,
    canvaExportUrl: httpsRasterUrl(input.canvaExportUrl) || undefined,
    reelsVideoUrl: httpsVideoUrl(input.reelsVideoUrl) || undefined,
    reelsJobId: input.reelsJobId,
    directionName: input.directionName,
    plan,
    sourceIdea: input.sourceIdea,
    updatedAt: input.updatedAt ?? Date.now(),
  };
}

export function packForScheduleRow(
  row: { campaignId: string | null; projectId: string | null; title: string; contentKind: ContentKind },
  lastPack: LastPack | null,
) {
  if (lastPack) return withPackKind(lastPack, row.contentKind);
  return lastPackFromPlan({
    projectId: row.projectId || "",
    campaignId: row.campaignId || "",
    eventName: row.title,
    plan: { hook: row.title, captions: [{ style: "學生版", text: row.title }], hashtags: ["#淡江禪學社"] },
    kind: row.contentKind,
  });
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
  const publicUrl = pack.formatPublicUrls?.[kind] || (kind === pack.kind ? pack.canvaExportUrl : "") || "";
  if (publicUrl) return publicUrl;
  return pack.heroThumb || fallbackHeroThumb(pack.eventName);
}

export function packAssetIds(pack: LastPack | null) {
  if (!pack) return [];
  return [pack.heroAssetId, ...Object.values(pack.formatAssetIds ?? {})].filter((id): id is string => Boolean(id));
}

export function withCanvaExport(pack: LastPack, result: { id: string; editUrl: string; exportUrl?: string }): LastPack {
  const exportUrl = httpsRasterUrl(result.exportUrl);
  return {
    ...pack,
    canvaDesignId: result.id,
    canvaEditUrl: result.editUrl.startsWith("https://") ? result.editUrl : pack.canvaEditUrl,
    canvaExportUrl: exportUrl || pack.canvaExportUrl,
    formatPublicUrls: {
      ...pack.formatPublicUrls,
      ...(exportUrl ? { [pack.kind]: exportUrl } : {}),
    },
    updatedAt: Date.now(),
  };
}

export function withPublicRaster(pack: LastPack, url?: string | null): LastPack {
  const publicUrl = httpsRasterUrl(url);
  if (!publicUrl) return pack;
  return persistablePack({
    ...pack,
    formatPublicUrls: { ...pack.formatPublicUrls, [pack.kind]: publicUrl },
    updatedAt: Date.now(),
  })!;
}

export function publicReelsCoverUrl(pack: LastPack | null) {
  if (!pack) return "";
  return httpsRasterUrl(pack.formatPublicUrls?.reels) || httpsRasterUrl(pack.canvaExportUrl);
}

export function withReelsVideo(pack: LastPack, input: { url?: string; requestId?: string }): LastPack {
  return persistablePack({
    ...withPackKind(pack, "reels"),
    reelsVideoUrl: httpsVideoUrl(input.url) || pack.reelsVideoUrl,
    reelsJobId: input.requestId || pack.reelsJobId,
    updatedAt: Date.now(),
  })!;
}

export function persistablePack(pack: LastPack | null): LastPack | null {
  if (!pack) return null;
  return {
    ...pack,
    heroThumb: pack.heroThumb?.startsWith("data:") ? fallbackHeroThumb(pack.eventName) : pack.heroThumb,
    packs: pack.packs ?? {},
    formatAssetIds: pack.formatAssetIds ?? {},
    formatPublicUrls: httpsUrlMap(pack.formatPublicUrls),
    canvaDesignId: pack.canvaDesignId,
    canvaEditUrl: pack.canvaEditUrl?.startsWith("https://") ? pack.canvaEditUrl : undefined,
    canvaExportUrl: httpsRasterUrl(pack.canvaExportUrl) || undefined,
    reelsVideoUrl: httpsVideoUrl(pack.reelsVideoUrl) || undefined,
    reelsJobId: pack.reelsJobId,
    plan: pack.plan?.hook ? pack.plan : undefined,
    sourceIdea: pack.sourceIdea,
  };
}

export function pickedFromPack(pack: LastPack): CreativeDirection | null {
  const dirs = pack.plan?.directions;
  if (dirs?.length) {
    return dirs.find((item) => item.name === pack.directionName) ?? dirs[0] ?? null;
  }
  if (!pack.plan?.hook) return null;
  return {
    id: "restored",
    name: pack.directionName || "主視覺",
    concept: pack.plan.concept || pack.plan.visualDirection || "",
    palette: pack.plan.colorMood || "",
    composition: "",
    typeDirection: "",
    imagePrompt: "",
    headline: pack.hook,
    subhead: pack.plan.subhead || "",
  };
}

export function ideaFlowRestore(pack: LastPack | null) {
  if (!pack?.plan?.hook) return null;
  const picked = pickedFromPack(pack);
  if (!picked) return null;
  return {
    idea: pack.sourceIdea || `下週有一場${pack.eventName}`,
    plan: pack.plan,
    campaignId: pack.campaignId || null,
    projectId: pack.projectId || null,
    packKind: pack.kind,
    picked,
    publishHint: rasterReadyMessage(pack),
  };
}
