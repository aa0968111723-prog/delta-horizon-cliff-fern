import type { FormatId } from "./types";

export type IgFormat = {
  id: FormatId;
  name: string;
  short: string;
  ratio: string;
  width: number;
  height: number;
  usage: string;
  safe: { top: number; right: number; bottom: number; left: number };
};

export const FORMATS: IgFormat[] = [
  {
    id: "feed-square",
    name: "正方形貼文",
    short: "1:1",
    ratio: "1:1",
    width: 1080,
    height: 1080,
    usage: "Feed 單張／輪播",
    safe: { top: 72, right: 72, bottom: 72, left: 72 },
  },
  {
    id: "feed-portrait",
    name: "直式貼文",
    short: "4:5",
    ratio: "4:5",
    width: 1080,
    height: 1350,
    usage: "Feed 最大曝光",
    safe: { top: 80, right: 72, bottom: 88, left: 72 },
  },
  {
    id: "feed-landscape",
    name: "橫式貼文",
    short: "1.91:1",
    ratio: "1.91:1",
    width: 1080,
    height: 566,
    usage: "連結預覽／廣告",
    safe: { top: 48, right: 64, bottom: 48, left: 64 },
  },
  {
    id: "story",
    name: "限時動態",
    short: "9:16",
    ratio: "9:16",
    width: 1080,
    height: 1920,
    usage: "Stories 全螢幕",
    safe: { top: 250, right: 80, bottom: 250, left: 80 },
  },
  {
    id: "reels-cover",
    name: "Reels 封面",
    short: "封面",
    ratio: "9:16",
    width: 1080,
    height: 1920,
    usage: "Reels 封面與預覽",
    safe: { top: 250, right: 80, bottom: 250, left: 80 },
  },
];

export const FORMAT_BY_ID: Record<FormatId, IgFormat> = Object.fromEntries(
  FORMATS.map((f) => [f.id, f]),
) as Record<FormatId, IgFormat>;

export function formatById(id: FormatId): IgFormat {
  return FORMAT_BY_ID[id];
}
