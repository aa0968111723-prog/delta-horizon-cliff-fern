import type { MemoryItem } from "../club/memory.ts";
import { matchHit, rankHits } from "../club/rank.ts";

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
    tags: ["drive", ...(/茶/.test(title) ? ["茶會"] : []), ...(/龜/.test(title) ? ["龜龜"] : []), ...(/浮游|三色/.test(title) ? ["浮游禪光"] : [])],
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
