import type { ConnectorUiState, ExternalMemoryItem } from "../connections/types.ts";
import { migrateAsset } from "./assets.ts";
import type { AssetMeta } from "./types.ts";

export function hasPlaceablePixels(asset: Pick<AssetMeta, "width" | "height" | "seedSrc">) {
  return (asset.width > 0 && asset.height > 0) || Boolean(asset.seedSrc);
}

export function driveImportBlockedReason(status: ConnectorUiState) {
  if (status === "connected") return null;
  if (status === "login") {
    return "需要授權後才能把 Drive 檔案寫進素材庫。沒有登入連結時不會顯示 Continue with Grok。";
  }
  if (status === "unavailable") {
    return "這個環境尚未提供 Google Drive，無法匯入素材庫，也不會放模擬檔案。";
  }
  if (status === "not_connected" || status === "scope_denied" || status === "access_denied") {
    return "尚未連接 Google Drive，無法把檔案寫進素材庫。";
  }
  if (status === "checking" || status === "idle") {
    return "還在確認 Drive 連線，暫時不能匯入。";
  }
  return "Google Drive 目前無法使用，既有素材庫不會被模擬檔案填滿。";
}

export function driveItemToLibraryAsset(item: ExternalMemoryItem, now = Date.now()): AssetMeta {
  const image = /^image\//.test(item.mimeType);
  return migrateAsset({
    id: `drive-ref:${item.id}`,
    name: item.title,
    kind: image ? "image" : "image",
    category: image ? "photo" : "illustration",
    mime: item.mimeType || "application/octet-stream",
    width: 0,
    height: 0,
    tags: ["Google Drive", "來源參考", item.collection].filter((tag): tag is string => Boolean(tag)),
    createdAt: now,
    updatedAt: now,
    source: "google-drive",
    licenseNotes: "這是 Google Drive 來源參考，不是已下載的原圖。官方 Drive 工具沒有提供下載像素，畫布不會假裝有這張圖。",
    licenseOwner: "Google Drive",
    provenance: {
      provider: "google-drive",
      label: "Google Drive 來源參考",
      externalId: item.id,
      externalUrl: item.webUrl || undefined,
      collection: item.collection || item.parentId,
      sourceDate: item.sourceDate || item.modifiedAt,
      importedAt: now,
    },
    analysis: item.snippet
      ? {
          summary: item.snippet.slice(0, 240),
          subjects: [],
          colors: [],
          lighting: "未取得像素",
          composition: "未取得像素，無法分析構圖",
          textHierarchy: "未取得像素",
          brandFit: "未驗證",
          studentFit: item.snippet.slice(0, 120),
          stopPower: "無法從原圖判斷",
          risks: ["沒有原圖像素，不能放到畫布"],
          recommendations: ["在 Drive 開啟後本機下載，再上傳到素材庫"],
          suggestedTags: ["Google Drive"],
          analyzedAt: now,
        }
      : undefined,
  });
}
