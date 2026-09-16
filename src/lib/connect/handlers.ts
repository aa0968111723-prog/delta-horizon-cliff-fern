import { cookieName, encryptBundle, providerConfig, stateCookieName, type ProviderId } from "@/lib/connect/oauth";
import { parseCanvaDisplayName } from "@/lib/connect/canva-format";
import { accountsUrl, longLivedTokenUrl, parseIgUser } from "@/lib/connect/instagram-graph";
import { oauthStateMatches, publicOrigin, requestProto } from "@/lib/connect/origin";
import { createPkce, pkceCookieName } from "@/lib/connect/pkce";
import { cookieFromRequest } from "@/lib/connect/tokens";

function providerFromPath(pathname: string): ProviderId | null {
  if (pathname.includes("drive")) return "drive";
  if (pathname.includes("canva")) return "canva";
  if (pathname.includes("instagram")) return "instagram";
  return null;
}

function redirectUri(request: Request, provider: ProviderId) {
  return `${publicOrigin(request)}/api/connect/callback/${provider}`;
}

function cookieHeader(name: string, value: string, maxAge: number, request: Request) {
  const secure = requestProto(request) === "https" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

async function start(request: Request, provider: ProviderId) {
  const cfg = providerConfig(provider);
  if (!cfg.configured || !cfg.authorize) {
    return Response.redirect(`${publicOrigin(request)}/connect?error=not-configured`, 302);
  }
  const state = crypto.randomUUID();
  const authorize = new URL(cfg.authorize);
  authorize.searchParams.set("redirect_uri", redirectUri(request, provider));
  authorize.searchParams.set("state", state);
  if (provider === "canva") {
    const pkce = createPkce();
    authorize.searchParams.set("code_challenge", pkce.challenge);
    authorize.searchParams.set("code_challenge_method", "S256");
    const redirect = Response.redirect(authorize.toString(), 302);
    redirect.headers.append("Set-Cookie", cookieHeader(stateCookieName(provider), state, 600, request));
    redirect.headers.append("Set-Cookie", cookieHeader(pkceCookieName("canva"), pkce.verifier, 600, request));
    return redirect;
  }
  const res = Response.redirect(authorize.toString(), 302);
  res.headers.append("Set-Cookie", cookieHeader(stateCookieName(provider), state, 600, request));
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
  let accountLabel = "Canva";
  try {
    const me = await fetch("https://api.canva.com/rest/v1/users/me", {
      headers: { Authorization: `Bearer ${json.access_token}` },
    });
    if (me.ok) accountLabel = parseCanvaDisplayName(await me.json()) || accountLabel;
  } catch {
    /* keep Canva */
  }
  return {
    provider: "canva" as const,
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
    accountLabel,
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
  let accessToken = json.access_token;
  let expiresAt = Date.now() + (json.expires_in ?? 3600) * 1000;
  try {
    const longLived = await fetch(longLivedTokenUrl({ clientId: id, clientSecret: secret, token: accessToken }));
    if (longLived.ok) {
      const next = (await longLived.json()) as { access_token?: string; expires_in?: number };
      if (next.access_token) {
        accessToken = next.access_token;
        expiresAt = Date.now() + (next.expires_in ?? 60 * 24 * 3600) * 1000;
      }
    }
  } catch {
    /* keep short-lived */
  }
  let accountLabel = "Instagram";
  let igUserId: string | undefined;
  try {
    const accounts = await fetch(accountsUrl(accessToken));
    if (accounts.ok) {
      const ig = parseIgUser(await accounts.json());
      if (ig?.id) igUserId = ig.id;
      if (ig?.username) accountLabel = `@${ig.username}`;
    }
  } catch {
    /* keep Instagram */
  }
  return {
    provider: "instagram" as const,
    accessToken,
    expiresAt,
    accountLabel,
    igUserId,
  };
}

async function callback(request: Request, provider: ProviderId) {
  const origin = publicOrigin(request);
  const url = new URL(request.url);
  const err = url.searchParams.get("error");
  if (err) return Response.redirect(`${origin}/connect?error=${encodeURIComponent(err)}`, 302);
  const expected = cookieFromRequest(request, stateCookieName(provider));
  const state = url.searchParams.get("state");
  if (!oauthStateMatches(expected, state)) {
    return Response.redirect(`${origin}/connect?error=state`, 302);
  }
  const code = url.searchParams.get("code");
  if (!code) return Response.redirect(`${origin}/connect?error=missing-code`, 302);
  const bundle =
    provider === "drive"
      ? await exchangeGoogle(code, request)
      : provider === "canva"
        ? await exchangeCanva(code, request)
        : await exchangeInstagram(code, request);
  if (!bundle) return Response.redirect(`${origin}/connect?error=token`, 302);
  const jwt = await encryptBundle(bundle);
  const res = Response.redirect(`${origin}/connect?ok=${provider}`, 302);
  res.headers.append("Set-Cookie", cookieHeader(cookieName(provider), jwt, 60 * 60 * 24 * 30, request));
  res.headers.append("Set-Cookie", cookieHeader(stateCookieName(provider), "", 0, request));
  if (provider === "canva") {
    res.headers.append("Set-Cookie", cookieHeader(pkceCookieName("canva"), "", 0, request));
  }
  return res;
}

async function revoke(request: Request, provider: ProviderId) {
  const res = Response.redirect(`${publicOrigin(request)}/connect?revoked=${provider}`, 302);
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
