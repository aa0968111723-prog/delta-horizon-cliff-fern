import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type DriveSearchResult =
  | {
      ok: true;
      items: { id: string; name: string; mime?: string; snippet?: string }[];
    }
  | { ok: false; error: string; loginRequired?: boolean; loginUrl?: string };

const SearchInput = z.object({
  query: z.string().min(1).max(200),
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
    return executeDriveSearch(data.query);
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
