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
  { id: "mascot", label: "龜龜", hint: "吉祥物、輕鬆內容、限動、倒數" },
  { id: "campus", label: "淡水／校園", hint: "淡水河、克難坡、宿舍、窗邊" },
  { id: "poster", label: "海報／文宣", hint: "歷屆主視覺、海報、印刷品" },
  { id: "photo", label: "活動照片", hint: "社課、茶會、現場紀實" },
  { id: "people", label: "社員現場", hint: "人、手、坐下來的瞬間" },
  { id: "background", label: "場景底圖", hint: "材質、留白、可壓字的底" },
  { id: "illustration", label: "插圖", hint: "手繪、裝飾、編輯素材" },
  { id: "icon", label: "圖示", hint: "小圖、符號、徽章" },
  { id: "logo", label: "標誌", hint: "三色光標誌與變體" },
  { id: "template", label: "模板", hint: "可套用的版型起點", virtual: true },
  { id: "history", label: "歷史素材", hint: "曾放到畫布的檔案", virtual: true },
];

export const ASSET_SOURCES: { id: AssetSourceKind; label: string }[] = [
  { id: "upload", label: "本機上傳" },
  { id: "seed", label: "示範素材" },
  { id: "generated", label: "AI 生成" },
  { id: "drive", label: "Google Drive" },
  { id: "canva", label: "Canva" },
  { id: "instagram", label: "Instagram" },
];

const ASSET_SOURCE_IDS = new Set<AssetSourceKind>(ASSET_SOURCES.map((item) => item.id));

export function isAssetSourceKind(value: unknown): value is AssetSourceKind {
  return typeof value === "string" && ASSET_SOURCE_IDS.has(value as AssetSourceKind);
}

/** 從標籤／權利人還原 Drive、Canva、IG，舊資料曾一律存成「本機上傳」。 */
export function inferAssetSource(raw: Partial<AssetMeta>): AssetSourceKind {
  if (raw.source === "generated") return "generated";
  if (raw.source === "seed" || raw.seedSrc) return "seed";
  if (isAssetSourceKind(raw.source) && raw.source !== "upload") return raw.source;
  return inferRemoteOrUpload(raw);
}

function inferRemoteOrUpload(raw: Partial<AssetMeta>): AssetSourceKind {
  const blob = `${(raw.tags ?? []).join(" ")} ${raw.licenseOwner ?? ""} ${raw.licenseNotes ?? ""}`;
  if (/Google Drive/i.test(blob)) return "drive";
  if (/\bCanva\b/i.test(blob)) return "canva";
  if (/Instagram/i.test(blob)) return "instagram";
  if (raw.source === "upload") return "upload";
  return "upload";
}

/** 畫布／卡片預覽：示範素材直接用 public 路徑，不等 IndexedDB。 */
export function previewUrlForAsset(
  asset: Pick<AssetMeta, "seedSrc">,
  blobUrl?: string | null,
): string | undefined {
  return asset.seedSrc || blobUrl || undefined;
}

