import type { ProviderId } from "./providers";

/** 遠端素材的摘要。不含 token，可以存在此裝置給搜尋與 IG DNA 用。 */
export type RemoteItemKind = "image" | "video" | "doc" | "design" | "post" | "other";

export type RemoteItem = {
  provider: ProviderId;
  id: string;
  title: string;
  kind: RemoteItemKind;
  detail: string;
  href?: string;
  thumbnailUrl?: string;
  capturedAt: number;
  metrics?: { likes?: number; comments?: number; reach?: number };
};

export function matchRemoteQuery(item: RemoteItem, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return q.split(/\s+/).every((part) => `${item.title} ${item.detail}`.toLowerCase().includes(part));
}
