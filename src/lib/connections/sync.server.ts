import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAccessToken } from "./oauth.server";
import type { ProviderId } from "./providers";
import type { RemoteItem, RemoteItemKind } from "./remote";
import { readConnection, writeConnection } from "./token-store.server";

export type { RemoteItem, RemoteItemKind } from "./remote";

export type SyncResult =
  | { ok: true; provider: ProviderId; items: RemoteItem[]; accountLabel: string | null }
  | { ok: false; error: string; items: RemoteItem[] };

function unwrapId(input: unknown): ProviderId {
  const schema = z.object({ id: z.enum(["drive", "canva", "instagram"]) });
  if (input && typeof input === "object" && "data" in input) {
    return schema.parse((input as { data: unknown }).data).id;
  }
  return schema.parse(input).id;
}

export const syncProvider = createServerFn({ method: "POST" })
  .validator((input: unknown) => unwrapId(input))
  .handler(async ({ data: id }): Promise<SyncResult> => {
    const token = await getAccessToken(id);
    if (!token) {
      return { ok: false, error: "還沒授權，或授權已經失效。", items: [] };
    }
    try {
      const items =
        id === "drive" ? await listDrive(token) : id === "canva" ? await listCanva(token) : await listInstagram(token);
      const session = readConnection(id);
      if (session) {
        writeConnection({ ...session, lastSyncedAt: Date.now() });
      }
      return { ok: true, provider: id, items, accountLabel: session?.accountLabel ?? null };
    } catch {
      return { ok: false, error: "同步時連不上對方，稍後再試。", items: [] };
    }
  });

export const searchRemote = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const schema = z.object({
      query: z.string().max(80).catch(""),
      id: z.enum(["drive", "canva", "instagram"]).optional(),
    });
    if (input && typeof input === "object" && "data" in input) {
      return schema.parse((input as { data: unknown }).data);
    }
    return schema.parse(input);
  })
  .handler(async ({ data }): Promise<{ items: RemoteItem[]; note: string }> => {
    const ids: ProviderId[] = data.id ? [data.id] : ["drive", "canva", "instagram"];
    const all: RemoteItem[] = [];
    for (const id of ids) {
      const token = await getAccessToken(id);
      if (!token) continue;
      try {
        const items =
          id === "drive" ? await listDrive(token) : id === "canva" ? await listCanva(token) : await listInstagram(token);
        all.push(...items);
      } catch {
        // skip this source
      }
    }
    const q = data.query.trim().toLowerCase();
    const items = q
      ? all.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(q))
      : all;
    return {
      items: items.slice(0, 40),
      note: all.length ? "來自已連接的來源" : "還沒連接，或對方沒有可搜的內容。",
    };
  });

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
  return (json.data ?? []).map((post) => ({
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
