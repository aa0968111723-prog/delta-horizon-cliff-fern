import { isStampAsset } from "./assets.ts";
import type { AssetMeta } from "./types.ts";

/** 跟 seed 裡的示範照片 id 對齊；不從 seed.ts 匯入，讓 node 測試不必走 @/ 別名。 */
const SEED_DUSK_ID = "asset_tamsui_dusk";
const SEED_NIGHT_ID = "asset_night_lamp";
const SEED_WINDOW_ID = "asset_window_light";

export type LocalVisualHint = {
  title?: string;
  concept?: string;
  imagePrompt?: string;
  hook?: string;
};

function blobOf(hint: LocalVisualHint): string {
  return [hint.title, hint.concept, hint.imagePrompt, hint.hook].filter(Boolean).join(" ");
}

function photosOf(assets: AssetMeta[]): AssetMeta[] {
  const photos = assets.filter((asset) => !isStampAsset(asset));
  const seeds = photos.filter((asset) => asset.source === "seed");
  if (seeds.length) return seeds;
  return photos.filter((asset) => !asset.tags.includes("本機素材"));
}

function findById(photos: AssetMeta[], id: string): AssetMeta | undefined {
  return photos.find((asset) => asset.id === id);
}

function findByName(photos: AssetMeta[], pattern: RegExp): AssetMeta | undefined {
  return photos.find((asset) => pattern.test(`${asset.name} ${asset.tags.join(" ")}`));
}

/**
 * 沒有生圖服務時，把視覺方向對到素材庫裡已有的照片。
 * 不生假畫面，只選品牌記憶裡的示範圖。
 */
export function matchLocalVisualAsset(hint: LocalVisualHint, assets: AssetMeta[]): AssetMeta | undefined {
  const photos = photosOf(assets);
  if (!photos.length) return undefined;
  const blob = blobOf(hint);

  if (/夜燈|宿舍|夜晚的安靜|night lamp|dorm desk|indigo/i.test(blob)) {
    return findById(photos, SEED_NIGHT_ID) ?? findByName(photos, /夜|宿舍/);
  }
  if (/窗邊|坐墊|窗邊的白天|classroom|cushion|window blinds/i.test(blob)) {
    return findById(photos, SEED_WINDOW_ID) ?? findByName(photos, /窗|坐墊/);
  }
  if (/淡水|傍晚|淡水的光|Tamsui|dusk|riverside/i.test(blob)) {
    return findById(photos, SEED_DUSK_ID) ?? findByName(photos, /淡水|傍晚|河/);
  }

  return findById(photos, SEED_DUSK_ID) ?? photos[0];
}

/** 「換一張」時在示範照片裡輪替，仍不生假畫面。 */
export function nextLocalVisualAsset(
  hint: LocalVisualHint,
  assets: AssetMeta[],
  currentId: string | null,
): AssetMeta | undefined {
  const photos = photosOf(assets);
  if (!photos.length) return undefined;
  if (!currentId) return matchLocalVisualAsset(hint, photos);
  const index = photos.findIndex((asset) => asset.id === currentId);
  if (index < 0) return matchLocalVisualAsset(hint, photos) ?? photos[0];
  return photos[(index + 1) % photos.length];
}

export const LOCAL_VISUAL_NOTE = "目前沒有生圖服務，先套示範照片。不是 AI 生成的畫面。";

export function localVisualNote(ratioLabel: string): string {
  return `目前沒有生圖服務，先套示範照片並排成 ${ratioLabel}。不是 AI 生成的畫面。`;
}

export function localVisualRatioLine(ratioLabel: string): string {
  return `已排成 ${ratioLabel}（只改構圖比例與留白）`;
}

/** 跟生成卡片上的比例標籤對齊，讓來源列也能寫「已排成 Story 9:16」。 */
export function visualRatioLabel(ratio: string): string {
  if (ratio === "9:16") return "Story 9:16";
  if (ratio === "1:1") return "IG 1:1";
  if (ratio === "1.91:1") return "LINE / 連結";
  return "IG 4:5";
}
