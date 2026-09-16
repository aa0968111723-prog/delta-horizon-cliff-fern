import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { IgMemoryPost, RemoteFile } from "@/lib/studio/types";
import { accessTokenFor, writeBundle } from "./tokens";
import { driveQueryEscape } from "./escape";

type SyncResult = {
  ok: boolean;
  connected: boolean;
  files: RemoteFile[];
  igPosts: IgMemoryPost[];
  accountLabel?: string;
  folderName?: string;
  note: string;
};

async function findDriveFolder(token: string, folderName: string) {
  const q = `mimeType='application/vnd.google-apps.folder' and trashed=false and name contains '${driveQueryEscape(folderName)}'`;
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=8&fields=files(id,name)&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const json = (await res.json()) as { files?: { id: string; name: string }[] };
  return json.files?.[0] ?? null;
}

async function listDrive(token: string, folderName?: string): Promise<{ files: RemoteFile[]; folderName?: string }> {
  let folderId: string | undefined;
  let resolvedName = folderName;
  if (folderName) {
    const folder = await findDriveFolder(token, folderName);
    if (folder) {
      folderId = folder.id;
      resolvedName = folder.name;
    }
  }
  const parts = ["trashed=false"];
  if (folderId) parts.push(`'${folderId}' in parents`);
  const q = parts.join(" and ");
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=40&fields=files(id,name,mimeType,thumbnailLink,modifiedTime,webViewLink)&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(String(res.status));
  const json = (await res.json()) as {
    files?: { id: string; name: string; mimeType?: string; thumbnailLink?: string; modifiedTime?: string; webViewLink?: string }[];
  };
  const files = (json.files ?? []).map((file) => ({
    id: `drive:${file.id}`,
    provider: "drive" as const,
    name: file.name,
    mime: file.mimeType || "application/octet-stream",
    thumbnail: file.thumbnailLink,
    url: file.webViewLink,
    modifiedAt: file.modifiedTime ? Date.parse(file.modifiedTime) : undefined,
    tags: ["Google Drive", resolvedName || "資料夾"].filter(Boolean),
    summary: resolvedName ? `Google Drive / ${resolvedName}` : "來自指定的禪學社 Drive 資料夾",
  }));
  return { files, folderName: resolvedName };
}

async function listCanva(token: string): Promise<RemoteFile[]> {
  const res = await fetch("https://api.canva.com/rest/v1/designs?limit=30", {
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
    tags: ["Canva", ...(item.title ? [item.title] : [])],
    summary: item.title ? `Canva / ${item.title}` : "官方 Canva 設計，可開原檔繼續編。",
  }));
}

type IgMedia = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  timestamp?: string;
  permalink?: string;
  like_count?: number;
  comments_count?: number;
};

async function igInsights(token: string, mediaId: string) {
  const metrics = "impressions,reach,saved,shares,plays";
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${mediaId}/insights?metric=${metrics}&access_token=${encodeURIComponent(token)}`,
  );
  if (!res.ok) return {};
  const json = (await res.json()) as { data?: { name?: string; values?: { value?: number }[] }[] };
  const out: Record<string, number> = {};
  for (const row of json.data ?? []) {
    if (row.name) out[row.name] = Number(row.values?.[0]?.value ?? 0);
  }
  return out;
}

function igKind(type?: string): IgMemoryPost["kind"] {
  if (type === "CAROUSEL_ALBUM") return "carousel";
  if (type === "VIDEO" || type === "REELS") return "reels";
  if (type === "STORY") return "story";
  return "post";
}

async function listInstagram(token: string): Promise<{ files: RemoteFile[]; igPosts: IgMemoryPost[]; accountLabel?: string }> {
  const me = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`,
  );
  if (!me.ok) throw new Error(String(me.status));
  const accounts = (await me.json()) as {
    data?: { instagram_business_account?: { id: string; username?: string } }[];
  };
  const ig = accounts.data?.find((row) => row.instagram_business_account)?.instagram_business_account;
  if (!ig?.id) return { files: [], igPosts: [] };
  const media = await fetch(
    `https://graph.facebook.com/v21.0/${ig.id}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink,like_count,comments_count&limit=24&access_token=${encodeURIComponent(token)}`,
  );
  if (!media.ok) throw new Error(String(media.status));
  const json = (await media.json()) as { data?: IgMedia[] };
  const posts: IgMemoryPost[] = [];
  const files: RemoteFile[] = [];
  for (const post of json.data ?? []) {
    const stats = await igInsights(token, post.id).catch(() => ({} as Record<string, number>));
    const date = post.timestamp ? post.timestamp.slice(0, 10) : "";
    const caption = post.caption || "IG 貼文";
    posts.push({
      id: `ig:${post.id}`,
      caption,
      date,
      kind: igKind(post.media_type),
      likes: post.like_count,
      comments: post.comments_count,
      saves: stats.saved,
      impressions: stats.impressions,
      reach: stats.reach,
      shares: stats.shares,
      plays: stats.plays,
      permalink: post.permalink,
      mediaUrl: post.thumbnail_url || post.media_url,
      source: "instagram",
    });
    files.push({
      id: `ig:${post.id}`,
      provider: "instagram",
      name: caption.slice(0, 48),
      mime: post.media_type === "VIDEO" ? "video/mp4" : "image/jpeg",
      thumbnail: post.thumbnail_url || post.media_url,
      url: post.permalink,
      modifiedAt: post.timestamp ? Date.parse(post.timestamp) : undefined,
      tags: ["Instagram", post.media_type ?? ""],
      summary: `Instagram / ${date || `@${ig.username ?? "tamkang.zen"}`}`,
    });
  }
  return { files, igPosts: posts, accountLabel: ig.username ? `@${ig.username}` : undefined };
}

