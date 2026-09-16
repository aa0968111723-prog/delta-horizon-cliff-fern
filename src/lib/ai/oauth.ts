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
      })),
    };
  });

export const createCanvaDraft = createServerFn({ method: "POST" })
  .validator((input: unknown) => DesignInput.parse(unwrap(input)))
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; editUrl: string } | { ok: false; needsAuth: boolean; error: string }> => {
      const { createCanvaDesign } = await import("@/lib/oauth/canva.server");
      const created = await createCanvaDesign(data.title);
      if (!created) {
        return { ok: false, needsAuth: true, error: "還沒連接 Canva，或官方應用程式尚未設定。" };
      }
      return { ok: true, editUrl: created.editUrl };
    },
  );

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
        });
      }
    } catch {
      /* IG optional */
    }
    return { ok: true, hits, foundCount: hits.length, driveLoginUrl };
  });
