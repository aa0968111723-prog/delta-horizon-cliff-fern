import { createHash } from "node:crypto";
import { CompactEncrypt, compactDecrypt } from "jose";

const COOKIE = "zen_oauth";

function keyBytes() {
  const raw = process.env.CONNECTIONS_SECRET || process.env.XAI_API_KEY || "zen-preview-ephemeral";
  return createHash("sha256").update(`zen-club-oauth:${raw}`).digest();
}

export async function encryptState(payload: unknown): Promise<string> {
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  return new CompactEncrypt(encoded)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(keyBytes());
}

export async function decryptState<T>(token: string): Promise<T | null> {
  try {
    const { plaintext } = await compactDecrypt(token, keyBytes());
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    return null;
  }
}

export type OAuthBlob = {
  canva?: { access: string; refresh?: string; expiresAt?: number; account?: string };
  instagram?: { access: string; refresh?: string; expiresAt?: number; account?: string };
};

export function readBlobFromCookie(cookieHeader: string | null): Promise<OAuthBlob | null> {
  if (!cookieHeader) return Promise.resolve(null);
  const match = cookieHeader.split(/;\s*/).find((part) => part.startsWith(`${COOKIE}=`));
  if (!match) return Promise.resolve(null);
  return decryptState<OAuthBlob>(decodeURIComponent(match.slice(COOKIE.length + 1)));
}

export async function setBlobCookie(blob: OAuthBlob) {
  const token = await encryptState(blob);
  const { setCookie } = await import("@tanstack/react-start/server");
  setCookie(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 2_592_000,
  });
}

export async function clearBlobCookie() {
  const { setCookie } = await import("@tanstack/react-start/server");
  setCookie(COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export function canvaConfigured() {
  return Boolean(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET);
}

export function instagramConfigured() {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export { COOKIE };
