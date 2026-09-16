import { sourceLabel } from "../studio/assets.ts";
import type { AssetMeta } from "../studio/types.ts";
import type { ExternalMemoryItem, ExternalMemoryProvider } from "../connections/types.ts";
import { providerLabel } from "../connections/types.ts";
import { searchCreativeMemory, type CreativeMemoryResult } from "./memory.ts";
import type { Campaign, ContentItem } from "./types";

export type GlobalSearchFilter =
  | "all"
  | "asset"
  | "generated"
  | "campaign"
  | "content"
  | ExternalMemoryProvider;

export const GLOBAL_SEARCH_FILTERS: { id: GlobalSearchFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "asset", label: "素材" },
  { id: "generated", label: "AI 生成" },
  { id: "campaign", label: "Campaign" },
  { id: "content", label: "節奏" },
  { id: "google-drive", label: "Drive" },
  { id: "canva", label: "Canva" },
  { id: "instagram", label: "Instagram" },
];

export function searchGlobalCreative(
  query: string,
  input: {
    assets: AssetMeta[];
    campaigns: Campaign[];
    contentItems: ContentItem[];
    externalItems?: ExternalMemoryItem[];
  },
  filter: GlobalSearchFilter = "all",
): CreativeMemoryResult[] {
  const results = searchCreativeMemory(query, input);
  if (filter === "all") return results;
  if (filter === "generated") {
    return results.filter((result) => result.kind === "asset" && result.provider === sourceLabel("generated"));
  }
  if (filter === "asset") return results.filter((result) => result.kind === "asset");
  if (filter === "campaign") return results.filter((result) => result.kind === "campaign");
  if (filter === "content") return results.filter((result) => result.kind === "content");
  const label = providerLabel(filter);
  return results.filter((result) => result.kind === "external" && result.provider === label);
}

export function emptySearchHint(filter: GlobalSearchFilter) {
  if (filter === "canva") return "目前沒有已同步的 Canva 設計。未連接時不會假裝已搜尋 Canva。";
  if (filter === "instagram") return "目前沒有已同步的 IG 貼文。未授權時不會顯示模擬貼文。";
  if (filter === "google-drive") return "目前沒有已同步的 Drive 項目。";
  if (filter === "generated") return "目前沒有 AI 生成素材。";
  return "Creative Brain 目前找不到這個內容。";
}
