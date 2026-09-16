import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SearchHit } from "@/lib/zen/search";

function unwrap(input: unknown) {
  return input && typeof input === "object" && "data" in input && (input as { data: unknown }).data
    ? (input as { data: unknown }).data
    : input;
}

const QueryInput = z.object({
  query: z.string().min(1).max(200),
});

const ProviderInput = z.object({
  provider: z.enum(["canva", "instagram"]),
});

const DesignInput = z.object({
  title: z.string().min(1).max(80),
  hook: z.string().max(80).optional(),
  notes: z.string().max(2000).optional(),
  preset: z.enum(["instagramPost", "instagramStory", "instagramReel"]).optional(),
  imageB64: z.string().min(24).max(4_000_000).optional(),
  mime: z.string().max(80).optional(),
});

const PublishInput = z.object({
  caption: z.string().min(1).max(2200),
  imageUrl: z.string().url().max(2000).optional(),
});

export const getOAuthStatus = createServerFn({ method: "POST" }).handler(async () => {
  const { oauthPublicStatus } = await import("@/lib/oauth/session.server");
  return oauthPublicStatus();
});

export const disconnectOAuth = createServerFn({ method: "POST" })
  .validator((input: unknown) => ProviderInput.parse(unwrap(input)))
  .handler(async ({ data }) => {
    if (data.provider === "canva") {
      const { revokeCanva } = await import("@/lib/oauth/canva.server");
      await revokeCanva();
    } else {
      const { revokeInstagram } = await import("@/lib/oauth/instagram.server");
      await revokeInstagram();
    }
    return { ok: true as const };
  });

export const searchCanvaWorld = createServerFn({ method: "POST" })
  .validator((input: unknown) => QueryInput.parse(unwrap(input)))
  .handler(async ({ data }): Promise<{ ok: true; items: SearchHit[]; connected: boolean }> => {
    const { searchCanvaDesigns } = await import("@/lib/oauth/canva.server");
    const { readOAuthTokens } = await import("@/lib/oauth/session.server");
    const connected = Boolean(await readOAuthTokens("canva"));
    const items = connected ? await searchCanvaDesigns(data.query) : [];
    return {
      ok: true,
      connected,
      items: items.map((item) => ({
        id: `canva_${item.id}`,
        source: "canva" as const,
        title: item.title,
        subtitle: item.editUrl ? "Canva / 開啟編輯" : "Canva",
        tags: [item.kind],
        url: item.editUrl,
        thumbUrl: item.thumbnail,
      })),
    };
  });

export const searchInstagramWorld = createServerFn({ method: "POST" })
  .validator((input: unknown) => QueryInput.parse(unwrap(input)))
  .handler(async ({ data }): Promise<{ ok: true; items: SearchHit[]; connected: boolean }> => {
    const { searchInstagramMedia } = await import("@/lib/oauth/instagram.server");
    const { readOAuthTokens } = await import("@/lib/oauth/session.server");
    const connected = Boolean(await readOAuthTokens("instagram"));
    const items = connected ? await searchInstagramMedia(data.query) : [];
    return {
      ok: true,
      connected,
      items: items.map((item) => ({
        id: `ig_${item.id}`,
        source: "instagram" as const,
        title: item.caption.split("\n")[0]?.slice(0, 32) || "IG 貼文",
        subtitle: item.timestamp ? `Instagram / ${item.timestamp.slice(0, 10)}` : "Instagram",
        tags: [item.mediaType],
        url: item.permalink,
        thumbUrl: item.thumbnail ?? item.mediaUrl,
      })),
    };
  });

export const createCanvaDraft = createServerFn({ method: "POST" })
  .validator((input: unknown) => DesignInput.parse(unwrap(input)))
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; editUrl: string; title: string; notes: string; uploaded: boolean }
      | { ok: false; needsAuth: boolean; error: string }
    > => {
      const { canvaDraftTitle } = await import("@/lib/zen/canva-draft");
      const { createCanvaDesign, uploadCanvaAsset } = await import("@/lib/oauth/canva.server");
      const { isRasterImageMime } = await import("@/lib/zen/ingest");
      const title = canvaDraftTitle(data.title, data.hook);
      let assetId: string | undefined;
      if (data.imageB64 && isRasterImageMime(data.mime ?? "image/jpeg")) {
        const bytes = Buffer.from(data.imageB64, "base64");
        const uploaded = await uploadCanvaAsset({
          name: title,
          mime: data.mime ?? "image/jpeg",
          bytes,
        });
        assetId = uploaded?.assetId;
      }
      const created = await createCanvaDesign({ title, preset: data.preset, assetId });
      if (!created) {
        return { ok: false, needsAuth: true, error: "還沒連接 Canva，或官方應用程式尚未設定。" };
      }
      return { ok: true, editUrl: created.editUrl, title, notes: data.notes ?? "", uploaded: Boolean(assetId) };
    },
  );