export function mimeForAssetSrc(src: string, fallback = "image/png"): string {
  if (/\.svg(\?|#|$)/i.test(src)) return "image/svg+xml";
  if (/\.png(\?|#|$)/i.test(src)) return "image/png";
  if (/\.webp(\?|#|$)/i.test(src)) return "image/webp";
  if (/\.gif(\?|#|$)/i.test(src)) return "image/gif";
  if (/\.jpe?g(\?|#|$)/i.test(src)) return "image/jpeg";
  return fallback;
}

/** IndexedDB 裡若曾寫入 HTML 錯誤頁，就不能當圖片預覽。 */
export function isDisplayableImageBlob(blob: Blob | undefined | null): boolean {
  if (!blob || blob.size < 16) return false;
  const type = (blob.type || "").toLowerCase();
  if (!type) return true;
  if (type.startsWith("image/")) return true;
  if (type.includes("svg") || type === "application/xml" || type === "text/xml") return true;
  if (type.includes("html") || type.includes("json") || type.startsWith("text/")) return false;
  return false;
}

/** 匯出畫布時：IndexedDB 裡有可用圖就用 blob，否則退回示範素材的 public 路徑。 */
export function pickExportImageSource(
  blob: Blob | undefined | null,
  seedSrc?: string,
): { kind: "blob"; blob: Blob } | { kind: "url"; url: string } | null {
  if (blob && isDisplayableImageBlob(blob)) return { kind: "blob", blob };
  if (seedSrc) return { kind: "url", url: seedSrc };
  return null;
}

/** SVG 用 object-cover 在 Chromium 會變成空白（intrinsic size 0）。 */
export function isSvgPreviewSrc(src?: string | null, mime?: string) {
  if ((mime || "").includes("svg")) return true;
  return /\.svg(\?|#|$)/i.test(src ?? "");
}

export function assetPreviewFitClass(asset: { mime?: string; seedSrc?: string }, blobUrl?: string | null) {
  return isSvgPreviewSrc(asset.seedSrc ?? blobUrl, asset.mime) ? "object-fill" : "object-cover";
}

/** Logo／龜龜是蓋章；照片、插圖、現場才當主視覺。 */
export function isStampAsset(asset: Pick<AssetMeta, "kind" | "category">): boolean {
  return asset.kind === "logo" || asset.category === "logo";
}

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
  if (category === "logo" || category === "mascot") return "logo";
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
  if (/龜龜|吉祥物|gugu|mascot/.test(blob)) return "mascot";
  if (/淡水|校園|克難坡|宮燈|河邊|tamsui|campus/.test(blob)) return "campus";
  if (/海報|文宣|主視覺|poster/.test(blob)) return "poster";
  if (/人物|人像|社員|portrait|people/.test(blob)) return "people";
  if (/背景|場景|材質|background|texture/.test(blob)) return "background";
  if (/插圖|illustration|handdrawn/.test(blob)) return "illustration";
  if (/圖示|icon|badge/.test(blob)) return "icon";
  if (/logo|標誌/.test(blob)) return "logo";
  if (raw.source === "generated") return "illustration";
  return "photo";
}

export function migrateAsset(raw: Partial<AssetMeta> & { id: string; name: string }): AssetMeta {
  const category = inferCategory(raw);
  const source = raw.source && SOURCE_IDS.has(raw.source) ? raw.source : "upload";
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
    source: inferAssetSource(raw),
    licenseNotes: raw.licenseNotes ?? "",
    licenseOwner: raw.licenseOwner ?? "",
    favorite: Boolean(raw.favorite),
    lastUsedAt: raw.lastUsedAt ?? null,
    useCount: raw.useCount ?? 0,
    insight: raw.insight,
  };
}

const ASSET_SOURCE_IDS: AssetSourceKind[] = ["upload", "seed", "generated", "drive", "canva", "instagram"];

function isAssetSource(v: unknown): v is AssetSourceKind {
  return typeof v === "string" && ASSET_SOURCE_IDS.includes(v as AssetSourceKind);
}

export function createGeneratedAsset(input: {
  id: string;
  name: string;
  mime: string;
  width: number;
  height: number;
  category?: AssetCategory;
  tags?: string[];
  licenseNotes?: string;
  licenseOwner?: string;
}): AssetMeta {
  const now = Date.now();
  return migrateAsset({
    id: input.id,
    name: input.name,
    kind: kindFromCategory(input.category ?? "illustration"),
    category: input.category ?? "illustration",
    mime: input.mime,
    width: input.width,
    height: input.height,
    tags: input.tags ?? ["AI 生成"],
    createdAt: now,
    updatedAt: now,
    source: "generated",
    licenseNotes: input.licenseNotes ?? "在本機產生，僅供畫面使用。",
    licenseOwner: input.licenseOwner ?? "本機產生",
  });
}

export function matchesAssetQuery(asset: AssetMeta, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const blob = [
    asset.name,
    asset.category,
    categoryLabel(asset.category),
    sourceLabel(asset.source),
    asset.licenseNotes,
    asset.insight?.summary ?? "",
    asset.insight?.captionIdea ?? "",
    ...(asset.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((part) => blob.includes(part));
}

function collectFromBoard(board: Artboard | undefined, ids: Set<string>) {
  if (!board) return;
  for (const layer of board.layers) {
    if (layer.type === "image") ids.add(layer.assetId);
    if (layer.type === "logo" && layer.assetId) ids.add(layer.assetId);
    if (board.background.assetId) ids.add(board.background.assetId);
  }
}

export function collectUsedAssetIds(
  projects: Project[],
  brands: BrandKit[],
  covers: { coverAssetId?: string | null; reels?: { assetId?: string | null }[] }[] = [],
): Set<string> {
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
    for (const id of brand.memory?.legacyAssetIds ?? []) ids.add(id);
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

/** 找風格接近的素材：同分類、標籤重疊、名稱接近。 */
export function similarAssets(asset: AssetMeta, all: AssetMeta[], limit = 6): AssetMeta[] {
  const tags = new Set(asset.tags.map((t) => t.toLowerCase()));
  const nameParts = asset.name.toLowerCase().split(/\s+/).filter((p) => p.length > 1);
  return all
    .filter((item) => item.id !== asset.id)
    .map((item) => {
      let score = 0;
      if (item.category === asset.category) score += 4;
      if (item.source === asset.source) score += 1;
      for (const tag of item.tags) {
        if (tags.has(tag.toLowerCase())) score += 3;
      }
      const blob = item.name.toLowerCase();
      for (const part of nameParts) {
        if (blob.includes(part)) score += 2;
      }
      return { item, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.item);
}
