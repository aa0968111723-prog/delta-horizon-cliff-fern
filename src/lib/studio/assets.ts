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

export const ASSET_DRAG_MIME = "application/x-kouzhen-asset";

export const ASSET_CATEGORIES: {
  id: AssetCategory;
  label: string;
  hint: string;
  virtual?: boolean;
}[] = [
  { id: "logo", label: "Logo", hint: "標誌與變體" },
  { id: "mascot", label: "龜龜", hint: "吉祥物、角色、表情" },
  { id: "photo", label: "活動照片", hint: "茶會、社課、講座紀實" },
  { id: "people", label: "社員照片", hint: "人物、合照、互動瞬間" },
  { id: "campus", label: "淡江校園", hint: "宮燈大道、海事館、教室" },
  { id: "tamsui", label: "淡水", hint: "河岸、老街、夕陽、捷運" },
  { id: "poster", label: "海報", hint: "歷屆文宣、Canva 設計" },
  { id: "background", label: "背景", hint: "三色光、材質、留白場景" },
  { id: "generated", label: "AI 生成", hint: "AI 主視覺與延伸素材" },
  { id: "ig", label: "IG", hint: "過去貼文與截圖" },
  { id: "story", label: "Story", hint: "限動素材" },
  { id: "reels", label: "Reels", hint: "封面與片段" },
  { id: "archive", label: "歷屆活動", hint: "Drive 舊資料" },
  { id: "illustration", label: "插圖", hint: "手繪、裝飾" },
  { id: "icon", label: "圖示", hint: "小圖、符號" },
  { id: "template", label: "模板", hint: "可套用的版型起點", virtual: true },
  { id: "history", label: "用過的", hint: "曾放到畫布的檔案", virtual: true },
];

export const ASSET_SOURCES: { id: AssetSourceKind; label: string }[] = [
  { id: "upload", label: "本機上傳" },
  { id: "seed", label: "示範素材" },
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
  if (/龜龜|龜|mascot|turtle|gugu/.test(blob)) return "mascot";
  if (/淡水|河岸|老街|夕陽|tamsui|river/.test(blob)) return "tamsui";
  if (/校園|淡江|宮燈|campus|tku/.test(blob)) return "campus";
  if (/海報|poster|文宣|canva/.test(blob)) return "poster";
  if (/ai 生成|generated/.test(blob)) return "generated";
  if (/人物|人像|社員|合照|portrait|people/.test(blob)) return "people";
  if (/背景|場景|材質|三色光|glow|background|texture/.test(blob)) return "background";
  if (/插圖|illustration|handdrawn/.test(blob)) return "illustration";
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
    source: isAssetSource(raw.source) ? raw.source : "upload",
    licenseNotes: raw.licenseNotes ?? "",
    licenseOwner: raw.licenseOwner ?? "",
    favorite: Boolean(raw.favorite),
    lastUsedAt: raw.lastUsedAt ?? null,
    useCount: raw.useCount ?? 0,
    insight: raw.insight ?? null,
    externalRef: raw.externalRef ?? null,
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
}): AssetMeta {
  const now = Date.now();
  return migrateAsset({
    id: input.id,
    name: input.name,
    kind: kindFromCategory(input.category ?? "icon"),
    category: input.category ?? "icon",
    mime: input.mime,
    width: input.width,
    height: input.height,
    tags: ["生成", "QR"],
    createdAt: now,
    updatedAt: now,
    source: "generated",
    licenseNotes: "由禪光 Studio 依報名網址在本機產生，僅供畫面使用。",
    licenseOwner: "本機產生",
  });
}

export function matchesAssetQuery(asset: AssetMeta, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const blob = [asset.name, asset.category, categoryLabel(asset.category), asset.licenseNotes, ...(asset.tags ?? [])]
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
    if (brand.memory?.mascotAssetId) ids.add(brand.memory.mascotAssetId);
  }
  for (const row of covers) {
    if (row.coverAssetId) ids.add(row.coverAssetId);
    for (const beat of row.reels ?? []) {
      if (beat.assetId) ids.add(beat.assetId);
    }
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
