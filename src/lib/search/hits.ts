import type { MemoryItem } from "../club/memory.ts";
import { matchHit, rankHits, clubTagsFromText } from "../club/rank.ts";
import { isoTaipei } from "../club/season.ts";
import { inferCategory, migrateAsset, sourceLabel as assetSourceLabel } from "../studio/assets.ts";
import type { AssetMeta, AssetSourceKind } from "../studio/types.ts";
import { styleBriefFromReport, styleReportFromHit } from "../vision/from-hit.ts";

export type FileLike = {
  id?: string;
  name?: string;
  mimeType?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  thumbnailUrl?: string;
  iconLink?: string;
};

export function driveThumb(item: FileLike) {
  const remote = item.thumbnailLink || item.thumbnailUrl || "";
  if (remote.startsWith("https://")) return remote;
  const name = item.name || "";
  if (/茶/.test(name)) return "/seed/tea.svg";
  if (/龜|turtle/i.test(name)) return "/seed/turtle.svg";
  if (/浮游|三色|禪光/.test(name)) return "/seed/tricolor.svg";
  return "/seed/campus.svg";
}

export function driveHitFromFile(item: FileLike, index = 0): MemoryItem {
  const title = item.name || "未命名檔案";
  const folder = item.mimeType?.includes("folder");
  return {
    id: item.id || `drive_${index}`,
    source: "drive",
    title,
    subtitle: folder ? `Google Drive / ${title}` : `Google Drive / ${title}`,
    tags: ["drive", ...clubTagsFromText(title)],
    kind: folder ? "asset" : /海報|文宣/.test(title) ? "poster" : "asset",
    date: (item.modifiedTime || "").slice(0, 10),
    thumb: driveThumb(item),
    notes: item.mimeType || "Drive 檔案",
    mimeType: item.mimeType,
    live: true,
  };
}

export function asDriveHits(data: unknown) {
  if (!data) return [];
  const rows = Array.isArray(data) ? data : typeof data === "object" && data && "files" in data ? (data as { files: unknown[] }).files : [];
  return rows.slice(0, 12).map((row, index) => driveHitFromFile(row as FileLike, index));
}

export function mergeRanked<T extends MemoryItem>(query: string, live: T[], memory: T[]) {
  const matchedLive = live.filter((item) => matchHit(item, query));
  const restLive = live.filter((item) => !matchHit(item, query));
  const merged = [...matchedLive, ...memory, ...restLive].filter(
    (item, index, all) => all.findIndex((row) => row.id === item.id) === index,
  );
  return rankHits(merged, query);
}

export function adoptIdeaFromHit(item: Pick<MemoryItem, "title" | "notes" | "subtitle" | "source"> & { tags?: string[] }) {
  const source = item.subtitle || item.source;
  const report = styleReportFromHit(item);
  const dna =
    item.source === "canva"
      ? "延續配色、留白與文字層級，不要複製舊排版。"
      : item.source === "instagram"
        ? "先學 Hook 與停留感，再寫新活動。"
        : item.source === "drive"
          ? "用現場感覺當參考，不要直接重貼舊照片。"
          : "延續龜龜與三色光，不要做成廟宇海報。";
  return `延續這個來源的品牌 DNA，做新的活動。不要直接複製舊作品。來源：${source}。參考：「${item.title}」。${dna}${styleBriefFromReport(report, source)}${item.notes}`.slice(0, 420);
}

export function uniqueIds(ids: string[]) {
  return ids.filter((id, index, all) => id && all.indexOf(id) === index);
}

export function assetIdFromHit(item: Pick<MemoryItem, "id">) {
  return item.id.startsWith("asset_") ? item.id : `asset_${item.id}`;
}

export function assetSourceFromHit(source: MemoryItem["source"]): AssetSourceKind {
  if (source === "drive" || source === "canva" || source === "instagram" || source === "generated") return source;
  return "seed";
}

function licenseOwnerFromHit(source: MemoryItem["source"]) {
  if (source === "drive") return "Google Drive";
  if (source === "canva") return "Canva";
  if (source === "instagram") return "Instagram";
  if (source === "generated") return "AI Generated";
  return "淡江大學禪學社";
}

export function assetFromHit(item: Pick<MemoryItem, "id" | "source" | "title" | "subtitle" | "tags" | "kind" | "date" | "thumb" | "notes" | "mimeType">): AssetMeta {
  const source = assetSourceFromHit(item.source);
  const thumb = item.thumb || "";
  const seedSrc = thumb.startsWith("/") || thumb.startsWith("https://") || thumb.startsWith("data:") ? thumb : undefined;
  const tall = item.kind === "story" || item.kind === "reels";
  const hinted =
    item.kind === "story"
      ? ("story-asset" as const)
      : item.kind === "reels"
        ? ("reels-asset" as const)
        : item.kind === "poster" || item.kind === "ig-post" || item.kind === "carousel"
          ? ("poster" as const)
          : undefined;
  const createdAt = item.date ? Date.parse(item.date) || Date.now() : Date.now();
  return migrateAsset({
    id: assetIdFromHit(item),
    name: item.title,
    category: hinted ?? inferCategory({ name: item.title, tags: item.tags }),
    mime: item.mimeType || (thumb.includes(".svg") ? "image/svg+xml" : "image/jpeg"),
    width: 1080,
    height: tall ? 1920 : 1080,
    tags: item.tags,
    createdAt,
    updatedAt: createdAt,
    seedSrc,
    source,
    licenseNotes: `${item.subtitle}${item.notes ? `。${item.notes}` : ""}`.slice(0, 280),
    licenseOwner: licenseOwnerFromHit(item.source),
  });
}

