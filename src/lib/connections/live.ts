import { ConnectorType, GoogleDriveTools } from "@/lib/app-data/types";
import { classifyCallToolError } from "@/lib/app-data/errors";
import type { MemoryItem } from "@/lib/club/memory";
import type { OAuthBlob } from "./vault.server";
import { canvaPresetFor, driveSearchQuery } from "./presets";

export type LiveHit = MemoryItem & {
  live?: boolean;
  metrics?: { reach?: number; likes?: number; comments?: number; saves?: number };
  mimeType?: string;
};

export { canvaPresetFor, driveSearchQuery };

const FETCH_MS = 4000;

function timedFetch(url: string, init?: RequestInit) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_MS) });
}

async function withTimeout<T>(work: Promise<T>, fallback: T, ms = FETCH_MS): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

export type DriveProbe = {
  connected: boolean;
  loginRequired: boolean;
  loginUrl?: string;
  detail: string;
};

export async function probeDrive(): Promise<DriveProbe> {
  const disconnected: DriveProbe = {
    connected: false,
    loginRequired: false,
    detail: "預覽環境可能還讀不到 Google Drive，社團記憶仍可搜。",
  };
  return withTimeout(
    (async () => {
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
        return disconnected;
      }
    })(),
    disconnected,
  );
}

export async function fetchCanvaDesigns(blob: OAuthBlob | null): Promise<LiveHit[]> {
  const token = blob?.canva?.access;
  if (!token) return [];
  try {
    const res = await timedFetch("https://api.canva.com/rest/v1/designs", {
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
    const accounts = await timedFetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`,
    );
    if (!accounts.ok) return [];
    const parsed = (await accounts.json()) as {
      data?: { instagram_business_account?: { id?: string; username?: string } }[];
    };
    const ig = parsed.data?.map((row) => row.instagram_business_account).find((row) => row?.id);
    if (!ig?.id) return [];
    const media = await timedFetch(
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
    const rows = json.data ?? [];
    const withMetrics = await attachIgInsights(token, rows);
    return withMetrics.map((item, index) => ({
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
      metrics: item.metrics,
      live: true,
    }));
  } catch {
    return [];
  }
}

type IgRow = {
  id?: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
  metrics?: { reach?: number; likes?: number; comments?: number; saves?: number };
};

async function attachIgInsights(token: string, rows: IgRow[]): Promise<IgRow[]> {
  const slice = rows.slice(0, 8);
  const enriched = await withTimeout(
    Promise.all(
      slice.map(async (row) => {
        if (!row.id) return { ...row, metrics: { likes: row.like_count, comments: row.comments_count } };
        try {
          const res = await timedFetch(
            `https://graph.facebook.com/v21.0/${row.id}/insights?metric=reach,saved,shares&access_token=${encodeURIComponent(token)}`,
          );
          if (!res.ok) {
            return { ...row, metrics: { likes: row.like_count, comments: row.comments_count } };
          }
          const json = (await res.json()) as { data?: { name?: string; values?: { value?: number }[] }[] };
          const read = (name: string) => json.data?.find((item) => item.name === name)?.values?.[0]?.value;
          return {
            ...row,
            metrics: {
              likes: row.like_count,
              comments: row.comments_count,
              reach: read("reach"),
              saves: read("saved"),
            },
          };
        } catch {
          return { ...row, metrics: { likes: row.like_count, comments: row.comments_count } };
        }
      }),
    ),
    slice.map((row) => ({ ...row, metrics: { likes: row.like_count, comments: row.comments_count } })),
  );
  const byId = new Map(enriched.map((row) => [row.id, row]));
  return rows.map((row) => byId.get(row.id) ?? { ...row, metrics: { likes: row.like_count, comments: row.comments_count } });
}

export async function createCanvaDesign(
  blob: OAuthBlob | null,
  input: { title: string; kind: string },
): Promise<{ ok: true; editUrl: string; id: string } | { ok: false; error: string; needsConnect?: boolean }> {
  const token = blob?.canva?.access;
  if (!token) return { ok: false, error: "還沒連接 Canva。", needsConnect: true };
  try {
    const res = await fetch("https://api.canva.com/rest/v1/designs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(12_000),
      body: JSON.stringify({
        design_type: { type: "preset", name: canvaPresetFor(input.kind) },
        title: input.title.slice(0, 80) || "淡江禪學社",
      }),
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "Canva 權限不足，請重新授權。", needsConnect: true };
    }
    if (!res.ok) return { ok: false, error: "Canva 暫時無法開新設計。" };
    const json = (await res.json()) as { design?: { id?: string; urls?: { edit_url?: string } } };
    const editUrl = json.design?.urls?.edit_url;
    const id = json.design?.id || "";
    if (!editUrl) return { ok: false, error: "Canva 沒有回傳編輯網址。" };
    return { ok: true, editUrl, id };
  } catch {
    return { ok: false, error: "Canva 暫時無法開新設計。" };
  }
}

export async function searchDriveFolders(name: string): Promise<{ id: string; title: string }[]> {
  const query = driveSearchQuery("folder", name || "淡江禪學社");
  try {
    const { callTool } = await import("@/lib/app-data/client.server");
    const result = await withTimeout(
      callTool(
        GoogleDriveTools.search,
        { query, q: query },
        { connectorType: ConnectorType.GoogleDrive },
      ),
      { ok: false as const, data: null, errorMessage: "timeout" },
    );
    if (!result.ok || !result.data) return [];
    const rows = Array.isArray(result.data)
      ? result.data
      : typeof result.data === "object" && result.data && "files" in result.data
        ? (result.data as { files: unknown[] }).files
        : [];
    return rows
      .map((row) => {
        const item = row as { id?: string; name?: string; mimeType?: string };
        return {
          id: item.id || "",
          title: item.name || "未命名資料夾",
          mimeType: item.mimeType || "",
        };
      })
      .filter((item) => item.id && (/folder/i.test(item.mimeType) || /資料夾|folder|禪學社|淡江/.test(item.title)))
      .slice(0, 8)
      .map(({ id, title }) => ({ id, title }));
  } catch {
    return [];
  }
}
