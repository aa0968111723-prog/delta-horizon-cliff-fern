import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { parseFnInput } from "@/lib/ai/parse";
import type { MemoryItem } from "@/lib/creative/types";
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
  .handler(async ({ data }): Promise<{ ok: true; items: MemoryItem[]; account?: string } | { ok: false; message: string }> => {
    const { readProviderTokens } = await import("./tokens.server");
    const tokens = readProviderTokens(data.provider);
    if (!tokens) {
      return { ok: false, message: "尚未授權。先用社團記憶搜尋。" };
    }
    try {
      if (data.provider === "google-drive") {
        const items = await listDrive(tokens.access, data.query);
        return { ok: true, items, account: tokens.account };
      }
      if (data.provider === "canva") {
        const items = await listCanva(tokens.access, data.query);
        return { ok: true, items, account: tokens.account };
      }
      const items = await listInstagram(tokens.access);
      return { ok: true, items, account: tokens.account };
    } catch {
      return { ok: false, message: "同步暫時失敗，先用社團記憶繼續創作。" };
    }
  });

async function listDrive(access: string, query?: string): Promise<MemoryItem[]> {
  const q = query?.trim()
    ? `fullText contains '${query.replace(/'/g, "\\'")}' and trashed = false`
    : "trashed = false";
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("pageSize", "18");
  url.searchParams.set("q", q);
  url.searchParams.set("fields", "files(id,name,mimeType,modifiedTime,thumbnailLink)");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${access}` } });
  if (!res.ok) return [];
  const body = (await res.json()) as {
    files?: { id: string; name: string; mimeType: string; modifiedTime?: string }[];
  };
  return (body.files ?? []).map((file) => ({
    id: `drive_${file.id}`,
    source: "drive" as const,
    sourceLabel: `Google Drive / ${file.name}`,
    title: file.name,
    kind: file.mimeType.includes("image") ? "photo" : "doc",
    tags: [file.mimeType],
    summary: "來自指定的禪學社資料夾。",
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
    items?: { id: string; title?: string; updated_at?: number }[];
  };
  return (body.items ?? []).map((item) => ({
    id: `canva_${item.id}`,
    source: "canva" as const,
    sourceLabel: `Canva / ${item.title || "設計"}`,
    title: item.title || "Canva 設計",
    kind: "design" as const,
    tags: ["canva"],
    summary: "作為風格參考，不要直接複製。",
    createdAt: item.updated_at ?? Date.now(),
  }));
}

async function listInstagram(access: string): Promise<MemoryItem[]> {
  const url = new URL("https://graph.instagram.com/me/media");
  url.searchParams.set("fields", "id,caption,media_type,timestamp,permalink");
  url.searchParams.set("limit", "18");
  url.searchParams.set("access_token", access);
  const res = await fetch(url);
  if (!res.ok) return [];
  const body = (await res.json()) as {
    data?: { id: string; caption?: string; media_type?: string; timestamp?: string }[];
  };
  return (body.data ?? []).map((post) => ({
    id: `ig_${post.id}`,
    source: "instagram" as const,
    sourceLabel: `Instagram / ${(post.timestamp ?? "").slice(0, 10)}`,
    title: (post.caption ?? "IG 貼文").split("\n")[0] ?? "IG 貼文",
    kind: "post" as const,
    tags: [post.media_type ?? "image"],
    summary: (post.caption ?? "").slice(0, 80),
    createdAt: post.timestamp ? Date.parse(post.timestamp) : Date.now(),
  }));
}
