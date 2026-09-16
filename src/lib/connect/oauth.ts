import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { parseFnInput } from "@/lib/ai/parse";
import type { IgMemoryPost, MemoryItem } from "@/lib/creative/types";
import { envReady, oauthPath } from "./providers";

const Provider = z.enum(["google-drive", "canva", "instagram"]);

export const getConnectionCapabilities = createServerFn({ method: "POST" }).handler(async () => {
  const { canStoreTokens, hasProviderTokens } = await import("./tokens.server");
  return {
    "google-drive": {
      oauthReady: envReady("google-drive") && canStoreTokens(),
      connected: hasProviderTokens("google-drive"),
      label: "Google Drive",
    },
    canva: {
      oauthReady: envReady("canva") && canStoreTokens(),
      connected: hasProviderTokens("canva"),
      label: "Canva",
    },
    instagram: {
      oauthReady: envReady("instagram") && canStoreTokens(),
      connected: hasProviderTokens("instagram"),
      label: "Instagram",
    },
  };
});

export const startConnection = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseFnInput(z.object({ provider: Provider }), input))
  .handler(async ({ data }) => {
    const { canStoreTokens } = await import("./tokens.server");
    if (!envReady(data.provider) || !canStoreTokens()) {
      return {
        ok: false as const,
        reason: "not_configured" as const,
        message: "官方連接尚未開啟。先用社團 Creative Memory 創作，不需要貼 Token。",
      };
    }
    return { ok: true as const, url: oauthPath(data.provider) };
  });

export const syncConnectionMemory = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseFnInput(z.object({ provider: Provider, query: z.string().max(80).optional() }), input))
  .handler(async ({ data }): Promise<{ ok: true; items: MemoryItem[]; posts?: IgMemoryPost[]; account?: string } | { ok: false; message: string }> => {
    return syncProvider(data.provider, data.query);
  });

export const gatherCreativeMemory = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseFnInput(z.object({ query: z.string().min(1).max(80) }), input))
  .handler(async ({ data }) => {
    const items: MemoryItem[] = [];
    const posts: IgMemoryPost[] = [];
    const sources: string[] = [];
    for (const provider of ["google-drive", "canva", "instagram"] as const) {
      const result = await syncProvider(provider, data.query);
      if (!result.ok) continue;
      items.push(...result.items);
      if (result.posts) posts.push(...result.posts);
      sources.push(provider);
    }
    return { ok: true as const, items, posts, sources };
  });

async function syncProvider(
  provider: "google-drive" | "canva" | "instagram",
  query?: string,
): Promise<{ ok: true; items: MemoryItem[]; posts?: IgMemoryPost[]; account?: string } | { ok: false; message: string }> {
  const { readFreshTokens } = await import("./tokens.server");
  const tokens = await readFreshTokens(provider);
  if (!tokens) {
    return { ok: false, message: "尚未授權。先用社團記憶搜尋。" };
  }
  try {
    if (provider === "google-drive") {
      const items = await listDrive(tokens.access, query, tokens.folderId);
      return { ok: true, items, account: tokens.folderName || tokens.account };
    }
    if (provider === "canva") {
      const items = await listCanva(tokens.access, query);
      return { ok: true, items, account: tokens.account };
    }
    const ig = await listInstagram(tokens.access);
    return { ok: true, items: ig.items, posts: ig.posts, account: ig.account || tokens.account };
  } catch {
    return { ok: false, message: "同步暫時失敗，先用社團記憶繼續創作。" };
  }
}

