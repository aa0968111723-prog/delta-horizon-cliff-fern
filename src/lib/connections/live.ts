import { ConnectorType, GoogleDriveTools } from "@/lib/app-data/types";
import { classifyCallToolError } from "@/lib/app-data/errors";
import type { MemoryItem } from "@/lib/club/memory";
import type { OAuthBlob } from "./vault.server";

export type LiveHit = MemoryItem & { live?: boolean };

export type DriveProbe = {
  connected: boolean;
  loginRequired: boolean;
  loginUrl?: string;
  detail: string;
};

export async function probeDrive(): Promise<DriveProbe> {
  try {
    const { callTool } = await import("@/lib/app-data/client.server");
    const result = await callTool(
      GoogleDriveTools.search,
      { query: "淡江 禪學社" },
      { connectorType: ConnectorType.GoogleDrive },
    );
    if (result.loginRequired) {
      return {
        connected: false,
        loginRequired: true,
        loginUrl: result.loginUrl,
        detail: "需要透過官方 Google 連接。Token 只走伺服器。",
      };
    }
    if (result.ok) {
      return {
        connected: true,
        loginRequired: false,
        detail: "已連接 Google Drive。憑證不會進瀏覽器。",
      };
    }
    const classified = classifyCallToolError(result);
    return {
      connected: false,
      loginRequired: false,
      detail: classified?.message || result.errorMessage || "Drive 暫時無法確認。",
    };
  } catch {
    return {
      connected: false,
      loginRequired: false,
      detail: "預覽環境可能還讀不到 Google Drive，社團記憶仍可搜。",
    };
  }
}

export async function fetchCanvaDesigns(blob: OAuthBlob | null): Promise<LiveHit[]> {
  const token = blob?.canva?.access;
  if (!token) return [];
  try {
    const res = await fetch("https://api.canva.com/rest/v1/designs", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      items?: { id?: string; title?: string; thumbnail?: { url?: string }; urls?: { edit_url?: string }; updated_at?: number }[];
    };
    return (json.items ?? []).slice(0, 24).map((item, index) => ({
      id: item.id || `canva_${index}`,
      source: "canva" as const,
      title: item.title || "未命名設計",
      subtitle: "Canva",
      tags: ["canva", "設計"],
      kind: "poster" as const,
      date: item.updated_at ? new Date(item.updated_at * 1000).toISOString().slice(0, 10) : "",
      thumb: item.thumbnail?.url || "/seed/tea.svg",
      notes: item.urls?.edit_url || "Canva 設計",
      live: true,
    }));
  } catch {
    return [];
  }
}

export async function fetchInstagramMedia(blob: OAuthBlob | null): Promise<LiveHit[]> {
  const token = blob?.instagram?.access;
  if (!token) return [];
  try {
    const accounts = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`,
    );
    if (!accounts.ok) return [];
    const parsed = (await accounts.json()) as {
      data?: { instagram_business_account?: { id?: string; username?: string } }[];
    };
    const ig = parsed.data?.map((row) => row.instagram_business_account).find((row) => row?.id);
    if (!ig?.id) return [];
    const media = await fetch(
      `https://graph.facebook.com/v21.0/${ig.id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,saved&limit=18&access_token=${encodeURIComponent(token)}`,
    );
    if (!media.ok) return [];
    const json = (await media.json()) as {
      data?: {
        id?: string;
        caption?: string;
        media_type?: string;
        media_url?: string;
        thumbnail_url?: string;
        permalink?: string;
        timestamp?: string;
        like_count?: number;
        comments_count?: number;
      }[];
    };
    return (json.data ?? []).map((item, index) => ({
      id: item.id || `ig_${index}`,
      source: "instagram" as const,
      title: (item.caption || "無文案").split("\n")[0]?.slice(0, 40) || "IG 貼文",
      subtitle: `Instagram / ${(item.timestamp || "").slice(0, 10)}`,
      tags: ["instagram", item.media_type || "IMAGE"],
      kind:
        item.media_type === "VIDEO" || item.media_type === "REELS"
          ? ("reels" as const)
          : item.media_type === "CAROUSEL_ALBUM"
            ? ("carousel" as const)
            : ("ig-post" as const),
      date: (item.timestamp || "").slice(0, 10),
      thumb: item.thumbnail_url || item.media_url || "/seed/tamsui.svg",
      caption: item.caption,
      notes: item.permalink || `${ig.username ?? ""} · 讚 ${item.like_count ?? 0} · 留言 ${item.comments_count ?? 0}`,
      live: true,
    }));
  } catch {
    return [];
  }
}
