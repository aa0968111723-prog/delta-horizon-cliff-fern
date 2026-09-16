import { randomBytes } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import type { ConnectionId } from "@/lib/creative/types";
import { envReady } from "@/lib/connect/providers";
import {
  canStoreTokens,
  clearTokenCookie,
  readStateCookie,
  requestOrigin,
  setStateCookie,
  setTokenCookie,
} from "@/lib/connect/tokens.server";

export const Route = createFileRoute("/api/connect/$")({
  server: {
    handlers: {
      GET: handleConnect,
    },
  },
});

function redirect(location: string, cookies: string[] = []) {
  const headers = new Headers({ Location: location });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

async function handleConnect({ request }: { request: Request }) {
  const url = new URL(request.url);
  const rest = url.pathname.replace(/^\/api\/connect\/?/, "");
  const [providerKey, action] = rest.split("/");
  const provider = fromKey(providerKey);
  if (!provider) return redirect("/connect?notice=unknown");
  if (!envReady(provider) || !canStoreTokens()) {
    return redirect("/connect?notice=memory");
  }
  if (action === "callback") {
    return finishOAuth(provider, url, request);
  }
  if (action === "revoke") {
    return redirect("/connect?notice=revoked", [clearTokenCookie(provider)]);
  }
  return startOAuth(provider, request);
}

function fromKey(key?: string): ConnectionId | null {
  if (key === "google") return "google-drive";
  if (key === "canva") return "canva";
  if (key === "instagram") return "instagram";
  return null;
}

function startOAuth(provider: ConnectionId, request: Request) {
  const origin = requestOrigin(request);
  const state = randomBytes(16).toString("hex");
  const redirectUri = callbackUri(origin, provider);
  if (provider === "google-drive") {
    const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    auth.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID ?? "");
    auth.searchParams.set("redirect_uri", redirectUri);
    auth.searchParams.set("response_type", "code");
    auth.searchParams.set("access_type", "offline");
    auth.searchParams.set("prompt", "consent");
    auth.searchParams.set("scope", "https://www.googleapis.com/auth/drive.readonly");
    auth.searchParams.set("state", state);
    return redirect(auth.toString(), [setStateCookie(state)]);
  }
  if (provider === "canva") {
    const auth = new URL("https://www.canva.com/api/oauth/authorize");
    auth.searchParams.set("client_id", process.env.CANVA_CLIENT_ID ?? "");
    auth.searchParams.set("redirect_uri", redirectUri);
    auth.searchParams.set("response_type", "code");
    auth.searchParams.set("scope", "design:meta:read design:content:read");
    auth.searchParams.set("state", state);
    return redirect(auth.toString(), [setStateCookie(state)]);
  }
  const auth = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  auth.searchParams.set("client_id", process.env.META_APP_ID ?? "");
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "instagram_basic,pages_show_list,instagram_manage_insights");
  auth.searchParams.set("state", state);
  return redirect(auth.toString(), [setStateCookie(state)]);
}

async function finishOAuth(provider: ConnectionId, url: URL, request: Request) {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = readStateCookie(request);
  if (!code || !state || !expected || state !== expected) {
    return redirect("/connect?notice=denied");
  }
  const origin = requestOrigin(request);
  const redirectUri = callbackUri(origin, provider);
  try {
    const blob = await exchange(provider, code, redirectUri);
    const cookie = setTokenCookie(provider, blob);
    if (!cookie) return redirect("/connect?notice=memory");
    return redirect(`/connect?ok=${provider}`, [cookie]);
  } catch {
    return redirect("/connect?notice=denied");
  }
}

function callbackUri(origin: string, provider: ConnectionId) {
  const key = provider === "google-drive" ? "google" : provider;
  return `${origin}/api/connect/${key}/callback`;
}

async function exchange(provider: ConnectionId, code: string, redirectUri: string) {
  if (provider === "google-drive") {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) throw new Error("google");
    const body = (await res.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
    return {
      access: body.access_token,
      refresh: body.refresh_token,
      expiry: Date.now() + (body.expires_in ?? 3600) * 1000,
      account: "Google Drive",
    };
  }
  if (provider === "canva") {
    const res = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.CANVA_CLIENT_ID ?? "",
        client_secret: process.env.CANVA_CLIENT_SECRET ?? "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) throw new Error("canva");
    const body = (await res.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
    return {
      access: body.access_token,
      refresh: body.refresh_token,
      expiry: Date.now() + (body.expires_in ?? 3600) * 1000,
      account: "Canva",
    };
  }
  const meta = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  meta.searchParams.set("client_id", process.env.META_APP_ID ?? "");
  meta.searchParams.set("client_secret", process.env.META_APP_SECRET ?? "");
  meta.searchParams.set("redirect_uri", redirectUri);
  meta.searchParams.set("code", code);
  const ig = await fetch(meta);
  if (!ig.ok) throw new Error("instagram");
  const body = (await ig.json()) as { access_token: string; expires_in?: number };
  return {
    access: body.access_token,
    expiry: Date.now() + (body.expires_in ?? 3600) * 1000,
    account: "Instagram",
  };
}
