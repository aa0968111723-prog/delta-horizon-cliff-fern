import { sourceLabel } from "../studio/assets.ts";
import type { ExternalMemoryItem, ExternalMemoryProvider } from "../connections/types.ts";
import { providerLabel } from "../connections/types.ts";
import { searchCreativeMemory, type CreativeMemoryResult } from "./memory.ts";

export type GlobalSearchFilter =
  | "all"
  | "asset"
  | "generated"
  | "campaign"
  | "content"
  | "memory"
  | "copy"
  | "style"
  | ExternalMemoryProvider;

export const GLOBAL_SEARCH_FILTERS: { id: GlobalSearchFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "asset", label: "素材" },
  { id: "generated", label: "AI 生成" },
  { id: "campaign", label: "活動" },
  { id: "content", label: "節奏" },
  { id: "copy", label: "文案" },
  { id: "memory", label: "記憶" },
  { id: "style", label: "風格" },
  { id: "google-drive", label: "Drive" },
  { id: "canva", label: "Canva" },
  { id: "instagram", label: "Instagram" },
];

export function searchGlobalCreative(
  query: string,
  input: Parameters<typeof searchCreativeMemory>[1],
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
  if (filter === "memory") return results.filter((result) => result.kind === "memory");
  if (filter === "copy") return results.filter((result) => result.kind === "copy");
  if (filter === "style") return results.filter((result) => result.kind === "style");
  const label = providerLabel(filter);
  return results.filter((result) => result.kind === "external" && result.provider === label);
}

export function emptySearchHint(filter: GlobalSearchFilter) {
  if (filter === "canva") return "目前沒有已同步的 Canva 設計。未連接時不會假裝已搜尋 Canva。";
  if (filter === "instagram") return "目前沒有已同步的 IG 貼文。未授權時不會顯示模擬貼文。";
  if (filter === "google-drive") return "目前沒有已同步的 Drive 項目。Continue with Grok 只會在官方回 loginRequired 且帶 loginUrl 時出現。";
  if (filter === "generated") return "目前沒有 AI 生成素材。";
  if (filter === "memory") return "Brand Memory 裡還沒有符合的使命、支柱或已學到規律。";
  if (filter === "copy") return "還沒有可重用的文案包。到 AI 創作生成文案後會出現在這裡。";
  if (filter === "style") return "還沒有 Canva 風格參考。未連接時不會放模擬稿。";
  return "跨來源記憶目前找不到這個內容。";
}
