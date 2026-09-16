import { ConnectorType, GoogleDriveTools } from "@/lib/app-data/types";
import { classifyCallToolError } from "@/lib/app-data/errors";
import type { MemoryItem } from "@/lib/club/memory";
import type { OAuthBlob } from "./vault.server";
import { graphImageUrl } from "@/lib/club/publish";
import { clubTagsFromText } from "@/lib/club/rank";
import {
  canvaDesignTypeFor,
  canvaDesignsUrl,
  canvaJobAssetId,
  canvaJobExportUrl,
  canvaJobId,
  canvaMetadataHeader,
  canvaUploadName,
  driveSearchQuery,
  jpegBase64Payload,
} from "./presets";

export type LiveHit = MemoryItem & {
  live?: boolean;
  metrics?: { reach?: number; likes?: number; comments?: number; saves?: number };
  mimeType?: string;
};

export { canvaDesignTypeFor, driveSearchQuery };

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

export async function fetchCanvaDesigns(blob: OAuthBlob | null, query?: string): Promise<LiveHit[]> {
  const token = blob?.canva?.access;
  if (!token) return [];
  try {
    const res = await timedFetch(canvaDesignsUrl(query), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      items?: { id?: string; title?: string; thumbnail?: { url?: string }; urls?: { edit_url?: string }; updated_at?: number }[];
    };
    return (json.items ?? []).slice(0, 24).map((item, index) => {
      const title = item.title || "未命名設計";
      return {
        id: item.id || `canva_${index}`,
        source: "canva" as const,
        title,
        subtitle: `Canva / ${title}`,
        tags: ["canva", "設計", ...clubTagsFromText(title)],
        kind: "poster" as const,
        date: item.updated_at ? new Date(item.updated_at * 1000).toISOString().slice(0, 10) : "",
        thumb: item.thumbnail?.url || "/seed/tea.svg",
        notes: item.urls?.edit_url || "Canva 設計",
        live: true,
      };
    });
  } catch {
    return [];
  }
}

export type IgAccount = { id: string; username: string; token: string };

export async function resolveIgAccount(blob: OAuthBlob | null): Promise<IgAccount | null> {
  const token = blob?.instagram?.access;
  if (!token) return null;
  try {
    const accounts = await timedFetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`,
    );
    if (!accounts.ok) return null;
    const parsed = (await accounts.json()) as {
      data?: { access_token?: string; instagram_business_account?: { id?: string; username?: string } }[];
    };
    const page = parsed.data?.find((row) => row.instagram_business_account?.id);
    const ig = page?.instagram_business_account;
    if (!ig?.id) return null;
    return { id: ig.id, username: ig.username || "", token: page?.access_token || token };
  } catch {
    return null;
  }
}

export async function fetchInstagramMedia(blob: OAuthBlob | null): Promise<LiveHit[]> {
  const ig = await resolveIgAccount(blob);
  if (!ig) return [];
  try {
    const media = await timedFetch(
      `https://graph.facebook.com/v21.0/${ig.id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,saved&limit=18&access_token=${encodeURIComponent(ig.token)}`,
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
    const withMetrics = await attachIgInsights(ig.token, rows);
    return withMetrics.map((item, index) => ({
      id: item.id || `ig_${index}`,
      source: "instagram" as const,
      title: (item.caption || "無文案").split("\n")[0]?.slice(0, 40) || "IG 貼文",
      subtitle: `Instagram / ${(item.timestamp || "").slice(0, 10)}`,
      tags: ["instagram", item.media_type || "IMAGE", ...clubTagsFromText(`${item.caption || ""} ${item.media_type || ""}`)],
      kind:
        item.media_type === "VIDEO" || item.media_type === "REELS"
          ? ("reels" as const)
          : item.media_type === "CAROUSEL_ALBUM"
            ? ("carousel" as const)
            : ("ig-post" as const),
      date: (item.timestamp || "").slice(0, 10),
      thumb: item.thumbnail_url || item.media_url || "/seed/tamsui.svg",
      caption: item.caption,
      notes: item.permalink || `${ig.username} · 讚 ${item.like_count ?? 0} · 留言 ${item.comments_count ?? 0}`,
      metrics: item.metrics,
      live: true,
    }));
  } catch {
    return [];
  }
}

