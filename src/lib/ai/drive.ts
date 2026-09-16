import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type DriveFileHit = {
  id: string;
  name: string;
  mime?: string;
  snippet?: string;
  url?: string;
  thumbnail?: string;
  excerpt?: string;
  imageB64?: string;
  imageMime?: string;
  imageUrl?: string;
};

export type DriveSearchResult =
  | { ok: true; items: DriveFileHit[] }
  | { ok: false; error: string; loginRequired?: boolean; loginUrl?: string };

const SearchInput = z.object({
  query: z.string().min(1).max(200),
  folderHint: z.string().max(80).optional(),
});

function unwrap(input: unknown) {
  return input && typeof input === "object" && "data" in input && (input as { data: unknown }).data
    ? (input as { data: unknown }).data
    : input;
}

export const searchClubDrive = createServerFn({ method: "POST" })
  .validator((input: unknown) => SearchInput.parse(unwrap(input)))
  .handler(async ({ data }): Promise<DriveSearchResult> => {
    const { executeDriveSearch } = await import("./drive.server");
    return executeDriveSearch(data.query, data.folderHint);
  });

export const syncClubDrive = createServerFn({ method: "POST" })
  .validator((input: unknown) => SearchInput.parse(unwrap(input)))
  .handler(async ({ data }): Promise<DriveSearchResult> => {
    const { executeDriveSearch, executeDriveRead } = await import("./drive.server");
    const found = await executeDriveSearch(data.query, data.folderHint);
    if (!found.ok) return found;
    const items: DriveFileHit[] = [];
    for (const item of found.items.slice(0, 8)) {
      let extra: Partial<DriveFileHit> = {};
      try {
        const read = await executeDriveRead(item.id);
        if (read.ok) {
          extra = {
            excerpt: read.excerpt,
            imageB64: read.imageB64,
            imageMime: read.imageMime,
            imageUrl: read.imageUrl ?? item.thumbnail,
            mime: read.mime ?? item.mime,
          };
        }
      } catch {
        extra = { imageUrl: item.thumbnail };
      }
      items.push({ ...item, ...extra, imageUrl: extra.imageUrl ?? item.thumbnail });
    }
    return { ok: true, items };
  });

export const getConnectionCapabilities = createServerFn({ method: "POST" }).handler(async () => {
  const { oauthPublicStatus } = await import("@/lib/oauth/session.server");
  const oauth = await oauthPublicStatus();
  return {
    drive: true as const,
    canva: oauth.canva.configured,
    instagram: oauth.instagram.configured,
    image: Boolean(process.env.XAI_API_KEY),
    copy: Boolean(process.env.XAI_API_KEY),
    canvaConnected: oauth.canva.connected,
    canvaAccount: oauth.canva.accountName,
    instagramConnected: oauth.instagram.connected,
    instagramAccount: oauth.instagram.accountName,
  };
});