export const listDriveFolders = createServerFn({ method: "POST" }).handler(async () => {
  const { readFreshTokens } = await import("./tokens.server");
  const tokens = await readFreshTokens("google-drive");
  if (!tokens) return { ok: false as const, message: "尚未連接 Google Drive" };
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("pageSize", "20");
  url.searchParams.set("q", "mimeType = 'application/vnd.google-apps.folder' and trashed = false");
  url.searchParams.set("fields", "files(id,name)");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${tokens.access}` } });
  if (!res.ok) return { ok: false as const, message: "讀不到資料夾" };
  const body = (await res.json()) as { files?: { id: string; name: string }[] };
  return {
    ok: true as const,
    folders: body.files ?? [],
    current: tokens.folderId ?? null,
  };
});

export const setDriveFolder = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseFnInput(z.object({ folderId: z.string().min(1).max(80), name: z.string().max(120) }), input))
  .handler(async ({ data }) => {
    const { readFreshTokens, persistTokenBlob } = await import("./tokens.server");
    const tokens = await readFreshTokens("google-drive");
    if (!tokens) return { ok: false as const, message: "尚未連接 Google Drive" };
    await persistTokenBlob("google-drive", { ...tokens, folderId: data.folderId, folderName: data.name });
    return { ok: true as const, name: data.name };
  });

export const createCanvaDesign = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    parseFnInput(z.object({ title: z.string().min(1).max(80), kind: z.enum(["post", "story", "carousel"]).optional() }), input),
  )
  .handler(async ({ data }) => {
    const { readFreshTokens } = await import("./tokens.server");
    const tokens = await readFreshTokens("canva");
    if (!tokens) {
      return {
        ok: false as const,
        reason: "connect" as const,
        message: "先連接 Canva，再把這次文案送去微調。",
      };
    }
    const preset = data.kind === "story" ? "instagramStory" : data.kind === "carousel" ? "instagramCarousel" : "instagramPost";
    try {
      const res = await fetch("https://api.canva.com/rest/v1/designs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          design_type: { type: "preset", name: preset },
        }),
      });
      if (!res.ok) {
        return { ok: false as const, reason: "api" as const, message: "Canva 暫時無法建設計。" };
      }
      const body = (await res.json()) as { design?: { urls?: { edit_url?: string } } };
      const url = body.design?.urls?.edit_url;
      if (!url) return { ok: false as const, reason: "api" as const, message: "沒有編輯連結。" };
      return { ok: true as const, url };
    } catch {
      return { ok: false as const, reason: "api" as const, message: "Canva 暫時無法建設計。" };
    }
  });

function driveKind(mime: string): MemoryItem["kind"] {
  if (mime.startsWith("image/")) return "photo";
  if (mime.startsWith("video/")) return "video";
  if (mime.includes("presentation") || mime.includes("pdf")) return "poster";
  return "doc";
}

async function listDrive(access: string, query?: string, folderId?: string): Promise<MemoryItem[]> {
  const parts = ["trashed = false"];
  if (folderId) parts.push(`'${folderId}' in parents`);
  if (query?.trim()) parts.push(`fullText contains '${query.replace(/'/g, "\\'")}'`);
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("pageSize", "18");
  url.searchParams.set("q", parts.join(" and "));
  url.searchParams.set("fields", "files(id,name,mimeType,modifiedTime,thumbnailLink)");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${access}` } });
  if (!res.ok) return [];
  const body = (await res.json()) as {
    files?: { id: string; name: string; mimeType: string; modifiedTime?: string; thumbnailLink?: string }[];
  };
  return (body.files ?? []).map((file) => ({
    id: `drive_${file.id}`,
    source: "drive" as const,
    sourceLabel: `Google Drive / ${file.name}`,
    title: file.name,
    kind: driveKind(file.mimeType),
    tags: [file.mimeType.split("/").pop() ?? "file"],
    summary: folderId ? "來自指定的禪學社資料夾。" : "來自 Google Drive。",
    thumbUrl: file.thumbnailLink,
    createdAt: file.modifiedTime ? Date.parse(file.modifiedTime) : Date.now(),
  }));
}

async function listCanva(access: string, query?: string): Promise<MemoryItem[]> {
  const url = new URL("https://api.canva.com/rest/v1/designs");
  url.searchParams.set("limit", "18");
  if (query?.trim()) url.searchParams.set("query", query.trim());
  const res = await fetch(url, { headers: { Authorization: `Bearer ${access}` } });
  if (!res.ok) return [];
  const body = (await res.json()) as {
    items?: { id: string; title?: string; updated_at?: number; thumbnail?: { url?: string }; urls?: { edit_url?: string } }[];
  };
  return (body.items ?? []).map((item) => ({
    id: `canva_${item.id}`,
    source: "canva" as const,
    sourceLabel: `Canva / ${item.title || "設計"}`,
    title: item.title || "Canva 設計",
    kind: "design" as const,
    tags: ["canva"],
    summary: "作為風格參考，不要直接複製。",
    thumbUrl: item.thumbnail?.url,
    createdAt: item.updated_at ?? Date.now(),
  }));
}

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function mapIgMedia(
  rows: Array<{
    id: string;
    caption?: string;
    media_type?: string;
    timestamp?: string;
    permalink?: string;
    like_count?: number;
    comments_count?: number;
    thumbnail_url?: string;
    media_url?: string;
  }>,
): { items: MemoryItem[]; posts: IgMemoryPost[] } {
  const posts: IgMemoryPost[] = rows.map((post) => {
    const caption = post.caption ?? "IG 貼文";
    const mediaType = post.media_type === "VIDEO" ? "reels" : post.media_type === "CAROUSEL_ALBUM" ? "carousel" : "image";
    return {
      id: `ig_${post.id}`,
      source: "instagram" as const,
      mediaType,
      caption,
      takenAt: post.timestamp ? Date.parse(post.timestamp) : Date.now(),
      permalink: post.permalink,
      assetIds: [],
      likes: post.like_count,
      comments: post.comments_count,
      mediaUrl: post.thumbnail_url || post.media_url,
    };
  });
  const items: MemoryItem[] = posts.map((post) => ({
    id: post.id,
    source: "instagram" as const,
    sourceLabel: `Instagram / ${new Date(post.takenAt).toISOString().slice(0, 10)}`,
    title: post.caption.split("\n")[0] ?? "IG 貼文",
    kind: "post" as const,
    tags: [post.mediaType],
    summary: post.caption.slice(0, 80),
    thumbUrl: post.mediaUrl,
    createdAt: post.takenAt,
  }));
  return { items, posts };
}

async function fetchIgMedia(base: string, token: string) {
  const url = new URL(base);
  url.searchParams.set("fields", "id,caption,media_type,timestamp,permalink,like_count,comments_count,thumbnail_url,media_url");
  url.searchParams.set("limit", "18");
  url.searchParams.set("access_token", token);
  const body = await fetchJson(url.toString());
  const data = (body?.data as Parameters<typeof mapIgMedia>[0] | undefined) ?? [];
  return mapIgMedia(data);
}

async function enrichIgInsights(posts: IgMemoryPost[], token: string, host: string) {
  await Promise.all(
    posts.slice(0, 8).map(async (post) => {
      const mediaId = post.id.replace(/^ig_/, "");
      const metric = post.mediaType === "reels" ? "plays,reach,saved,shares,total_interactions" : "impressions,reach,saved,shares,total_interactions";
      const url = new URL(`${host.replace(/\/$/, "")}/${mediaId}/insights`);
      url.searchParams.set("metric", metric);
      url.searchParams.set("access_token", token);
      const body = await fetchJson(url.toString());
      const rows = (body?.data as Array<{ name?: string; values?: Array<{ value?: number }> }> | undefined) ?? [];
      for (const row of rows) {
        const value = row.values?.[0]?.value;
        if (typeof value !== "number" || !row.name) continue;
        if (row.name === "saved") post.saves = value;
        if (row.name === "shares") post.shares = value;
        if (row.name === "reach" || row.name === "impressions" || row.name === "plays" || row.name === "total_interactions") {
          post.reach = Math.max(post.reach ?? 0, value);
        }
      }
    }),
  );
}

async function listInstagram(access: string): Promise<{ items: MemoryItem[]; posts: IgMemoryPost[]; account?: string }> {
  const direct = await fetchIgMedia("https://graph.instagram.com/me/media", access);
  if (direct.posts.length) {
    await enrichIgInsights(direct.posts, access, "https://graph.instagram.com");
    const profile = await fetchJson(`https://graph.instagram.com/me?fields=username,biography&access_token=${encodeURIComponent(access)}`);
    const username = typeof profile?.username === "string" ? profile.username : "";
    return { ...direct, account: username ? `@${username}` : "Instagram" };
  }

  const pages = await fetchJson(
    `https://graph.facebook.com/v21.0/me/accounts?fields=name,access_token,instagram_business_account{id,username,biography}&access_token=${encodeURIComponent(access)}`,
  );
  const page = (
    pages?.data as Array<{
      access_token?: string;
      instagram_business_account?: { id: string; username?: string };
    }>
  )?.find((item) => item.instagram_business_account?.id);
  if (!page?.instagram_business_account?.id) {
    return { items: [], posts: [] };
  }
  const pageToken = page.access_token || access;
  const viaPage = await fetchIgMedia(`https://graph.facebook.com/v21.0/${page.instagram_business_account.id}/media`, pageToken);
  await enrichIgInsights(viaPage.posts, pageToken, "https://graph.facebook.com/v21.0");
  const username = page.instagram_business_account.username;
  return { ...viaPage, account: username ? `@${username}` : "Instagram" };
}
