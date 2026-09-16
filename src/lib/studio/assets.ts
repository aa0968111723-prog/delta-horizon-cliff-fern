import { matchHit } from "../club/rank.ts";
import type {
  Artboard,
  AssetCategory,
  AssetKind,
  AssetMeta,
  AssetSourceKind,
  AssetUsageStatus,
  BrandKit,
  Project,
} from "./types.ts";

export const ASSET_DRAG_MIME = "application/x-zenlight-asset";

export const ASSET_CATEGORIES: {
  id: AssetCategory;
  label: string;
  hint: string;
  virtual?: boolean;
}[] = [
  { id: "logo", label: "Logo", hint: "社徽與變體" },
  { id: "mascot", label: "龜龜", hint: "角色、貼圖、吉祥物" },
  { id: "photo", label: "活動照片", hint: "茶會、社課、現場" },
  { id: "people", label: "社員照片", hint: "人、互動、側臉" },
  { id: "campus", label: "淡江校園", hint: "斜坡、宮燈、教室" },
  { id: "tamsui", label: "淡水", hint: "河岸、捷運、夜色" },
  { id: "poster", label: "海報", hint: "歷屆文宣" },
  { id: "background", label: "背景", hint: "天空、材質、留白" },
  { id: "generated", label: "AI 生成", hint: "Studio 產生的圖" },
  { id: "ig", label: "IG", hint: "貼文與輪播畫面" },
  { id: "story", label: "Story", hint: "限動畫面" },
  { id: "reels", label: "Reels", hint: "封面與截幀" },
  { id: "archive", label: "歷屆活動", hint: "舊檔、可延伸" },
  { id: "illustration", label: "插圖", hint: "手繪與裝飾" },
  { id: "icon", label: "圖示", hint: "小符號" },
  { id: "template", label: "模板", hint: "可套用的版型起點", virtual: true },
  { id: "history", label: "IG", hint: "曾放到畫布或來自 IG", virtual: true },
];

export const ASSET_SOURCES: { id: AssetSourceKind; label: string }[] = [
  { id: "upload", label: "本機上傳" },
  { id: "seed", label: "品牌記憶" },
  { id: "generated", label: "AI 生成" },
  { id: "drive", label: "Google Drive" },
  { id: "canva", label: "Canva" },
  { id: "instagram", label: "Instagram" },
];

export function categoryLabel(id: AssetCategory) {
  return ASSET_CATEGORIES.find((item) => item.id === id)?.label ?? id;
}

export function sourceLabel(id: AssetSourceKind) {
  return ASSET_SOURCES.find((item) => item.id === id)?.label ?? id;
}

export function usageLabel(status: AssetUsageStatus) {
  if (status === "in-use") return "使用中";
  if (status === "used") return "曾使用";
  return "未使用";
}

export function kindFromCategory(category: AssetCategory): AssetKind {
  if (category === "logo") return "logo";
  if (category === "background") return "pattern";
  return "image";
}

export function inferCategory(raw: Partial<AssetMeta>): AssetCategory {
  if (raw.category && ASSET_CATEGORIES.some((item) => item.id === raw.category)) {
    return raw.category;
  }
  if (raw.kind === "logo") return "logo";
  if (raw.kind === "pattern") return "background";
  const tags = (raw.tags ?? []).join(" ").toLowerCase();
  const name = (raw.name ?? "").toLowerCase();
  const blob = `${tags} ${name}`;
  if (/龜龜|吉祥物|mascot|turtle/.test(blob)) return "mascot";
  if (/校園|宮燈|淡江|campus/.test(blob)) return "campus";
  if (/淡水|河岸|tamsui/.test(blob)) return "tamsui";
  if (/海報|poster/.test(blob)) return "poster";
  if (/人物|人像|社員|portrait|people/.test(blob)) return "people";
  if (/背景|場景|材質|background|texture/.test(blob)) return "background";
  if (/龜龜|插圖|illustration|handdrawn/.test(blob)) return "illustration";
  if (/圖示|icon|badge/.test(blob)) return "icon";
  if (/logo|標誌/.test(blob)) return "logo";
  return "photo";
}

