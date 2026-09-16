import { getAccessToken } from "./oauth.server";
import type { ProviderId } from "./providers";
import type { RemoteItem, RemoteItemKind, SyncResult } from "./remote";
import { readConnection, writeConnection } from "./token-store.server";

export type { RemoteItem, RemoteItemKind } from "./remote";

/** 同步單一來源。token 只在伺服器端使用。 */
export async function runSync(id: ProviderId): Promise<SyncResult> {
  const token = await getAccessToken(id);
  if (!token) {
    return { ok: false, error: "還沒授權，或授權已經失效。", items: [] };
  }
  try {
    const items = await listProvider(id, token);
    const session = readConnection(id);
    if (session) {
      writeConnection({ ...session, lastSyncedAt: Date.now() });
    }
    return { ok: true, provider: id, items, accountLabel: session?.accountLabel ?? null };
  } catch {
    return { ok: false, error: "同步時連不上對方，稍後再試。", items: [] };
  }
}

export async function runSearch(
  query: string,
  id?: ProviderId,
): Promise<{ items: RemoteItem[]; note: string }> {
  const ids: ProviderId[] = id ? [id] : ["drive", "canva", "instagram"];
  const all: RemoteItem[] = [];
  for (const provider of ids) {
    const token = await getAccessToken(provider);
    if (!token) continue;
    try {
      all.push(...(await listProvider(provider, token)));
    } catch {
      // skip this source
    }
  }
  const q = query.trim().toLowerCase();
  const items = q
    ? all.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(q))
    : all;
  return {
    items: items.slice(0, 40),
    note: all.length ? "來自已連接的來源" : "還沒連接，或對方沒有可搜的內容。",
  };
}

function listProvider(id: ProviderId, token: string): Promise<RemoteItem[]> {
  if (id === "drive") return listDrive(token);
  if (id === "canva") return listCanva(token);
  return listInstagram(token);
}

async function listDrive(token: string): Promise<RemoteItem[]> {
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("pageSize", "40");
  url.searchParams.set("q", "trashed = false");
  url.searchParams.set(
    "fields",
    "files(id,name,mimeType,modifiedTime,webViewLink,thumbnailLink,description)",
  );
  url.searchParams.set("orderBy", "modifiedTime desc");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    files?: {
      id: string;
      name?: string;
      mimeType?: string;
      modifiedTime?: string;
      webViewLink?: string;
      thumbnailLink?: string;
      description?: string;
    }[];
  };
  const now = Date.now();
  return (json.files ?? []).map((file) => ({
    provider: "drive" as const,
    id: file.id,
    title: file.name || "未命名檔案",
    kind: driveKind(file.mimeType),
    detail: [file.mimeType, file.description].filter(Boolean).join(" · "),
    href: file.webViewLink,
    thumbnailUrl: file.thumbnailLink,
    capturedAt: file.modifiedTime ? Date.parse(file.modifiedTime) || now : now,
  }));
}

function driveKind(mime?: string): RemoteItemKind {
  if (!mime) return "other";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.includes("document") || mime.includes("pdf") || mime.includes("spreadsheet")) return "doc";
  return "other";
}

async function listCanva(token: string): Promise<RemoteItem[]> {
  const res = await fetch("https://api.canva.com/rest/v1/designs?limit=40", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    items?: { id: string; title?: string; urls?: { edit_url?: string; view_url?: string }; thumbnail?: { url?: string } }[];
  };
  const now = Date.now();
  return (json.items ?? []).map((item) => ({
    provider: "canva" as const,
    id: item.id,
    title: item.title || "未命名設計",
    kind: "design",
    detail: "Canva 設計",
    href: item.urls?.edit_url || item.urls?.view_url,
    thumbnailUrl: item.thumbnail?.url,
    capturedAt: now,
  }));
}

async function listInstagram(token: string): Promise<RemoteItem[]> {
  const igUser = await resolveIgUser(token);
  if (!igUser) return [];
  const url = new URL(`https://graph.facebook.com/v21.0/${igUser}/media`);
  url.searchParams.set(
    "fields",
    "id,caption,media_type,permalink,timestamp,like_count,comments_count,media_url,thumbnail_url",
  );
  url.searchParams.set("limit", "40");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    data?: {
      id: string;
      caption?: string;
      media_type?: string;
      permalink?: string;
      timestamp?: string;
      like_count?: number;
      comments_count?: number;
      media_url?: string;
      thumbnail_url?: string;
    }[];
  };
  const items: RemoteItem[] = (json.data ?? []).map((post) => ({
    provider: "instagram" as const,
    id: post.id,
    title: (post.caption ?? "無 Caption").split("\n")[0]!.slice(0, 48),
    kind: post.media_type === "VIDEO" ? "video" : post.media_type === "CAROUSEL_ALBUM" ? "post" : "image",
    detail: post.caption?.slice(0, 160) || post.media_type || "IG 貼文",
    href: post.permalink,
    thumbnailUrl: post.thumbnail_url || post.media_url,
    capturedAt: post.timestamp ? Date.parse(post.timestamp) || Date.now() : Date.now(),
    metrics: {
      likes: post.like_count,
      comments: post.comments_count,
    },
  }));
  await attachInsights(token, items);
  return items;
}

async function resolveIgUser(token: string): Promise<string | null> {
  const res = await fetch("https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: { instagram_business_account?: { id?: string } }[];
  };
  return json.data?.find((page) => page.instagram_business_account?.id)?.instagram_business_account?.id ?? null;
}

/**
 * 每一則最多多打一次 Insights。失敗就略過，貼文本身（Caption、讚、留言）仍可用。
 * 不重試、一次最多 12 則，避免把額度打完。
 */
async function attachInsights(token: string, items: RemoteItem[]): Promise<void> {
  await Promise.all(
    items.slice(0, 12).map(async (item) => {
      const metric = item.kind === "video" ? "plays,reach,saved,shares" : "impressions,reach,saved,shares";
      try {
        const url = new URL(`https://graph.facebook.com/v21.0/${item.id}/insights`);
        url.searchParams.set("metric", metric);
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const json = (await res.json()) as { data?: { name?: string; values?: { value?: number }[] }[] };
        const map: Record<string, number> = {};
        for (const row of json.data ?? []) {
          const value = row.values?.[0]?.value;
          if (row.name && typeof value === "number") map[row.name] = value;
        }
        item.metrics = {
          ...item.metrics,
          reach: map.reach ?? map.impressions,
          saved: map.saved,
          shares: map.shares,
          plays: map.plays,
        };
      } catch {
        // Insights 權限不足時就只留讚與留言
      }
    }),
  );
}
