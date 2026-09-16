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

export function adoptIdeaFromHit(item: Pick<MemoryItem, "title" | "notes" | "subtitle" | "source">) {
  const source = item.subtitle || item.source;
  const dna =
    item.source === "canva"
      ? "延續配色、留白與文字層級，不要複製舊排版。"
      : item.source === "instagram"
        ? "先學 Hook 與停留感，再寫新活動。"
        : item.source === "drive"
          ? "用現場感覺當參考，不要直接重貼舊照片。"
          : "延續龜龜與三色光，不要做成廟宇海報。";
  return `延續這個來源的品牌 DNA，做新的活動。不要直接複製舊作品。來源：${source}。參考：「${item.title}」。${dna}${item.notes}`.slice(0, 420);
}