export function assetsFromHits(items: Array<Parameters<typeof assetFromHit>[0]>) {
  return uniqueIds(items.map((item) => assetIdFromHit(item))).map((id) => {
    const hit = items.find((item) => assetIdFromHit(item) === id);
    return assetFromHit(hit!);
  });
}

export function creativeSourceFromAsset(source: AssetMeta["source"]): MemoryItem["source"] {
  if (source === "drive" || source === "canva" || source === "instagram" || source === "generated") return source;
  return "brand";
}

export function adoptIdeaFromAsset(asset: Pick<AssetMeta, "name" | "licenseNotes" | "source" | "tags">) {
  return adoptIdeaFromHit({
    title: asset.name,
    notes: asset.licenseNotes,
    subtitle: `${assetSourceLabel(asset.source)} / ${asset.name}`,
    source: creativeSourceFromAsset(asset.source),
    tags: asset.tags,
  });
}

export function hitFromAsset(asset: AssetMeta): MemoryItem {
  const source = creativeSourceFromAsset(asset.source);
  const kind =
    asset.category === "story-asset"
      ? ("story" as const)
      : asset.category === "reels-asset"
        ? ("reels" as const)
        : asset.category === "poster"
          ? ("poster" as const)
          : ("asset" as const);
  return {
    id: asset.id,
    source,
    title: asset.name,
    subtitle: `${assetSourceLabel(asset.source)} / ${asset.name}`,
    tags: [...new Set([...(asset.tags ?? []), ...clubTagsFromText(`${asset.name} ${asset.licenseNotes}`)])],
    kind,
    date: new Date(asset.createdAt || Date.now()).toISOString().slice(0, 10),
    thumb: asset.seedSrc || "",
    notes: asset.licenseNotes,
  };
}

export function hitFromPack(pack: {
  projectId: string;
  eventName: string;
  hook: string;
  kind: MemoryItem["kind"];
  heroThumb?: string;
}): MemoryItem {
  return {
    id: `gen_pack_${pack.projectId}`,
    source: "generated",
    title: pack.eventName,
    subtitle: "AI Generated",
    tags: ["AI生成", pack.eventName, ...clubTagsFromText(`${pack.eventName} ${pack.hook}`)],
    kind: pack.kind === "asset" ? "ig-post" : pack.kind,
    date: "",
    thumb: pack.heroThumb || "/seed/tea.svg",
    notes: pack.hook,
    caption: pack.hook,
  };
}

function kindFromIgMedia(mediaType: string): MemoryItem["kind"] {
  if (mediaType === "carousel") return "carousel";
  if (mediaType === "reels") return "reels";
  return "ig-post";
}

/** Map a stored / just-published IG post into Instagram Content Memory. */
export function hitFromIgPost(post: {
  id: string;
  mediaType: string;
  caption: string;
  takenAt: number;
  thumb?: string;
  analysis?: string;
}): MemoryItem {
  const date = isoTaipei(new Date(post.takenAt || Date.now()));
  const hook = (post.caption || "").split("\n")[0]?.trim() || "IG 貼文";
  const blob = `${post.caption} ${post.analysis || ""}`;
  const published = (post.analysis || "").includes("剛發布");
  return {
    id: post.id,
    source: "instagram",
    title: hook.slice(0, 42),
    subtitle: published ? `Instagram / ${date} · 剛發布` : `Instagram / ${date}`,
    tags: [...new Set(["instagram", ...(published ? ["剛發布"] : []), ...clubTagsFromText(blob)])],
    kind: kindFromIgMedia(post.mediaType),
    date,
    thumb: post.thumb || "/seed/tea.svg",
    caption: post.caption,
    notes: (post.analysis || post.caption || "").slice(0, 280),
  };
}

export function localCreativeHits(
  input: {
    assets?: AssetMeta[];
    lastPack?: Parameters<typeof hitFromPack>[0] | null;
    igPosts?: Array<Parameters<typeof hitFromIgPost>[0]>;
  },
  query = "",
): MemoryItem[] {
  const generated = input.lastPack ? [hitFromPack(input.lastPack)] : [];
  const ig = (input.igPosts ?? []).map(hitFromIgPost);
  const matchedIg = query.trim() ? ig.filter((item) => matchHit(item, query)) : ig;
  return [...(input.assets ?? []).map(hitFromAsset), ...generated, ...matchedIg];
}

export function mergeLocalHits<T extends MemoryItem>(
  query: string,
  groups: Record<string, T[]>,
  extras: T[],
): Record<string, T[]> {
  const next: Record<string, T[]> = { ...groups };
  for (const item of extras) {
    const key = item.source;
    next[key] = mergeRanked(query, next[key] ?? [], [item]);
  }
  return next;
}

export function countHits(groups: Record<string, MemoryItem[] | undefined>) {
  return Object.values(groups).reduce((n, list) => n + (list?.length ?? 0), 0);
}
