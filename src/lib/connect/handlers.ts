import { cookieName, encryptBundle, providerConfig, type ProviderId } from "@/lib/connect/oauth";
import { createPkce, pkceCookieName } from "@/lib/connect/pkce";
import { cookieFromRequest } from "@/lib/connect/tokens";

function providerFromPath(pathname: string): ProviderId | null {
  if (pathname.includes("drive")) return "drive";
  if (pathname.includes("canva")) return "canva";
  if (pathname.includes("instagram")) return "instagram";
  return null;
}

function originOf(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function redirectUri(request: Request, provider: ProviderId) {
  return `${originOf(request)}/api/connect/callback/${provider}`;
}

function cookieHeader(name: string, value: string, maxAge: number, request: Request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

async function start(request: Request, provider: ProviderId) {
  const cfg = providerConfig(provider);
  if (!cfg.configured || !cfg.authorize) {
    return Response.redirect(`${originOf(request)}/connect?error=not-configured`, 302);
  }
  const state = crypto.randomUUID();
  const authorize = new URL(cfg.authorize);
  authorize.searchParams.set("redirect_uri", redirectUri(request, provider));
  authorize.searchParams.set("state", state);
  const res = Response.redirect(authorize.toString(), 302);
  res.headers.append("Set-Cookie", cookieHeader(`zen_oauth_state_${provider}`, state, 600, request));
  if (provider === "canva") {
    const pkce = createPkce();
    authorize.searchParams.set("code_challenge", pkce.challenge);
    authorize.searchParams.set("code_challenge_method", "S256");
    const redirect = Response.redirect(authorize.toString(), 302);
    redirect.headers.append("Set-Cookie", cookieHeader(`zen_oauth_state_${provider}`, state, 600, request));
    redirect.headers.append("Set-Cookie", cookieHeader(pkceCookieName("canva"), pkce.verifier, 600, request));
    return redirect;
  }
  return res;
}

async function exchangeGoogle(code: string, request: Request) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirect_uri: redirectUri(request, "drive"),
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  const me = await fetch("https://www.googleapis.com/drive/v3/about?fields=user", {
    headers: { Authorization: `Bearer ${json.access_token}` },
  });
  const about = me.ok ? ((await me.json()) as { user?: { emailAddress?: string; displayName?: string } }) : {};
  return {
    provider: "drive" as const,
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
    accountLabel: about.user?.emailAddress || about.user?.displayName || "Google Drive",
  };
}

async function exchangeCanva(code: string, request: Request) {
  const id = process.env.CANVA_CLIENT_ID ?? "";
  const secret = process.env.CANVA_CLIENT_SECRET ?? "";
  const verifier = cookieFromRequest(request, pkceCookieName("canva")) ?? "";
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri(request, "canva"),
    code_verifier: verifier,
  });
  const res = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
    },
    body,
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  return {
    provider: "canva" as const,
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
    accountLabel: "Canva",
  };
}

async function exchangeInstagram(code: string, request: Request) {
  const id = process.env.INSTAGRAM_CLIENT_ID || process.env.META_APP_ID || "";
  const secret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.META_APP_SECRET || "";
  const body = new URLSearchParams({
    code,
    client_id: id,
    client_secret: secret,
    redirect_uri: redirectUri(request, "instagram"),
    grant_type: "authorization_code",
  });
  const res = await fetch("https://graph.facebook.com/v21.0/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  return {
    provider: "instagram" as const,
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
    accountLabel: "Instagram",
  };
}

async function callback(request: Request, provider: ProviderId) {
  const url = new URL(request.url);
  const err = url.searchParams.get("error");
  if (err) return Response.redirect(`${originOf(request)}/connect?error=${encodeURIComponent(err)}`, 302);
  const code = url.searchParams.get("code");
  if (!code) return Response.redirect(`${originOf(request)}/connect?error=missing-code`, 302);
  const bundle =
    provider === "drive"
      ? await exchangeGoogle(code, request)
      : provider === "canva"
        ? await exchangeCanva(code, request)
        : await exchangeInstagram(code, request);
  if (!bundle) return Response.redirect(`${originOf(request)}/connect?error=token`, 302);
  const jwt = await encryptBundle(bundle);
  const res = Response.redirect(`${originOf(request)}/connect?ok=${provider}`, 302);
  res.headers.append("Set-Cookie", cookieHeader(cookieName(provider), jwt, 60 * 60 * 24 * 30, request));
  if (provider === "canva") {
    res.headers.append("Set-Cookie", cookieHeader(pkceCookieName("canva"), "", 0, request));
  }
  return res;
}

async function revoke(request: Request, provider: ProviderId) {
  const res = Response.redirect(`${originOf(request)}/connect?revoked=${provider}`, 302);
  res.headers.append("Set-Cookie", cookieHeader(cookieName(provider), "", 0, request));
  return res;
}

export async function handleConnect(request: Request) {
  const url = new URL(request.url);
  const provider = providerFromPath(url.pathname);
  if (!provider) return new Response("Not found", { status: 404 });
  if (url.pathname.includes("/start/")) return start(request, provider);
  if (url.pathname.includes("/callback/")) return callback(request, provider);
  if (url.pathname.includes("/revoke/")) return revoke(request, provider);
  return new Response("Not found", { status: 404 });
}