export const syncConnection = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ provider: z.enum(["drive", "canva", "instagram"]), folderName: z.string().max(80).optional() }).parse(input),
  )
  .handler(async ({ data }): Promise<SyncResult> => {
    const bundle = await accessTokenFor(data.provider);
    if (!bundle) {
      return {
        ok: true,
        connected: false,
        files: [],
        igPosts: [],
        note: "尚未連接官方帳號。先用品牌記憶裡的歷屆索引，連接後再同步真實檔案。",
      };
    }
    try {
      if (data.provider === "drive") {
        const folderName = data.folderName || bundle.folderName;
        const listed = await listDrive(bundle.accessToken, folderName);
        if (listed.folderName && listed.folderName !== bundle.folderName) {
          await writeBundle({ ...bundle, folderName: listed.folderName });
        }
        return {
          ok: true,
          connected: true,
          files: listed.files,
          igPosts: [],
          accountLabel: bundle.accountLabel,
          folderName: listed.folderName,
          note: `已同步 ${listed.files.length} 筆 Drive${listed.folderName ? `／${listed.folderName}` : ""}`,
        };
      }
      if (data.provider === "canva") {
        const files = await listCanva(bundle.accessToken);
        return {
          ok: true,
          connected: true,
          files,
          igPosts: [],
          accountLabel: bundle.accountLabel,
          note: `已同步 ${files.length} 筆 Canva`,
        };
      }
      const listed = await listInstagram(bundle.accessToken);
      return {
        ok: true,
        connected: true,
        files: listed.files,
        igPosts: listed.igPosts,
        accountLabel: listed.accountLabel || bundle.accountLabel,
        note: `已同步 ${listed.files.length} 則 IG（含 Insights）`,
      };
    } catch {
      return { ok: false, connected: true, files: [], igPosts: [], note: "同步暫時失敗，請重新授權後再試。" };
    }
  });

export const searchDriveLive = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ query: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; files: RemoteFile[]; note: string }> => {
    const bundle = await accessTokenFor("drive");
    if (!bundle) return { ok: true, files: [], note: "尚未連接 Drive，改搜本機與品牌記憶。" };
    const token = bundle.accessToken;
    const q = driveQueryEscape(data.query);
    const query = `trashed=false and (name contains '${q}' or fullText contains '${q}')`;
    const url = `https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,thumbnailLink,modifiedTime,webViewLink)&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return { ok: false, files: [], note: "Drive 搜尋暫時失敗。" };
    const json = (await res.json()) as {
      files?: { id: string; name: string; mimeType?: string; thumbnailLink?: string; modifiedTime?: string; webViewLink?: string }[];
    };
    const files = (json.files ?? []).map((file) => ({
      id: `drive:${file.id}`,
      provider: "drive" as const,
      name: file.name,
      mime: file.mimeType || "application/octet-stream",
      thumbnail: file.thumbnailLink,
      url: file.webViewLink,
      modifiedAt: file.modifiedTime ? Date.parse(file.modifiedTime) : undefined,
      tags: ["Google Drive", data.query],
      summary: `Google Drive / 搜尋「${data.query}」`,
    }));
    return { ok: true, files, note: `找到 ${files.length} 個 Drive 檔` };
  });
