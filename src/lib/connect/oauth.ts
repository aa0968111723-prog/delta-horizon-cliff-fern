import { EncryptJWT, jwtDecrypt } from "jose";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

export type ProviderId = "drive" | "canva" | "instagram";

export type TokenBundle = {
  provider: ProviderId;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  accountLabel: string;
  folderId?: string;
  folderName?: string;
};

function secretKey() {
  const raw = process.env.OAUTH_COOKIE_SECRET || process.env.BETTER_AUTH_SECRET || process.env.XAI_API_KEY || "zen-dev-only";
  return new TextEncoder().encode(raw.padEnd(32, "0").slice(0, 32));
}

function cookieName(provider: ProviderId) {
  return `zen_oauth_${provider}`;
}

export function providerConfig(provider: ProviderId): { configured: boolean; authorize?: string; label: string } {
  if (provider === "drive") {
    const id = process.env.GOOGLE_CLIENT_ID;
    return {
      configured: Boolean(id && process.env.GOOGLE_CLIENT_SECRET),
      label: "Google Drive",
      authorize: id
        ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(id)}&response_type=code&scope=${encodeURIComponent("https://www.googleapis.com/auth/drive.readonly")}&access_type=offline&prompt=consent`
        : undefined,
    };
  }
  if (provider === "canva") {
    const id = process.env.CANVA_CLIENT_ID;
    const scope =
      "design:meta:read design:content:read design:content:write asset:read asset:write brandtemplate:meta:read brandtemplate:content:read profile:read";
    return {
      configured: Boolean(id && process.env.CANVA_CLIENT_SECRET),
      label: "Canva",
      authorize: id
        ? `https://www.canva.com/api/oauth/authorize?client_id=${encodeURIComponent(id)}&response_type=code&scope=${encodeURIComponent(scope)}`
        : undefined,
    };
  }
  const id = process.env.INSTAGRAM_CLIENT_ID || process.env.META_APP_ID;
  return {
    configured: Boolean(id && (process.env.INSTAGRAM_CLIENT_SECRET || process.env.META_APP_SECRET)),
    label: "Instagram",
    authorize: id
        ? `https://www.facebook.com/v21.0/dialog/oauth?client_id=${encodeURIComponent(id)}&response_type=code&scope=${encodeURIComponent("instagram_basic,pages_show_list,instagram_manage_insights,instagram_content_publish")}`
      : undefined,
  };
}

export async function encryptBundle(bundle: TokenBundle) {
  return new EncryptJWT(bundle)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .encrypt(secretKey());
}

export async function decryptBundle(token: string): Promise<TokenBundle | null> {
  try {
    const { payload } = await jwtDecrypt(token, secretKey());
    return payload as unknown as TokenBundle;
  } catch {
    return null;
  }
}

export const getConnectionStatus = createServerFn({ method: "POST" }).handler(async () => {
  return {
    drive: providerConfig("drive"),
    canva: providerConfig("canva"),
    instagram: providerConfig("instagram"),
  };
});

export const getConnectedProfile = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ provider: z.enum(["drive", "canva", "instagram"]) }).parse(input))
  .handler(async ({ data }) => {
    const request = getRequest();
    const cookie = request?.headers.get("cookie") ?? "";
    const match = cookie.match(new RegExp(`${cookieName(data.provider)}=([^;]+)`));
    if (!match) return { connected: false as const };
    const bundle = await decryptBundle(decodeURIComponent(match[1]));
    if (!bundle) return { connected: false as const };
    return {
      connected: true as const,
      accountLabel: bundle.accountLabel,
      folderId: bundle.folderId,
      folderName: bundle.folderName,
    };
  });

export { cookieName };
