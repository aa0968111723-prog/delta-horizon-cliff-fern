import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ConnectionInfo, ConnectionProvider } from "@/lib/studio/types";
import { type ExternalItem, PROVIDER_ORDER, PROVIDERS } from "./providers";

const ProviderSchema = z.enum(["drive", "canva", "instagram"]);

function unwrap(input: unknown): unknown {
  if (input && typeof input === "object" && "data" in input) {
    const inner = (input as { data: unknown }).data;
    if (inner && typeof inner === "object") return inner;
  }
  return input;
}

async function store() {
  return import("./store.server");
}

/* ------------------------------------------------------------------ */
/* 狀態                                                                 */
/* ------------------------------------------------------------------ */

export const getConnections = createServerFn({ method: "POST" }).handler(async (): Promise<ConnectionInfo[]> => {
  const s = await store();
  const out: ConnectionInfo[] = [];
  for (const provider of PROVIDER_ORDER) {
    const creds = s.providerCredentials(provider);
    const token = await s.readToken(provider);
    let status: ConnectionInfo["status"] = "disconnected";
    if (!creds) status = "unconfigured";
    else if (token) status = token.expiresAt && token.expiresAt < Date.now() && !token.refreshToken && provider !== "instagram" ? "expired" : "connected";
    out.push({
      provider,
      status,
      accountLabel: token?.accountLabel ?? null,
      lastSyncAt: token?.lastSyncAt ?? null,
      itemCount: token?.itemCount ?? 0,
      rootLabel: token?.meta.rootLabel ?? null,
    });
  }
  return out;
});

export const disconnectConnection = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ provider: ProviderSchema }).parse(unwrap(input)))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const s = await store();
    const token = await s.readToken(data.provider);
    if (token) await s.revokeRemote(data.provider, token);
    s.clearToken(data.provider);
    return { ok: true };
  });

export type SyncResult = { ok: true; itemCount: number; accountLabel: string | null; lastSyncAt: number } | { ok: false; error: string };

export const syncConnection = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ provider: ProviderSchema }).parse(unwrap(input)))
  .handler(async ({ data }): Promise<SyncResult> => {
    const s = await store();
    const got = await s.getAccessToken(data.provider);
    if (!got) return { ok: false, error: "尚未連接，或授權已過期，請重新授權。" };
    try {
      const items = await listRecent(data.provider, got.accessToken, got.token.meta, 50);
      const next = { ...got.token, itemCount: Math.max(items.length, got.token.itemCount), lastSyncAt: Date.now() };
      await s.writeToken(data.provider, next);
      return { ok: true, itemCount: next.itemCount, accountLabel: next.accountLabel, lastSyncAt: next.lastSyncAt };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "同步失敗" };
    }
  });

/* ------------------------------------------------------------------ */
/* Drive 主要資料夾                                                      */
/* ------------------------------------------------------------------ */

export type DriveFolder = { id: string; name: string };

export const listDriveFolders = createServerFn({ method: "POST" }).handler(async (): Promise<{ ok: true; folders: DriveFolder[] } | { ok: false; error: string }> => {
  const s = await store();
  const got = await s.getAccessToken("drive");
  if (!got) return { ok: false, error: "尚未連接 Google Drive" };
  const q = encodeURIComponent("mimeType='application/vnd.google-apps.folder' and trashed=false");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=50&fields=files(id,name)&orderBy=modifiedTime desc`, {
    headers: { Authorization: `Bearer ${got.accessToken}` },
  });
  if (!res.ok) return { ok: false, error: `Drive 回應 ${res.status}` };
  const body = (await res.json()) as { files?: DriveFolder[] };
  return { ok: true, folders: body.files ?? [] };
});

export const setDriveRoot = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ folderId: z.string().max(200), label: z.string().max(200) }).parse(unwrap(input)))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const s = await store();
    const token = await s.readToken("drive");
    if (!token) return { ok: false };
    await s.writeToken("drive", { ...token, meta: { ...token.meta, rootId: data.folderId, rootLabel: data.label } });
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* 列表 / 搜尋                                                           */
/* ------------------------------------------------------------------ */

async function listRecent(provider: ConnectionProvider, accessToken: string, meta: Record<string, string>, limit: number): Promise<ExternalItem[]> {
  if (provider === "drive") return driveList(accessToken, meta, null, limit);
  if (provider === "canva") return canvaList(accessToken, null, limit);
  return instagramList(accessToken, limit);
}

async function driveList(accessToken: string, meta: Record<string, string>, query: string[] | null, limit: number): Promise<ExternalItem[]> {
  const clauses = ["trashed=false", "(mimeType contains 'image/' or mimeType contains 'video/' or mimeType contains 'application/vnd.google-apps' or mimeType='application/pdf')"];
  if (query?.length) {
    const esc = (k: string) => k.replace(/['\\]/g, "\\$&");
    clauses.push(`(${query.map((k) => `fullText contains '${esc(k)}' or name contains '${esc(k)}'`).join(" or ")})`);
  } else if (meta.rootId) {
    clauses.push(`'${meta.rootId}' in parents`);
  }
  const params = new URLSearchParams({
    q: clauses.join(" and "),
    pageSize: String(Math.min(limit, 100)),
    fields: "files(id,name,mimeType,thumbnailLink,webViewLink,modifiedTime,iconLink)",
    orderBy: "modifiedTime desc",
    includeItemsFromAllDrives: "true",
    supportsAllDrives: "true",
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Google Drive 回應 ${res.status}`);
  const body = (await res.json()) as { files?: { id: string; name: string; mimeType: string; thumbnailLink?: string; webViewLink?: string; modifiedTime?: string }[] };
  return (body.files ?? []).map((f) => ({
    provider: "drive",
    id: f.id,
    title: f.name,
    thumbnail: f.thumbnailLink ?? null,
    url: f.webViewLink ?? null,
    kind: driveKind(f.mimeType),
    subtitle: `Google Drive${meta.rootLabel ? ` / ${meta.rootLabel}` : ""}`,
    date: f.modifiedTime ?? null,
  }));
}

