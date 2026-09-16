import type { ConnectionProvider } from "@/lib/studio/types";
import { PROVIDERS } from "./providers";
import {
  type OauthState,
  pkceChallenge,
  providerCredentials,
  publicOrigin,
  randomToken,
  redirectUri,
  seal,
  type StoredToken,
  unseal,
} from "./store.server";

const STATE_COOKIE = "zen_conn_state";

function cookie(name: string, value: string, opts: { maxAge: number; secure: boolean }) {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${opts.maxAge}${opts.secure ? "; Secure" : ""}`;
}

function isSecure(request: Request) {
  return publicOrigin(request).startsWith("https://");
}

function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

function redirect(location: string, cookies: string[] = []) {
  const headers = new Headers({ Location: location });
  for (const c of cookies) headers.append("Set-Cookie", c);
  return new Response(null, { status: 302, headers });
}

/** GET /api/connections/:provider/start — 導到官方授權頁。 */
export async function startOauth(request: Request, provider: ConnectionProvider): Promise<Response> {
  const origin = publicOrigin(request);
  const creds = providerCredentials(provider);
  if (!creds) return redirect(`${origin}/connections?error=unconfigured&provider=${provider}`);

  const meta = PROVIDERS[provider];
  const state = randomToken(16);
  const verifier = meta.pkce ? randomToken(48) : null;
  const returnTo = new URL(request.url).searchParams.get("returnTo") ?? "/connections";

  const params = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: redirectUri(request, provider),
    response_type: "code",
    state,
  });
  if (provider === "drive") {
    params.set("scope", meta.scopes.join(" "));
    params.set("access_type", "offline");
    params.set("prompt", "consent");
    params.set("include_granted_scopes", "true");
  } else if (provider === "canva") {
    params.set("scope", meta.scopes.join(" "));
    params.set("code_challenge_method", "S256");
    params.set("code_challenge", await pkceChallenge(verifier!));
  } else {
    params.set("scope", meta.scopes.join(","));
    params.set("enable_fb_login", "0");
    params.set("force_authentication", "1");
  }

  const stateValue: OauthState = { provider, state, verifier, returnTo };
  return redirect(`${meta.authorizeUrl}?${params.toString()}`, [cookie(STATE_COOKIE, await seal(stateValue), { maxAge: 600, secure: isSecure(request) })]);
}

/** GET /api/connections/:provider/callback — 換 token、加密存 cookie、回 /connections。 */
export async function finishOauth(request: Request, provider: ConnectionProvider): Promise<Response> {
  const origin = publicOrigin(request);
  const url = new URL(request.url);
  const secure = isSecure(request);
  const clearState = cookie(STATE_COOKIE, "", { maxAge: 0, secure });
  const fail = (code: string) => redirect(`${origin}/connections?error=${code}&provider=${provider}`, [clearState]);

  if (url.searchParams.get("error")) return fail("denied");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const rawState = readCookie(request, STATE_COOKIE);
  const saved = rawState ? await unseal<OauthState>(decodeURIComponent(rawState)) : null;
  if (!code || !state || !saved || saved.state !== state || saved.provider !== provider) return fail("state");

  const creds = providerCredentials(provider);
  if (!creds) return fail("unconfigured");
  const meta = PROVIDERS[provider];
  const redirect_uri = redirectUri(request, provider);

  try {
    let token: StoredToken;
    if (provider === "instagram") {
      const shortRes = await fetch(meta.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: creds.clientId, client_secret: creds.clientSecret, grant_type: "authorization_code", redirect_uri, code }),
      });
      if (!shortRes.ok) return fail("exchange");
      const short = (await shortRes.json()) as { access_token: string; user_id?: string | number; permissions?: string[] };
      const longRes = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(creds.clientSecret)}&access_token=${encodeURIComponent(short.access_token)}`,
      );
      const long = longRes.ok ? ((await longRes.json()) as { access_token: string; expires_in: number }) : null;
      const profileRes = await fetch(`https://graph.instagram.com/v21.0/me?fields=id,username,name,media_count&access_token=${encodeURIComponent(long?.access_token ?? short.access_token)}`);
      const profile = profileRes.ok ? ((await profileRes.json()) as { id: string; username?: string; media_count?: number }) : null;
      token = {
        accessToken: long?.access_token ?? short.access_token,
        refreshToken: null,
        expiresAt: long ? Date.now() + long.expires_in * 1000 : Date.now() + 3600 * 1000,
        scope: (short.permissions ?? meta.scopes).join(","),
        accountLabel: profile?.username ? `@${profile.username}` : null,
        meta: { userId: String(profile?.id ?? short.user_id ?? "") },
        connectedAt: Date.now(),
        lastSyncAt: null,
        itemCount: profile?.media_count ?? 0,
      };
    } else {
      const params = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri });
      const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
      if (provider === "canva") {
        params.set("code_verifier", saved.verifier ?? "");
        headers.Authorization = `Basic ${Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64")}`;
      } else {
        params.set("client_id", creds.clientId);
        params.set("client_secret", creds.clientSecret);
      }
      const res = await fetch(meta.tokenUrl, { method: "POST", headers, body: params });
      if (!res.ok) return fail("exchange");
      const body = (await res.json()) as { access_token: string; refresh_token?: string; expires_in?: number; scope?: string };
      const accountLabel = await fetchAccountLabel(provider, body.access_token);
      token = {
        accessToken: body.access_token,
        refreshToken: body.refresh_token ?? null,
        expiresAt: body.expires_in ? Date.now() + body.expires_in * 1000 : null,
        scope: body.scope ?? meta.scopes.join(" "),
        accountLabel,
        meta: {},
        connectedAt: Date.now(),
        lastSyncAt: null,
        itemCount: 0,
      };
    }
    const sealed = await seal(token);
    return redirect(`${origin}${saved.returnTo.startsWith("/") ? saved.returnTo : "/connections"}?connected=${provider}`, [
      clearState,
      cookie(`zen_conn_${provider}`, sealed, { maxAge: 60 * 60 * 24 * 365, secure }),
    ]);
  } catch {
    return fail("exchange");
  }
}

async function fetchAccountLabel(provider: ConnectionProvider, accessToken: string): Promise<string | null> {
  try {
    if (provider === "drive") {
      const res = await fetch("https://www.googleapis.com/drive/v3/about?fields=user(emailAddress,displayName)", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { user?: { emailAddress?: string; displayName?: string } };
      return body.user?.emailAddress ?? body.user?.displayName ?? null;
    }
    if (provider === "canva") {
      const res = await fetch("https://api.canva.com/rest/v1/users/me/profile", { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) return null;
      const body = (await res.json()) as { profile?: { display_name?: string } };
      return body.profile?.display_name ?? null;
    }
  } catch {
    /* ignore */
  }
  return null;
}