export async function publishInstagramMedia(
  blob: OAuthBlob | null,
  input: { imageUrl: string; caption: string; kind: string; videoUrl?: string },
): Promise<
  | { ok: true; mediaId: string; permalink?: string }
  | { ok: false; error: string; needsConnect?: boolean; reason: "not-connected" | "api" | "unsupported" }
> {
  if (input.kind === "reels" && !input.videoUrl) {
    return { ok: false, error: "Reels 需要影片檔，官方 API 不能只發封面。", reason: "unsupported" };
  }
  const ig = await resolveIgAccount(blob);
  if (!ig) return { ok: false, error: "還沒連接 Instagram。", needsConnect: true, reason: "not-connected" };
  try {
    const createBody = new URLSearchParams({
      caption: input.caption.slice(0, 2200),
      access_token: ig.token,
    });
    if (input.kind === "reels" && input.videoUrl) {
      createBody.set("media_type", "REELS");
      createBody.set("video_url", input.videoUrl);
    } else {
      createBody.set("image_url", input.imageUrl);
      if (input.kind === "story") createBody.set("media_type", "STORIES");
    }
    const created = await fetch(`https://graph.facebook.com/v21.0/${ig.id}/media`, {
      method: "POST",
      body: createBody,
      signal: AbortSignal.timeout(15_000),
    });
    if (created.status === 401 || created.status === 403) {
      return { ok: false, error: "Instagram 權限不足，請重新授權發布。", needsConnect: true, reason: "api" };
    }
    if (!created.ok) return { ok: false, error: "官方 IG 暫時無法建立貼文。", reason: "api" };
    const createdJson = (await created.json()) as { id?: string };
    if (!createdJson.id) return { ok: false, error: "官方 IG 沒有回傳草稿。", reason: "api" };
    const published = await fetch(`https://graph.facebook.com/v21.0/${ig.id}/media_publish`, {
      method: "POST",
      body: new URLSearchParams({ creation_id: createdJson.id, access_token: ig.token }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!published.ok) return { ok: false, error: "官方 IG 草稿已建立，但還沒發出去。", reason: "api" };
    const publishedJson = (await published.json()) as { id?: string };
    return { ok: true, mediaId: publishedJson.id || createdJson.id };
  } catch {
    return { ok: false, error: "官方 IG 暫時無法發布。", reason: "api" };
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

type CanvaDesignOk = { ok: true; editUrl: string; id: string; exportUrl?: string; assetId?: string };
type CanvaDesignErr = { ok: false; error: string; needsConnect?: boolean };

async function pollCanvaJob(
  url: string,
  token: string,
  pick: (json: { job?: { status?: string; asset?: { id?: string }; urls?: string[] } }) => string,
  maxMs: number,
) {
  const started = Date.now();
  let wait = 350;
  while (Date.now() - started < maxMs) {
    await new Promise((resolve) => setTimeout(resolve, wait));
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 401 || res.status === 403) return "";
      if (!res.ok) {
        wait = Math.min(wait + 200, 1200);
        continue;
      }
      const json = (await res.json()) as { job?: { status?: string; asset?: { id?: string }; urls?: string[] } };
      if (json.job?.status === "failed") return "";
      const value = pick(json);
      if (value) return value;
    } catch {
      // keep polling until the budget runs out
    }
    wait = Math.min(Math.round(wait * 1.35), 1400);
  }
  return "";
}

async function fetchPublicImage(url: string) {
  const publicUrl = graphImageUrl(url);
  if (!publicUrl) return null;
  try {
    const res = await fetch(publicUrl, { signal: AbortSignal.timeout(10_000), redirect: "follow" });
    if (!res.ok) return null;
    const mime = (res.headers.get("content-type") || "").split(";")[0]?.trim() || "";
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length < 32 || bytes.length > 8_000_000) return null;
    const kind = /^image\/(jpeg|jpg|png|webp)$/i.test(mime)
      ? mime.toLowerCase()
      : /\.png(\?|$)/i.test(publicUrl)
        ? "image/png"
        : "image/jpeg";
    return { bytes, mime: kind };
  } catch {
    return null;
  }
}

async function bytesFromPlanImage(input: { imageBase64?: string; imageUrl?: string }) {
  if (input.imageUrl) {
    const remote = await fetchPublicImage(input.imageUrl);
    if (remote) return remote;
  }
  if (!input.imageBase64) return null;
  const payload = jpegBase64Payload(input.imageBase64);
  if (!payload) return null;
  const bytes = Buffer.from(payload.base64, "base64");
  if (bytes.length < 32 || bytes.length > 8_000_000) return null;
  return { bytes, mime: payload.mime };
}

async function uploadCanvaAsset(token: string, title: string, kind: string, image: { bytes: Buffer; mime: string }) {
  const filename = canvaUploadName(title, kind);
  const started = await fetch("https://api.canva.com/rest/v1/asset-uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Asset-Upload-Metadata": canvaMetadataHeader(filename),
    },
    body: new Uint8Array(image.bytes),
    signal: AbortSignal.timeout(20_000),
  });
  if (started.status === 401 || started.status === 403) return { error: "auth" as const, id: "" };
  if (!started.ok) return { error: "api" as const, id: "" };
  const json = (await started.json()) as { job?: { id?: string; status?: string; asset?: { id?: string } } };
  const existing = canvaJobAssetId(json);
  if (existing) return { error: "" as const, id: existing };
  const jobId = canvaJobId(json);
  if (!jobId) return { error: "api" as const, id: "" };
  const uploaded = await pollCanvaJob(
    `https://api.canva.com/rest/v1/asset-uploads/${jobId}`,
    token,
    canvaJobAssetId,
    10_000,
  );
  return uploaded ? { error: "" as const, id: uploaded } : { error: "api" as const, id: "" };
}

