import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import type { ConnectionId } from "@/lib/creative/types";

type TokenBlob = {
  access: string;
  refresh?: string;
  expiry: number;
  account?: string;
  folderId?: string;
  folderName?: string;
};

const COOKIE: Record<ConnectionId, string> = {
  "google-drive": "tkz_c_g",
  canva: "tkz_c_c",
  instagram: "tkz_c_i",
};

function secretKey() {
  const secret = process.env.CONNECT_COOKIE_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!secret) return null;
  return scryptSync(secret, "tkz-connect-v1", 32);
}

function encrypt(plain: string) {
  const key = secretKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

function decrypt(packed: string) {
  const key = secretKey();
  if (!key) return null;
  try {
    const buf = Buffer.from(packed, "base64url");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

function readCookie(name: string, request?: Request) {
  const req = request ?? getRequest();
  if (!req) return null;
  const header = req.headers.get("cookie") ?? "";
  const match = header.split(/;\s*/).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function canStoreTokens() {
  return Boolean(secretKey());
}

export function readProviderTokens(id: ConnectionId): TokenBlob | null {
  const raw = readCookie(COOKIE[id]);
  if (!raw) return null;
  const plain = decrypt(raw);
  if (!plain) return null;
  try {
    const parsed = JSON.parse(plain) as TokenBlob;
    if (!parsed.access) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasProviderTokens(id: ConnectionId) {
  return Boolean(readProviderTokens(id));
}

export function setTokenCookie(id: ConnectionId, blob: TokenBlob) {
  const value = encrypt(JSON.stringify(blob));
  if (!value) return null;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE[id]}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`;
}

export async function persistTokenBlob(id: ConnectionId, blob: TokenBlob) {
  const value = encrypt(JSON.stringify(blob));
  if (!value) return;
  try {
    const { setCookie } = await import("@tanstack/react-start/server");
    setCookie(COOKIE[id], value, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 2592000,
      secure: process.env.NODE_ENV === "production",
    });
  } catch {
    /* request may be outside a server fn */
  }
}

async function refreshBlob(id: ConnectionId, blob: TokenBlob): Promise<TokenBlob | null> {
  if (!blob.refresh) return blob;
  try {
    if (id === "google-drive") {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID ?? "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
          refresh_token: blob.refresh,
          grant_type: "refresh_token",
        }),
      });
      if (!res.ok) return blob;
      const body = (await res.json()) as { access_token: string; expires_in?: number; refresh_token?: string };
      return {
        ...blob,
        access: body.access_token,
        refresh: body.refresh_token ?? blob.refresh,
        expiry: Date.now() + (body.expires_in ?? 3600) * 1000,
      };
    }
    if (id === "canva") {
      const res = await fetch("https://api.canva.com/rest/v1/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.CANVA_CLIENT_ID ?? "",
          client_secret: process.env.CANVA_CLIENT_SECRET ?? "",
          refresh_token: blob.refresh,
          grant_type: "refresh_token",
        }),
      });
      if (!res.ok) return blob;
      const body = (await res.json()) as { access_token: string; expires_in?: number; refresh_token?: string };
      return {
        ...blob,
        access: body.access_token,
        refresh: body.refresh_token ?? blob.refresh,
        expiry: Date.now() + (body.expires_in ?? 3600) * 1000,
      };
    }
    const url = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    url.searchParams.set("grant_type", "fb_exchange_token");
    url.searchParams.set("client_id", process.env.META_APP_ID ?? "");
    url.searchParams.set("client_secret", process.env.META_APP_SECRET ?? "");
    url.searchParams.set("fb_exchange_token", blob.access);
    const res = await fetch(url);
    if (!res.ok) return blob;
    const body = (await res.json()) as { access_token: string; expires_in?: number };
    return { ...blob, access: body.access_token, expiry: Date.now() + (body.expires_in ?? 5184000) * 1000 };
  } catch {
    return blob;
  }
}

export async function readFreshTokens(id: ConnectionId): Promise<TokenBlob | null> {
  const blob = readProviderTokens(id);
  if (!blob) return null;
  if (blob.expiry > Date.now() + 90_000) return blob;
  const next = await refreshBlob(id, blob);
  if (next && next.access !== blob.access) await persistTokenBlob(id, next);
  return next;
}

export function clearTokenCookie(id: ConnectionId) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE[id]}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function setStateCookie(state: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `tkz_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`;
}

export function readStateCookie(request?: Request) {
  return readCookie("tkz_oauth_state", request);
}

export function requestOrigin(request?: Request) {
  const req = request ?? getRequest();
  if (!req) return "";
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}