function driveKind(mime: string) {
  if (mime.startsWith("image/")) return "照片";
  if (mime.startsWith("video/")) return "影片";
  if (mime.includes("document")) return "Docs";
  if (mime.includes("spreadsheet")) return "Sheets";
  if (mime.includes("presentation")) return "Slides";
  if (mime === "application/pdf") return "PDF";
  return "檔案";
}

async function canvaList(accessToken: string, query: string | null, limit: number): Promise<ExternalItem[]> {
  const params = new URLSearchParams({ ownership: "any", sort_by: query ? "relevance" : "modified_descending" });
  if (query) params.set("query", query);
  const res = await fetch(`https://api.canva.com/rest/v1/designs?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Canva 回應 ${res.status}`);
  const body = (await res.json()) as {
    items?: { id: string; title?: string; thumbnail?: { url: string }; urls?: { edit_url?: string; view_url?: string }; updated_at?: number; page_count?: number }[];
  };
  return (body.items ?? []).slice(0, limit).map((d) => ({
    provider: "canva",
    id: d.id,
    title: d.title || "未命名設計",
    thumbnail: d.thumbnail?.url ?? null,
    url: d.urls?.edit_url ?? d.urls?.view_url ?? null,
    kind: d.page_count && d.page_count > 1 ? `設計 · ${d.page_count} 頁` : "設計",
    subtitle: "Canva",
    date: d.updated_at ? new Date(d.updated_at * 1000).toISOString() : null,
  }));
}

type IgMedia = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
};

async function instagramList(accessToken: string, limit: number, withInsights = false): Promise<ExternalItem[]> {
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";
  const res = await fetch(`https://graph.instagram.com/v21.0/me/media?fields=${fields}&limit=${Math.min(limit, 50)}&access_token=${encodeURIComponent(accessToken)}`);
  if (!res.ok) throw new Error(`Instagram 回應 ${res.status}`);
  const body = (await res.json()) as { data?: IgMedia[] };
  const items = body.data ?? [];
  const insights = withInsights ? await Promise.all(items.map((m) => igInsights(m.id, accessToken))) : [];
  return items.map((m, i) => ({
    provider: "instagram",
    id: m.id,
    title: (m.caption ?? "").split("\n")[0]?.slice(0, 60) || "（無文字）",
    thumbnail: m.thumbnail_url ?? m.media_url ?? null,
    url: m.permalink ?? null,
    kind: m.media_type === "CAROUSEL_ALBUM" ? "Carousel" : m.media_type === "VIDEO" ? "Reels" : "貼文",
    subtitle: `Instagram${m.timestamp ? ` / ${m.timestamp.slice(0, 10)}` : ""}`,
    date: m.timestamp ?? null,
    caption: m.caption ?? "",
    metrics: { likes: m.like_count, comments: m.comments_count, ...(insights[i] ?? {}) },
  }));
}

async function igInsights(mediaId: string, accessToken: string): Promise<Partial<NonNullable<ExternalItem["metrics"]>>> {
  try {
    const res = await fetch(`https://graph.instagram.com/v21.0/${mediaId}/insights?metric=reach,saved,shares,views&access_token=${encodeURIComponent(accessToken)}`);
    if (!res.ok) return {};
    const body = (await res.json()) as { data?: { name: string; values?: { value: number }[] }[] };
    const out: Record<string, number> = {};
    for (const row of body.data ?? []) {
      const v = row.values?.[0]?.value;
      if (typeof v !== "number") continue;
      if (row.name === "saved") out.saves = v;
      else out[row.name] = v;
    }
    return out;
  } catch {
    return {};
  }
}

