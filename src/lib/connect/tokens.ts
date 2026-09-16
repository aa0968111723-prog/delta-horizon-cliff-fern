import { setCookie } from "@tanstack/react-start/server";
import { getRequest } from "@tanstack/react-start/server";
import { cookieName, decryptBundle, encryptBundle, type ProviderId, type TokenBundle } from "./oauth";
import { requestProto } from "./origin";

export { driveQueryEscape } from "./escape";

export function cookieFromRequest(request: Request | undefined, name: string) {
  const header = request?.headers.get("cookie") ?? "";
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function readBundle(provider: ProviderId): Promise<TokenBundle | null> {
  const request = getRequest();
  const raw = cookieFromRequest(request, cookieName(provider));
  if (!raw) return null;
  return decryptBundle(raw);
}

function secureFromRequest(request: Request | undefined) {
  if (!request) return true;
  try {
    return requestProto(request) === "https";
  } catch {
    return true;
  }
}

export async function writeBundle(bundle: TokenBundle) {
  const request = getRequest();
  const jwt = await encryptBundle(bundle);
  try {
    setCookie(cookieName(bundle.provider), jwt, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      secure: secureFromRequest(request),
    });
  } catch {
    /* preview without request ALS */
  }
}

async function refreshGoogle(bundle: TokenBundle): Promise<TokenBundle | null> {
  if (!bundle.refreshToken) return null;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: bundle.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number; refresh_token?: string };
  if (!json.access_token) return null;
  return {
    ...bundle,
    accessToken: json.access_token,
    refreshToken: json.refresh_token || bundle.refreshToken,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
}

async function refreshCanva(bundle: TokenBundle): Promise<TokenBundle | null> {
  if (!bundle.refreshToken) return null;
  const id = process.env.CANVA_CLIENT_ID ?? "";
  const secret = process.env.CANVA_CLIENT_SECRET ?? "";
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: bundle.refreshToken,
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number; refresh_token?: string };
  if (!json.access_token) return null;
  return {
    ...bundle,
    accessToken: json.access_token,
    refreshToken: json.refresh_token || bundle.refreshToken,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
}

async function refreshInstagram(bundle: TokenBundle): Promise<TokenBundle | null> {
  const id = process.env.INSTAGRAM_CLIENT_ID || process.env.META_APP_ID || "";
  const secret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.META_APP_SECRET || "";
  const url = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", id);
  url.searchParams.set("client_secret", secret);
  url.searchParams.set("fb_exchange_token", bundle.accessToken);
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  return {
    ...bundle,
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 60 * 24 * 3600) * 1000,
  };
}

export async function accessTokenFor(provider: ProviderId): Promise<TokenBundle | null> {
  const bundle = await readBundle(provider);
  if (!bundle?.accessToken) return null;
  const stale = !bundle.expiresAt || bundle.expiresAt < Date.now() + 90_000;
  if (!stale) return bundle;
  const next =
    provider === "drive"
      ? await refreshGoogle(bundle)
      : provider === "canva"
        ? await refreshCanva(bundle)
        : await refreshInstagram(bundle);
  if (!next) return bundle.expiresAt && bundle.expiresAt > Date.now() ? bundle : null;
  await writeBundle(next);
  return next;
}