export const publishOrQueueInstagram = createServerFn({ method: "POST" })
  .validator((input: unknown) => PublishInput.parse(unwrap(input)))
  .handler(async ({ data }): Promise<
    | { ok: true; mediaId: string }
    | { ok: false; error: string; caption: string; needsReauth?: boolean; needsPublicUrl?: boolean }
  > => {
    const { isPublicHttpsUrl } = await import("@/lib/zen/ingest");
    if (!data.imageUrl) {
      return {
        ok: false,
        caption: data.caption,
        needsPublicUrl: true,
        error: "官方發布需要公開圖片網址。文案可先複製，或先標記已發布。",
      };
    }
    if (!isPublicHttpsUrl(data.imageUrl)) {
      return {
        ok: false,
        caption: data.caption,
        needsPublicUrl: true,
        error: "圖片網址必須是公開 https，不能是本機或內網。",
      };
    }
    const { publishInstagramImage } = await import("@/lib/oauth/instagram.server");
    const result = await publishInstagramImage({ imageUrl: data.imageUrl, caption: data.caption });
    if (result.ok) return result;
    return { ...result, caption: data.caption };
  });

export const searchCreativeWorld = createServerFn({ method: "POST" })
  .validator((input: unknown) => QueryInput.parse(unwrap(input)))
  .handler(async ({ data }): Promise<{
    ok: true;
    hits: SearchHit[];
    foundCount: number;
    driveLoginUrl?: string;
  }> => {
    const hits: SearchHit[] = [];
    let driveLoginUrl: string | undefined;
    try {
      const { executeDriveSearch } = await import("@/lib/ai/drive.server");
      const drive = await executeDriveSearch(data.query);
      if (drive.ok) {
        for (const item of drive.items) {
          hits.push({
            id: `drive_${item.id}`,
            source: "drive",
            title: item.name,
            subtitle: item.snippet || "Google Drive",
            tags: ["Drive"],
            url: item.url,
            thumbUrl: item.thumbnail,
          });
        }
      } else if (drive.loginRequired) {
        driveLoginUrl = drive.loginUrl;
      }
    } catch {
      /* Drive optional */
    }
    try {
      const { searchCanvaDesigns } = await import("@/lib/oauth/canva.server");
      const canva = await searchCanvaDesigns(data.query);
      for (const item of canva) {
        hits.push({
          id: `canva_${item.id}`,
          source: "canva",
          title: item.title,
          subtitle: "Canva",
          tags: ["Canva"],
          url: item.editUrl,
          thumbUrl: item.thumbnail,
        });
      }
    } catch {
      /* Canva optional */
    }
    try {
      const { searchInstagramMedia } = await import("@/lib/oauth/instagram.server");
      const ig = await searchInstagramMedia(data.query);
      for (const item of ig) {
        hits.push({
          id: `ig_${item.id}`,
          source: "instagram",
          title: item.caption.split("\n")[0]?.slice(0, 32) || "IG 貼文",
          subtitle: item.timestamp ? `Instagram / ${item.timestamp.slice(0, 10)}` : "Instagram",
          tags: [item.mediaType],
          url: item.permalink,
          thumbUrl: item.thumbnail ?? item.mediaUrl,
        });
      }
    } catch {
      /* IG optional */
    }
    return { ok: true, hits, foundCount: hits.length, driveLoginUrl };
  });

export const syncInstagramMemory = createServerFn({ method: "POST" }).handler(async (): Promise<
  | { ok: true; connected: boolean; posts: LiveIgPost[] }
  | { ok: false; error: string; connected: boolean }
> => {
  const { readOAuthTokens } = await import("@/lib/oauth/session.server");
  const tokens = await readOAuthTokens("instagram");
  if (!tokens?.accessToken) {
    return { ok: false, connected: false, error: "還沒連接 Instagram 官方帳號。" };
  }
  const { searchInstagramMedia, mediaInsights } = await import("@/lib/oauth/instagram.server");
  const items = await searchInstagramMedia("");
  const scored = await Promise.all(
    items.slice(0, 12).map(async (item) => {
      const insight = item.id ? await mediaInsights(item.id, tokens.accessToken) : { reach: 0, saves: 0 };
      return {
        id: `ig_${item.id}`,
        caption: item.caption,
        mediaType: igMediaKind(item.mediaType),
        postedAt: item.timestamp ? Date.parse(item.timestamp) : Date.now(),
        likes: item.likes ?? 0,
        comments: item.comments ?? 0,
        saves: insight.saves,
        reach: insight.reach,
        permalink: item.permalink,
        mediaUrl: item.mediaUrl ?? item.thumbnail,
        hook: item.caption.split("\n")[0]?.slice(0, 40) || "IG 貼文",
      };
    }),
  );
  return {
    ok: true,
    connected: true,
    posts: scored,
  };
});

export type LiveIgPost = {
  id: string;
  caption: string;
  mediaType: "image" | "carousel" | "reels";
  postedAt: number;
  likes: number;
  comments: number;
  saves: number;
  reach: number;
  permalink?: string;
  mediaUrl?: string;
  hook: string;
};

function igMediaKind(raw: string): LiveIgPost["mediaType"] {
  const t = raw.toUpperCase();
  if (t.includes("CAROUSEL")) return "carousel";
  if (t.includes("VIDEO") || t.includes("REEL")) return "reels";
  return "image";
}
