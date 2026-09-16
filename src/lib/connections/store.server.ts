import { getCookie, getRequest, setCookie } from "@tanstack/react-start/server";
import type { ConnectionProvider } from "@/lib/studio/types";
import { PROVIDERS } from "./providers";

/**
 * Token 存放：server-side 加密（AES-256-GCM）後放在 httpOnly cookie，
 * 前端永遠拿不到明文；可 refresh、可 revoke。單人產品不需要多使用者資料表。
 */

export type StoredToken = {
  accessToken: string;
  refreshToken: string | null;
  /** epoch ms；null = 不會過期 / 未知。 */
  expiresAt: number | null;
  scope: string;
  accountLabel: string | null;
  /** Drive 主要資料夾、IG 使用者 id 等 provider 專屬設定。 */
  meta: Record<string, string>;
  connectedAt: number;
  lastSyncAt: number | null;
  itemCount: number;
};

const COOKIE_PREFIX = "zen_conn_";
const STATE_COOKIE = "zen_conn_state";
const ONE_YEAR = 60 * 60 * 24 * 365;

function encoder() {
  return new TextEncoder();
}

let devKeyCache: Promise<CryptoKey> | null = null;

async function key(): Promise<CryptoKey> {
  const secret = process.env.CONNECTIONS_SECRET || process.env.BETTER_AUTH_SECRET;
  if (secret) {
    const digest = await crypto.subtle.digest("SHA-256", encoder().encode(secret));
    return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
  }
  // 沒有設定 secret（本機預覽）：用這個 process 的隨機金鑰，重啟即失效，不會外洩。
  devKeyCache ??= crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  return devKeyCache;
}

function toB64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}
function fromB64(s: string) {
  return new Uint8Array(Buffer.from(s, "base64url"));
}

export async function seal(value: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = encoder().encode(JSON.stringify(value));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), data));
  return `${toB64(iv)}.${toB64(cipher)}`;
}

export async function unseal<T>(sealed: string): Promise<T | null> {
  try {
    const [ivB64, cipherB64] = sealed.split(".");
    if (!ivB64 || !cipherB64) return null;
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(ivB64) }, await key(), fromB64(cipherB64));
    return JSON.parse(new TextDecoder().decode(plain)) as T;
  } catch {
    return null;
  }
}

function cookieName(provider: ConnectionProvider) {
  return `${COOKIE_PREFIX}${provider}`;
}

function secure() {
  const req = getRequest();
  const proto = req?.headers.get("x-forwarded-proto") ?? (req ? new URL(req.url).protocol.replace(":", "") : "https");
  return proto === "https";
}

export async function readToken(provider: ConnectionProvider): Promise<StoredToken | null> {
  const raw = getCookie(cookieName(provider));
  if (!raw) return null;
  return unseal<StoredToken>(raw);
}

export async function writeToken(provider: ConnectionProvider, token: StoredToken): Promise<void> {
  setCookie(cookieName(provider), await seal(token), {
    path: "/",
    httpOnly: true,
    secure: secure(),
    sameSite: "lax",
    maxAge: ONE_YEAR,
  });
}

export function clearToken(provider: ConnectionProvider): void {
  setCookie(cookieName(provider), "", { path: "/", httpOnly: true, secure: secure(), sameSite: "lax", maxAge: 0 });
}

/* ---------------- OAuth state / PKCE ---------------- */

export type OauthState = { provider: ConnectionProvider; state: string; verifier: string | null; returnTo: string };

export async function writeOauthState(value: OauthState) {
  setCookie(STATE_COOKIE, await seal(value), { path: "/", httpOnly: true, secure: secure(), sameSite: "lax", maxAge: 600 });
}

export async function readOauthState(): Promise<OauthState | null> {
  const raw = getCookie(STATE_COOKIE);
  if (!raw) return null;
  return unseal<OauthState>(raw);
}

export function clearOauthState() {
  setCookie(STATE_COOKIE, "", { path: "/", httpOnly: true, secure: secure(), sameSite: "lax", maxAge: 0 });
}

export function randomToken(bytes = 32) {
  return toB64(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function pkceChallenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder().encode(verifier));
  return toB64(new Uint8Array(digest));
}

/* ---------------- Config helpers ---------------- */

export function providerCredentials(provider: ConnectionProvider): { clientId: string; clientSecret: string } | null {
  const meta = PROVIDERS[provider];
  const clientId = process.env[meta.env.clientId];
  const clientSecret = process.env[meta.env.clientSecret];
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function publicOrigin(request: Request): string {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

export function redirectUri(request: Request, provider: ConnectionProvider) {
  return `${publicOrigin(request)}/api/connections/${provider}/callback`;
}

/* ---------------- Refresh ---------------- */

export async function getAccessToken(provider: ConnectionProvider): Promise<{ token: StoredToken; accessToken: string } | null> {
  const token = await readToken(provider);
  if (!token) return null;
  const soon = Date.now() + 60_000;
  if (!token.expiresAt || token.expiresAt > soon) return { token, accessToken: token.accessToken };
  const refreshed = await refreshToken(provider, token);
  if (!refreshed) return null;
  await writeToken(provider, refreshed);
  return { token: refreshed, accessToken: refreshed.accessToken };
}

async function refreshToken(provider: ConnectionProvider, token: StoredToken): Promise<StoredToken | null> {
  const creds = providerCredentials(provider);
  try {
    if (provider === "instagram") {
      // 長效 token：60 天，可用 ig_refresh_token 續期，不需 secret。
      const res = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token.accessToken)}`);
      if (!res.ok) return null;
      const body = (await res.json()) as { access_token: string; expires_in: number };
      return { ...token, accessToken: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
    }
    if (!creds || !token.refreshToken) return null;
    const meta = PROVIDERS[provider];
    const params = new URLSearchParams({ grant_type: "refresh_token", refresh_token: token.refreshToken });
    const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
    if (provider === "canva") {
      headers.Authorization = `Basic ${Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64")}`;
    } else {
      params.set("client_id", creds.clientId);
      params.set("client_secret", creds.clientSecret);
    }
    const res = await fetch(meta.tokenUrl, { method: "POST", headers, body: params });
    if (!res.ok) return null;
    const body = (await res.json()) as { access_token: string; refresh_token?: string; expires_in?: number; scope?: string };
    return {
      ...token,
      accessToken: body.access_token,
      refreshToken: body.refresh_token ?? token.refreshToken,
      expiresAt: body.expires_in ? Date.now() + body.expires_in * 1000 : token.expiresAt,
      scope: body.scope ?? token.scope,
    };
  } catch {
    return null;
  }
}

/* ---------------- Revoke ---------------- */

export async function revokeRemote(provider: ConnectionProvider, token: StoredToken): Promise<void> {
  const meta = PROVIDERS[provider];
  if (!meta.revokeUrl) return;
  const creds = providerCredentials(provider);
  try {
    if (provider === "drive") {
      await fetch(`${meta.revokeUrl}?token=${encodeURIComponent(token.refreshToken ?? token.accessToken)}`, { method: "POST" });
    } else if (provider === "canva" && creds) {
      await fetch(meta.revokeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64")}`,
        },
        body: new URLSearchParams({ token: token.refreshToken ?? token.accessToken }),
      });
    }
  } catch {
    /* 遠端撤銷失敗也照樣清掉本地 token */
  }
}
