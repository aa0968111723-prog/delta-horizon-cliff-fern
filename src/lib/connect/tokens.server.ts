import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import type { ConnectionId } from "@/lib/creative/types";

type TokenBlob = {
  access: string;
  refresh?: string;
  expiry: number;
  account?: string;
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
