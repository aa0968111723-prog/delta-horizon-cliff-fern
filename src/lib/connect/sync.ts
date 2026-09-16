import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import type { RemoteFile } from "@/lib/studio/types";
import { cookieName, decryptBundle, type ProviderId } from "./oauth";

type SyncResult = {
  ok: boolean;
  connected: boolean;
  files: RemoteFile[];
  note: string;
};

async function tokenFor(provider: ProviderId): Promise<string | null> {
  const request = getRequest();
  const cookie = request?.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${cookieName(provider)}=([^;]+)`));
  if (!match) return null;
  const bundle = await decryptBundle(decodeURIComponent(match[1]));
  if (!bundle?.accessToken) return null;
  if (bundle.expiresAt && bundle.expiresAt < Date.now() - 30_000) return null;
  return bundle.accessToken;
}

async function listDrive(token: string): Promise<RemoteFile[]> {
  const url =
    "https://www.googleapis.com/drive/v3/files?pageSize=24&fields=files(id,name,mimeType,thumbnailLink,modifiedTime,webViewLink)&q=trashed=false";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(String(res.status));
  const json = (await res.json()) as {
    files?: { id: string; name: string; mimeType?: string; thumbnailLink?: string; modifiedTime?: string; webViewLink?: string }[];
  };
  return (json.files ?? []).map((file) => ({
    id: `drive:${file.id}`,
    provider: "drive" as const,
    name: file.name,
    mime: file.mimeType || "application/octet-stream",
    thumbnail: file.thumbnailLink,
    url: file.webViewLink,
    modifiedAt: file.modifiedTime ? Date.parse(file.modifiedTime) : undefined,
    tags: ["Google Drive"],
    summary: "來自指定的禪學社 Drive 資料夾",
  }));
}

async function listCanva(token: string): Promise<RemoteFile[]> {
  const res = await fetch("https://api.canva.com/rest/v1/designs?limit=24", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(String(res.status));
  const json = (await res.json()) as {
    items?: { id: string; title?: string; thumbnail?: { url?: string }; urls?: { edit_url?: string }; updated_at?: number }[];
  };
  return (json.items ?? []).map((item) => ({
    id: `canva:${item.id}`,
    provider: "canva" as const,
    name: item.title || "Canva 設計",
    mime: "application/canva",
    thumbnail: item.thumbnail?.url,
    url: item.urls?.edit_url,
    modifiedAt: item.updated_at,
    tags: ["Canva"],
    summary: "官方 Canva 設計，可開原檔繼續編。",
  }));
}

async function listInstagram(token: string): Promise<RemoteFile[]> {
  const me = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`,
  );
  if (!me.ok) throw new Error(String(me.status));
  const accounts = (await me.json()) as {
    data?: { instagram_business_account?: { id: string; username?: string } }[];
  };
  const ig = accounts.data?.find((row) => row.instagram_business_account)?.instagram_business_account;
  if (!ig?.id) return [];
  const media = await fetch(
    `https://graph.facebook.com/v21.0/${ig.id}/media?fields=id,caption,media_type,media_url,timestamp,permalink&limit=24&access_token=${encodeURIComponent(token)}`,
  );
  if (!media.ok) throw new Error(String(media.status));
  const json = (await media.json()) as {
    data?: { id: string; caption?: string; media_type?: string; media_url?: string; timestamp?: string; permalink?: string }[];
  };
  return (json.data ?? []).map((post) => ({
    id: `ig:${post.id}`,
    provider: "instagram" as const,
    name: (post.caption || "IG 貼文").slice(0, 48),
    mime: post.media_type === "VIDEO" ? "video/mp4" : "image/jpeg",
    thumbnail: post.media_url,
    url: post.permalink,
    modifiedAt: post.timestamp ? Date.parse(post.timestamp) : undefined,
    tags: ["Instagram", post.media_type ?? ""],
    summary: post.caption?.slice(0, 80) || `@${ig.username ?? "tamkang.zen"}`,
  }));
}

export const syncConnection = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ provider: z.enum(["drive", "canva", "instagram"]) }).parse(input))
  .handler(async ({ data }): Promise<SyncResult> => {
    const token = await tokenFor(data.provider);
    if (!token) {
      return {
        ok: true,
        connected: false,
        files: [],
        note: "尚未連接官方帳號。先用品牌記憶裡的歷屆索引，連接後再同步真實檔案。",
      };
    }
    try {
      const files =
        data.provider === "drive"
          ? await listDrive(token)
          : data.provider === "canva"
            ? await listCanva(token)
            : await listInstagram(token);
      return { ok: true, connected: true, files, note: `已同步 ${files.length} 筆` };
    } catch {
      return { ok: false, connected: true, files: [], note: "同步暫時失敗，請重新授權後再試。" };
    }
  });