async function exportCanvaDesign(token: string, designId: string) {
  const started = await fetch("https://api.canva.com/rest/v1/exports", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      design_id: designId,
      format: { type: "jpg", quality: 80 },
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!started.ok) return "";
  const json = (await started.json()) as { job?: { id?: string; status?: string; urls?: string[] } };
  const existing = canvaJobExportUrl(json);
  if (existing) return existing;
  const jobId = canvaJobId(json);
  if (!jobId) return "";
  return pollCanvaJob(`https://api.canva.com/rest/v1/exports/${jobId}`, token, canvaJobExportUrl, 8_000);
}

export async function createCanvaDesign(
  blob: OAuthBlob | null,
  input: { title: string; kind: string; imageBase64?: string; imageUrl?: string },
): Promise<CanvaDesignOk | CanvaDesignErr> {
  const token = blob?.canva?.access;
  if (!token) return { ok: false, error: "還沒連接 Canva。", needsConnect: true };
  const title = input.title.slice(0, 80) || "淡江禪學社";
  try {
    const image = await bytesFromPlanImage(input);
    let assetId = "";
    if (image) {
      const uploaded = await uploadCanvaAsset(token, title, input.kind, image);
      if (uploaded.error === "auth") return { ok: false, error: "Canva 權限不足，請重新授權上傳素材。", needsConnect: true };
      assetId = uploaded.id;
    }
    const res = await fetch("https://api.canva.com/rest/v1/designs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(12_000),
      body: JSON.stringify({
        type: "type_and_asset",
        design_type: canvaDesignTypeFor(input.kind),
        title,
        ...(assetId ? { asset_id: assetId } : {}),
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
    const exported = id ? await exportCanvaDesign(token, id) : "";
    const exportUrl = graphImageUrl(exported) || graphImageUrl(input.imageUrl || "") || undefined;
    return { ok: true, editUrl, id, exportUrl, assetId: assetId || undefined };
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