/** 自然語言 → 搜尋關鍵字（有 AI 時展開同義詞，沒有就切詞）。 */
async function expandKeywords(query: string): Promise<string[]> {
  const base = query
    .replace(/[「」『』,.，。!?！？]/g, " ")
    .replace(/^(找|幫我找|搜尋|搜|有沒有|以前的?|過去的?|歷屆的?)/, "")
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .slice(0, 5);
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return base.length ? base : [query.trim()];
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.2,
        max_tokens: 200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: '你幫一個大學社團（淡江大學禪學社）把自然語言搜尋轉成檔名 / 內文可能出現的關鍵字。回 JSON {"keywords":[...]}，3–6 個，繁體中文為主，可含英文；活動名要保留原字。',
          },
          { role: "user", content: query },
        ],
      }),
    });
    if (!res.ok) return base;
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const parsed = JSON.parse(body.choices?.[0]?.message?.content ?? "{}") as { keywords?: string[] };
    const kws = (parsed.keywords ?? []).map((k) => String(k).trim()).filter(Boolean);
    return kws.length ? [...new Set([...base, ...kws])].slice(0, 8) : base;
  } catch {
    return base;
  }
}

export type ExternalSearchResult = {
  query: string;
  keywords: string[];
  groups: { provider: ConnectionProvider; status: "ok" | "disconnected" | "error"; items: ExternalItem[]; error?: string }[];
};

export const searchExternal = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ query: z.string().max(200), limit: z.number().int().min(1).max(50).optional() }).parse(unwrap(input)))
  .handler(async ({ data }): Promise<ExternalSearchResult> => {
    const s = await store();
    const q = data.query.trim();
    const keywords = q ? await expandKeywords(q) : [];
    const limit = data.limit ?? 12;
    const groups: ExternalSearchResult["groups"] = [];
    for (const provider of PROVIDER_ORDER) {
      const got = await s.getAccessToken(provider);
      if (!got) {
        groups.push({ provider, status: "disconnected", items: [] });
        continue;
      }
      try {
        let items: ExternalItem[];
        if (provider === "drive") items = await driveList(got.accessToken, got.token.meta, keywords.length ? keywords : null, limit);
        else if (provider === "canva") items = await canvaList(got.accessToken, q || null, limit);
        else {
          const all = await instagramList(got.accessToken, 50);
          const lower = keywords.map((k) => k.toLowerCase());
          items = (q ? all.filter((m) => lower.some((k) => (m.caption ?? "").toLowerCase().includes(k) || m.title.toLowerCase().includes(k))) : all).slice(0, limit);
        }
        groups.push({ provider, status: "ok", items });
      } catch (err) {
        groups.push({ provider, status: "error", items: [], error: err instanceof Error ? err.message : `${PROVIDERS[provider].label} 讀取失敗` });
      }
    }
    return { query: q, keywords, groups };
  });

export type IgFeedResult =
  | { ok: true; account: string | null; items: ExternalItem[]; profile: { username: string; name?: string; biography?: string; followers?: number; mediaCount?: number } | null }
  | { ok: false; error: string; status: "disconnected" | "error" };

export const fetchInstagramFeed = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ limit: z.number().int().min(1).max(50).optional(), insights: z.boolean().optional() }).parse(unwrap(input ?? {})))
  .handler(async ({ data }): Promise<IgFeedResult> => {
    const s = await store();
    const got = await s.getAccessToken("instagram");
    if (!got) return { ok: false, status: "disconnected", error: "尚未連接 Instagram" };
    try {
      const [items, profileRes] = await Promise.all([
        instagramList(got.accessToken, data.limit ?? 30, data.insights ?? true),
        fetch(`https://graph.instagram.com/v21.0/me?fields=id,username,name,biography,followers_count,media_count&access_token=${encodeURIComponent(got.accessToken)}`),
      ]);
      const p = profileRes.ok ? ((await profileRes.json()) as { username: string; name?: string; biography?: string; followers_count?: number; media_count?: number }) : null;
      return {
        ok: true,
        account: got.token.accountLabel,
        items,
        profile: p ? { username: p.username, name: p.name, biography: p.biography, followers: p.followers_count, mediaCount: p.media_count } : null,
      };
    } catch (err) {
      return { ok: false, status: "error", error: err instanceof Error ? err.message : "Instagram 讀取失敗" };
    }
  });

/** 把外部縮圖抓成 data URL（帶 token），給 Vision AI 或存進素材庫。 */
export const fetchExternalImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ provider: ProviderSchema, url: z.string().url().max(2000) }).parse(unwrap(input)))
  .handler(async ({ data }): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> => {
    const s = await store();
    const got = await s.getAccessToken(data.provider);
    if (!got) return { ok: false, error: "尚未連接" };
    const headers: Record<string, string> = {};
    if (data.provider === "drive") headers.Authorization = `Bearer ${got.accessToken}`;
    const allowed =
      data.provider === "drive"
        ? /^https:\/\/([a-z0-9-]+\.)*(googleusercontent\.com|googleapis\.com)\//
        : data.provider === "canva"
          ? /^https:\/\/([a-z0-9-]+\.)*(canva\.com|canva-user-content\.com)\//
          : /^https:\/\/([a-z0-9-]+\.)*(cdninstagram\.com|fbcdn\.net)\//;
    if (!allowed.test(data.url)) return { ok: false, error: "不允許的來源" };
    const res = await fetch(data.url, { headers });
    if (!res.ok) return { ok: false, error: `讀取失敗（${res.status}）` };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 5_000_000) return { ok: false, error: "圖片太大" };
    const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    return { ok: true, dataUrl: `data:${mime};base64,${buf.toString("base64")}` };
  });
