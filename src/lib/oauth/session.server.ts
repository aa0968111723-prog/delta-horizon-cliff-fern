import { decryptJson, encryptJson } from "./crypto";

export type OAuthProvider = "canva" | "instagram";

export type OAuthTokenSet = {
  provider: OAuthProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  accountName?: string;
  accountId?: string;
};

export type OAuthState = {
  provider: OAuthProvider;
  state: string;
  verifier?: string;
  createdAt: number;
};

const COOKIE: Record<OAuthProvider, string> = {
  canva: "tkuzc_oauth_canva",
  instagram: "tkuzc_oauth_ig",
};

const STATE_COOKIE = "tkuzc_oauth_state";

export function cookieSecret(): string | null {
  const parts = [
    process.env.OAUTH_COOKIE_SECRET,
    process.env.CANVA_CLIENT_SECRET,
    process.env.META_APP_SECRET,
  ].filter((v): v is string => Boolean(v));
  return parts.length ? parts.join(":") : null;
}

export function publicOrigin(request: Request) {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

async function readCookie(name: string): Promise<string | undefined> {
  const { getCookie } = await import("@tanstack/react-start/server");
  return getCookie(name);
}

async function writeCookie(name: string, value: string, maxAge: number) {
  const { setCookie } = await import("@tanstack/react-start/server");
  setCookie(name, value, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    maxAge,
  });
}

async function expireCookie(name: string) {
  const { setCookie } = await import("@tanstack/react-start/server");
  setCookie(name, "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    maxAge: 0,
  });
}

export async function saveOAuthTokens(tokens: OAuthTokenSet) {
  const secret = cookieSecret();
  if (!secret) throw new Error("missing-oauth-secret");
  const sealed = await encryptJson(
    {
      provider: tokens.provider,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      accountName: tokens.accountName,
      accountId: tokens.accountId,
    },
    secret,
  );
  await writeCookie(COOKIE[tokens.provider], sealed, 60 * 60 * 24 * 30);
}

export async function readOAuthTokens(provider: OAuthProvider): Promise<OAuthTokenSet | null> {
  const secret = cookieSecret();
  if (!secret) return null;
  const raw = await readCookie(COOKIE[provider]);
  if (!raw) return null;
  const parsed = await decryptJson<OAuthTokenSet>(raw, secret);
  if (!parsed?.accessToken) return null;
  return parsed;
}

export async function clearOAuthTokens(provider: OAuthProvider) {
  await expireCookie(COOKIE[provider]);
}

export async function saveOAuthState(state: OAuthState) {
  const secret = cookieSecret();
  if (!secret) throw new Error("missing-oauth-secret");
  const sealed = await encryptJson(state, secret);
  await writeCookie(STATE_COOKIE, sealed, 60 * 10);
}

export async function readOAuthState(): Promise<OAuthState | null> {
  const secret = cookieSecret();
  if (!secret) return null;
  const raw = await readCookie(STATE_COOKIE);
  if (!raw) return null;
  return decryptJson<OAuthState>(raw, secret);
}

export async function clearOAuthState() {
  await expireCookie(STATE_COOKIE);
}

export function canvaConfigured() {
  return Boolean(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET);
}

export function instagramConfigured() {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export async function oauthPublicStatus() {
  const canva = await readOAuthTokens("canva");
  const instagram = await readOAuthTokens("instagram");
  return {
    canva: {
      configured: canvaConfigured(),
      connected: Boolean(canva),
      accountName: canva?.accountName ?? null,
    },
    instagram: {
      configured: instagramConfigured(),
      connected: Boolean(instagram),
      accountName: instagram?.accountName ?? null,
    },
  };
}
