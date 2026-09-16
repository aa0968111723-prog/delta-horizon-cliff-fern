import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { PROVIDERS, type ProviderId, type ProviderSpec } from "./providers";
import {
  canStoreTokens,
  readConnection,
  writeConnection,
  type ConnectionSession,
} from "./token-store.server";

/**
 * 官方 OAuth 握手。token 只在伺服器端交換與保存。
 * 這個檔案有 `.server` 後綴，不會被打包進瀏覽器。
 */

const STATE_COOKIE = "zen_oauth_flow";
const STATE_MAX_AGE = 60 * 10;

export type OAuthFlow = {
  provider: ProviderId;
  verifier: string;
  nonce: string;
  createdAt: number;
};

function isProviderId(value: string): value is ProviderId {
  return value === "drive" || value === "canva" || value === "instagram";
}

export function parseProviderId(value: string | undefined): ProviderId | null {
  return value && isProviderId(value) ? value : null;
}

export function publicOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwarded = request.headers.get("x-forwarded-host");
  const proto =
    request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "") || "https";
  if (forwarded) return `${proto}://${forwarded.split(",")[0]!.trim()}`;
  return url.origin;
}

export function callbackUrl(request: Request): string {
  return `${publicOrigin(request)}/api/connections/callback`;
}

export function connectionsUrl(request: Request, search: Record<string, string | undefined>): string {
  const url = new URL("/connections", publicOrigin(request));
  for (const [key, value] of Object.entries(search)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

export function redirectTo(url: string): Response {
  return new Response(null, { status: 302, headers: { Location: url } });
}

function encryptionKey(): Buffer | null {
  const secret =
    process.env.CONNECTION_ENCRYPTION_KEY ??
    process.env.BETTER_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    null;
  if (!secret) return null;
  return createHash("sha256").update(secret).digest();
}

function encryptPayload(payload: string): string | null {
  const key = encryptionKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

function decryptPayload(raw: string): string | null {
  const key = encryptionKey();
  if (!key) return null;
  const [ivPart, tagPart, dataPart] = raw.split(".");
  if (!ivPart || !tagPart || !dataPart) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataPart, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

function pkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

function writeFlow(flow: OAuthFlow): boolean {
  const payload = encryptPayload(JSON.stringify(flow));
  if (!payload) return false;
  try {
    setCookie(STATE_COOKIE, payload, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: STATE_MAX_AGE,
    });
    return true;
  } catch {
    return false;
  }
}

function readFlow(): OAuthFlow | null {
  try {
    const raw = getCookie(STATE_COOKIE);
    if (!raw) return null;
    const json = decryptPayload(raw);
    if (!json) return null;
    const parsed = JSON.parse(json) as OAuthFlow;
    if (!isProviderId(parsed.provider) || !parsed.nonce) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearFlow(): void {
  try {
    setCookie(STATE_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  } catch {
    // ignore
  }
}

export function providerConfigured(id: ProviderId): boolean {
  const spec = PROVIDERS[id];
  return Boolean(process.env[spec.envKeys.clientId] && process.env[spec.envKeys.clientSecret]);
}

export function startOAuth(request: Request, id: ProviderId): Response {
  if (!providerConfigured(id)) {
    return redirectTo(connectionsUrl(request, { focus: id, status: "unconfigured" }));
  }
  if (!canStoreTokens()) {
    return redirectTo(connectionsUrl(request, { focus: id, status: "no-secret" }));
  }
  const spec = PROVIDERS[id];
  const { verifier, challenge } = pkce();
  const nonce = randomBytes(16).toString("base64url");
  if (!writeFlow({ provider: id, verifier, nonce, createdAt: Date.now() })) {
    return redirectTo(connectionsUrl(request, { focus: id, status: "no-secret" }));
  }

  const clientId = process.env[spec.envKeys.clientId]!;
  const authorize = new URL(spec.authorizeUrl);
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", callbackUrl(request));
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("state", `${id}.${nonce}`);
  authorize.searchParams.set("scope", spec.scopes.join(" "));

  if (id === "drive") {
    authorize.searchParams.set("access_type", "offline");
    authorize.searchParams.set("prompt", "consent");
    authorize.searchParams.set("code_challenge", challenge);
    authorize.searchParams.set("code_challenge_method", "S256");
  } else if (id === "canva") {
    authorize.searchParams.set("code_challenge", challenge);
    authorize.searchParams.set("code_challenge_method", "S256");
  }

  return redirectTo(authorize.toString());
}

export async function handleOAuthCallback(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";
  const [providerPart, nonce] = state.split(".");
  const provider = parseProviderId(providerPart ?? "");

  if (error) {
    return redirectTo(connectionsUrl(request, { status: "denied", focus: provider ?? undefined }));
  }
  if (!code || !provider || !nonce) {
    return redirectTo(connectionsUrl(request, { status: "invalid" }));
  }

  const flow = readFlow();
  clearFlow();
  if (!flow || flow.provider !== provider || flow.nonce !== nonce) {
    return redirectTo(connectionsUrl(request, { focus: provider, status: "invalid" }));
  }

  const spec = PROVIDERS[provider];
  const clientId = process.env[spec.envKeys.clientId];
  const clientSecret = process.env[spec.envKeys.clientSecret];
  if (!clientId || !clientSecret) {
    return redirectTo(connectionsUrl(request, { focus: provider, status: "unconfigured" }));
  }

  const tokens = await exchangeCode(spec, {
    code,
    clientId,
    clientSecret,
    redirectUri: callbackUrl(request),
    verifier: flow.verifier,
  });
  if (!tokens) {
    return redirectTo(connectionsUrl(request, { focus: provider, status: "token-failed" }));
  }

  const accountLabel = await fetchAccountLabel(provider, tokens.accessToken);
  const saved = writeConnection({
    provider,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    accountLabel,
    lastSyncedAt: null,
  });
  if (!saved) {
    return redirectTo(connectionsUrl(request, { focus: provider, status: "no-secret" }));
  }
  return redirectTo(connectionsUrl(request, { focus: provider, status: "connected" }));
}

type TokenBundle = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
};

async function exchangeCode(
  spec: ProviderSpec,
  input: { code: string; clientId: string; clientSecret: string; redirectUri: string; verifier: string },
): Promise<TokenBundle | null> {
  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      client_id: input.clientId,
      client_secret: input.clientSecret,
      redirect_uri: input.redirectUri,
    });
    if (spec.id === "drive" || spec.id === "canva") {
      body.set("code_verifier", input.verifier);
    }
    const res = await fetch(spec.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    if (!json.access_token) return null;
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? null,
      expiresAt: json.expires_in ? Date.now() + json.expires_in * 1000 : null,
    };
  } catch {
    return null;
  }
}

async function fetchAccountLabel(provider: ProviderId, accessToken: string): Promise<string | null> {
  try {
    if (provider === "drive") {
      const res = await fetch("https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return "Google Drive";
      const json = (await res.json()) as { user?: { displayName?: string; emailAddress?: string } };
      return json.user?.emailAddress || json.user?.displayName || "Google Drive";
    }
    if (provider === "canva") {
      const res = await fetch("https://api.canva.com/rest/v1/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return "Canva";
      const json = (await res.json()) as { user?: { display_name?: string } };
      return json.user?.display_name || "Canva";
    }
    const res = await fetch("https://graph.facebook.com/v21.0/me?fields=name", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return "Instagram";
    const json = (await res.json()) as { name?: string };
    return json.name || "Instagram";
  } catch {
    return PROVIDERS[provider].name;
  }
}

export async function getAccessToken(provider: ProviderId): Promise<string | null> {
  const session = readConnection(provider);
  if (!session) return null;
  if (session.expiresAt && session.expiresAt > Date.now() + 60_000) return session.accessToken;
  if (!session.refreshToken) return session.accessToken;
  const spec = PROVIDERS[provider];
  const clientId = process.env[spec.envKeys.clientId];
  const clientSecret = process.env[spec.envKeys.clientSecret];
  if (!clientId || !clientSecret) return session.accessToken;
  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });
    const res = await fetch(spec.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
    });
    if (!res.ok) return session.accessToken;
    const json = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
    if (!json.access_token) return session.accessToken;
    const next: ConnectionSession = {
      ...session,
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? session.refreshToken,
      expiresAt: json.expires_in ? Date.now() + json.expires_in * 1000 : session.expiresAt,
    };
    writeConnection(next);
    return next.accessToken;
  } catch {
    return session.accessToken;
  }
}
