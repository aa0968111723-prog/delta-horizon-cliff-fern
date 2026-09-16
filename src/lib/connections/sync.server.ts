import { getAccessToken } from "./oauth.server";
import {
  canvaDesignUrl,
  canvaExportBody,
  canvaExportJobUrl,
  canvaExportUrl,
  driveDownloadUrl,
  driveMetaUrl,
  enlargeDriveThumbnail,
  instagramMediaUrl,
  MEDIA_MAX_BYTES,
  type ImportMediaResult,
} from "./media";
import type { ProviderId } from "./providers";
import type { RemoteItem, RemoteItemKind, SyncResult } from "./remote";
import { readConnection, writeConnection } from "./token-store.server";

export type { RemoteItem, RemoteItemKind } from "./remote";
export type { ImportMediaResult } from "./media";

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

/** 把遠端圖片拉成 data URL，讓本機素材庫／創作頁能用。token 不出伺服器。 */
export async function fetchRemoteMedia(provider: ProviderId, remoteId: string): Promise<ImportMediaResult> {
  const token = await getAccessToken(provider);
  if (!token) {
    return { ok: false, error: "還沒授權，或授權已經失效。" };
  }
  try {
    if (provider === "drive") return await importDrive(token, remoteId);
    if (provider === "canva") return await importCanva(token, remoteId);
    return await importInstagram(token, remoteId);
  } catch {
    return { ok: false, error: "讀不到這張圖，稍後再試。" };
  }
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function importDrive(token: string, fileId: string): Promise<ImportMediaResult> {
  const metaRes = await fetch(driveMetaUrl(fileId), { headers: authHeaders(token) });
  if (!metaRes.ok) return { ok: false, error: "讀不到 Drive 檔案。" };
  const meta = (await metaRes.json()) as {
    name?: string;
    mimeType?: string;
    thumbnailLink?: string;
    webViewLink?: string;
  };
  const name = meta.name || "Drive 檔案";
  const mime = meta.mimeType ?? "";
  if (mime.startsWith("image/")) {
    const fileRes = await fetch(driveDownloadUrl(fileId), { headers: authHeaders(token) });
    const converted = await responseToDataUrl(fileRes);
    if (converted.ok) {
      return {
        ok: true,
        dataUrl: converted.dataUrl,
        name,
        mime: converted.mime,
        provider: "drive",
        title: name,
        href: meta.webViewLink,
      };
    }
  }
  if (meta.thumbnailLink) {
    const thumb = await fetchThumbnail(enlargeDriveThumbnail(meta.thumbnailLink), token);
    if (thumb) {
      return {
        ok: true,
        dataUrl: thumb.dataUrl,
        name,
        mime: thumb.mime,
        provider: "drive",
        title: name,
        href: meta.webViewLink,
      };
    }
  }
  if (mime.startsWith("video/")) {
    return { ok: false, error: "影片還不能直接帶進創作，先在 Drive 截一張封面。" };
  }
  return { ok: false, error: "這份 Drive 檔案不是圖片，沒辦法直接帶進創作。" };
}

async function importCanva(token: string, designId: string): Promise<ImportMediaResult> {
  const metaRes = await fetch(canvaDesignUrl(designId), { headers: authHeaders(token) });
  const meta = metaRes.ok
    ? ((await metaRes.json()) as {
        design?: { title?: string; urls?: { edit_url?: string; view_url?: string }; thumbnail?: { url?: string } };
      })
    : null;
  const name = meta?.design?.title || "Canva 設計";
  const href = meta?.design?.urls?.edit_url || meta?.design?.urls?.view_url;

  const exported = await exportCanvaPng(token, designId);
  if (exported) {
    return {
      ok: true,
      dataUrl: exported.dataUrl,
      name,
      mime: exported.mime,
      provider: "canva",
      title: name,
      href,
    };
  }

  const thumbUrl = meta?.design?.thumbnail?.url;
  if (thumbUrl) {
    const thumb = await fetchThumbnail(thumbUrl, token);
    if (thumb) {
      return {
        ok: true,
        dataUrl: thumb.dataUrl,
        name,
        mime: thumb.mime,
        provider: "canva",
        title: name,
        href,
      };
    }
  }
  return { ok: false, error: "讀不到這個 Canva 設計的圖。可能還沒授權匯出，或設計是空的。" };
}

async function exportCanvaPng(
  token: string,
  designId: string,
): Promise<{ dataUrl: string; mime: string } | null> {
  const start = await fetch(canvaExportUrl(), {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(canvaExportBody(designId)),
  });
  if (!start.ok) return null;
  const started = (await start.json()) as { job?: { id?: string; status?: string; urls?: string[] } };
  const jobId = started.job?.id;
  if (!jobId) return null;
  for (let i = 0; i < 6; i++) {
    if (i > 0) await sleep(700);
    const poll = await fetch(canvaExportJobUrl(jobId), { headers: authHeaders(token) });
    if (!poll.ok) return null;
    const body = (await poll.json()) as { job?: { status?: string; urls?: string[] } };
    const status = body.job?.status;
    const fileUrl = body.job?.urls?.[0];
    if (status === "success" && fileUrl) {
      const file = await fetch(fileUrl);
      const converted = await responseToDataUrl(file);
      return converted.ok ? converted : null;
    }
    if (status === "failed") return null;
  }
  return null;
}

async function importInstagram(token: string, mediaId: string): Promise<ImportMediaResult> {
  const res = await fetch(instagramMediaUrl(mediaId), { headers: authHeaders(token) });
  if (!res.ok) return { ok: false, error: "讀不到這則 Instagram 貼文。" };
  const post = (await res.json()) as {
    caption?: string;
    media_type?: string;
    media_url?: string;
    thumbnail_url?: string;
    permalink?: string;
  };
  const title = (post.caption ?? "IG 貼文").split("\n")[0]!.slice(0, 48);
  const imageUrl =
    post.media_type === "VIDEO" ? post.thumbnail_url || post.media_url : post.media_url || post.thumbnail_url;
  if (!imageUrl) {
    return { ok: false, error: "這則貼文沒有可以帶進來的圖片。" };
  }
  const file = await fetch(imageUrl);
  const converted = await responseToDataUrl(file);
  if (!converted.ok) {
    const withAuth = await fetchThumbnail(imageUrl, token);
    if (!withAuth) return { ok: false, error: "讀不到這則貼文的圖片。" };
    return {
      ok: true,
      dataUrl: withAuth.dataUrl,
      name: title,
      mime: withAuth.mime,
      provider: "instagram",
      title,
      href: post.permalink,
    };
  }
  return {
    ok: true,
    dataUrl: converted.dataUrl,
    name: title,
    mime: converted.mime,
    provider: "instagram",
    title,
    href: post.permalink,
  };
}

async function fetchThumbnail(
  url: string,
  token: string,
): Promise<{ dataUrl: string; mime: string } | null> {
  const direct = await fetch(url, { headers: authHeaders(token) });
  const first = await responseToDataUrl(direct);
  if (first.ok) return first;
  try {
    const fallback = new URL(url);
    fallback.searchParams.set("access_token", token);
    const second = await fetch(fallback);
    const converted = await responseToDataUrl(second);
    return converted.ok ? converted : null;
  } catch {
    return null;
  }
}

async function responseToDataUrl(
  res: Response,
): Promise<{ ok: true; dataUrl: string; mime: string } | { ok: false }> {
  if (!res.ok) return { ok: false };
  const headerMime = (res.headers.get("content-type") ?? "application/octet-stream").split(";")[0]!.trim().toLowerCase();
  if (headerMime.includes("json") || headerMime.includes("text/html") || headerMime.includes("text/plain")) {
    return { ok: false };
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  if (!buf.byteLength) return { ok: false };
  if (buf.byteLength > MEDIA_MAX_BYTES) return { ok: false };
  const sniffed = sniffImageMime(buf);
  const mime = headerMime.startsWith("image/") ? headerMime : sniffed;
  if (!mime) return { ok: false };
  const dataUrl = `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
  if (dataUrl.length > 3_200_000) return { ok: false };
  return { ok: true, dataUrl, mime };
}

function sniffImageMime(buf: Uint8Array): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49) return "image/gif";
  if (buf.length >= 12 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) {
    return "image/webp";
  }
  return null;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
