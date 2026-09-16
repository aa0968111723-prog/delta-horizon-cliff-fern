import { deleteCookie, getCookie, getRequest, getRequestProtocol, setCookie } from "@tanstack/react-start/server";
import { decryptSecret, encryptSecret, parseJsonObject } from "./secret-box.ts";

export type OAuthTokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
};

export type PkceSession = {
  verifier: string;
  state: string;
  createdAt: number;
  scopes?: string;
};

function cookieOptions(maxAge: number) {
  const secure = getRequestProtocol({ xForwardedProto: true }) === "https";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function readEncryptedCookie<T extends Record<string, unknown>>(
  name: string,
  secret: string | undefined,
  salt: string,
): T | null {
  if (!secret) return null;
  const payload = getCookie(name);
  if (!payload) return null;
  try {
    const json = decryptSecret(payload, secret, salt);
    return parseJsonObject(json) as T | null;
  } catch {
    return null;
  }
}

export function writeEncryptedCookie(
  name: string,
  value: Record<string, unknown>,
  secret: string,
  salt: string,
  maxAge: number,
) {
  setCookie(name, encryptSecret(JSON.stringify(value), secret, salt), cookieOptions(maxAge));
}

export function clearAuthCookie(name: string) {
  deleteCookie(name, { path: "/" });
}

export function readPkce(name: string, secret: string | undefined, salt: string): PkceSession | null {
  const session = readEncryptedCookie<PkceSession>(name, secret, salt);
  if (!session?.verifier || !session.state) return null;
  if (Date.now() - session.createdAt > 12 * 60 * 1000) return null;
  return session;
}

export function writePkce(name: string, session: PkceSession, secret: string, salt: string) {
  writeEncryptedCookie(name, session, secret, salt, 12 * 60);
}

export function readTokenSet(name: string, secret: string | undefined, salt: string): OAuthTokenSet | null {
  const token = readEncryptedCookie<OAuthTokenSet>(name, secret, salt);
  if (!token?.accessToken) return null;
  return {
    accessToken: token.accessToken,
    refreshToken: typeof token.refreshToken === "string" ? token.refreshToken : "",
    expiresAt: typeof token.expiresAt === "number" ? token.expiresAt : 0,
    scope: typeof token.scope === "string" ? token.scope : "",
  };
}

export function writeTokenSet(name: string, token: OAuthTokenSet, secret: string, salt: string) {
  writeEncryptedCookie(name, token, secret, salt, 60 * 60 * 24 * 60);
}

export function currentRequest() {
  try {
    return getRequest() ?? null;
  } catch {
    return null;
  }
}