export function migrateAsset(raw: Partial<AssetMeta> & { id: string; name: string }): AssetMeta {
  const category = inferCategory(raw);
  return {
    id: raw.id,
    name: raw.name,
    kind: raw.kind ?? kindFromCategory(category),
    category,
    mime: raw.mime ?? "image/jpeg",
    width: raw.width ?? 0,
    height: raw.height ?? 0,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    createdAt: raw.createdAt ?? Date.now(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? Date.now(),
    seedSrc: raw.seedSrc,
    source:
      raw.source === "seed" ||
      raw.source === "generated" ||
      raw.source === "upload" ||
      raw.source === "drive" ||
      raw.source === "canva" ||
      raw.source === "instagram"
        ? raw.source
        : "upload",
    licenseNotes: raw.licenseNotes ?? "",
    licenseOwner: raw.licenseOwner ?? "",
    favorite: Boolean(raw.favorite),
    lastUsedAt: raw.lastUsedAt ?? null,
    useCount: raw.useCount ?? 0,
  };
}

export function createGeneratedAsset(input: {
  id: string;
  name: string;
  mime: string;
  width: number;
  height: number;
  category?: AssetCategory;
  tags?: string[];
}): AssetMeta {
  const now = Date.now();
  return migrateAsset({
    id: input.id,
    name: input.name,
    kind: kindFromCategory(input.category ?? "poster"),
    category: input.category ?? "poster",
    mime: input.mime,
    width: input.width,
    height: input.height,
    tags: input.tags ?? ["AI生成"],
    createdAt: now,
    updatedAt: now,
    source: "generated",
    licenseNotes: "由禪光依報名網址在本機產生，僅供畫面使用。",
    licenseOwner: "本機產生",
  });
}

export function matchesAssetQuery(asset: AssetMeta, query: string) {
  const q = query.trim();
  if (!q) return true;
  return matchHit(
    {
      title: asset.name,
      notes: asset.licenseNotes,
      tags: asset.tags,
      subtitle: `${categoryLabel(asset.category)} ${sourceLabel(asset.source)}`,
    },
    q,
  );
}

export function uniqueAssets(items: AssetMeta[]) {
  return items.filter((item, index, all) => item.id && all.findIndex((row) => row.id === item.id) === index);
}

export function assetsByIds(assets: AssetMeta[], ids: string[]) {
  const map = new Map(assets.map((item) => [item.id, item]));
  return ids
    .filter((id, index, all) => id && all.indexOf(id) === index)
    .map((id) => map.get(id))
    .filter((item): item is AssetMeta => Boolean(item));
}

export function upsertAssetList(assets: AssetMeta[], meta: AssetMeta): AssetMeta[] {
  const next = migrateAsset(meta);
  const idx = assets.findIndex((item) => item.id === next.id);
  if (idx === -1) return [next, ...assets];
  const prev = assets[idx];
  const merged = migrateAsset({
    ...prev,
    ...next,
    createdAt: prev.createdAt,
    useCount: Math.max(prev.useCount ?? 0, next.useCount ?? 0),
    lastUsedAt: next.lastUsedAt ?? prev.lastUsedAt,
    favorite: Boolean(prev.favorite || next.favorite),
    tags: [...new Set([...(prev.tags ?? []), ...(next.tags ?? [])])],
    updatedAt: Date.now(),
  });
  return [merged, ...assets.filter((_, index) => index !== idx)];
}

function collectFromBoard(board: Artboard | undefined, ids: Set<string>) {
  if (!board) return;
  for (const layer of board.layers) {
    if (layer.type === "image") ids.add(layer.assetId);
    if (layer.type === "logo" && layer.assetId) ids.add(layer.assetId);
    if (board.background.assetId) ids.add(board.background.assetId);
  }
}

export function collectUsedAssetIds(projects: Project[], brands: BrandKit[]): Set<string> {
  const ids = new Set<string>();
  for (const project of projects) {
    for (const board of Object.values(project.artboards)) collectFromBoard(board, ids);
    for (const list of Object.values(project.slides ?? {})) {
      for (const board of list ?? []) collectFromBoard(board, ids);
    }
  }
  for (const brand of brands) {
    if (brand.logoAssetId) ids.add(brand.logoAssetId);
    for (const logo of brand.logos ?? []) ids.add(logo.assetId);
  }
  return ids;
}

export function assetUsageStatus(asset: AssetMeta, usedIds: Set<string>): AssetUsageStatus {
  if (usedIds.has(asset.id)) return "in-use";
  if (asset.useCount > 0 || asset.lastUsedAt) return "used";
  return "unused";
}

export function fitPlacedAsset(asset: AssetMeta, maxW: number, maxH: number) {
  const w = Math.max(1, asset.width || maxW);
  const h = Math.max(1, asset.height || maxH);
  const scale = Math.min(maxW / w, maxH / h, 1);
  return {
    w: Math.max(48, Math.round(w * scale)),
    h: Math.max(48, Math.round(h * scale)),
  };
}
