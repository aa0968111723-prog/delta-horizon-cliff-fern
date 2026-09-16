import {
  canvaConfigured,
  clearOAuthState,
  clearOAuthTokens,
  publicOrigin,
  readOAuthState,
  readOAuthTokens,
  saveOAuthState,
  saveOAuthTokens,
} from "@/lib/oauth/session.server";
import { pkceChallenge, randomUrlToken } from "@/lib/oauth/crypto";

const CANVA_AUTHORIZE = "https://www.canva.com/api/oauth/authorize";
const CANVA_TOKEN = "https://api.canva.com/rest/v1/oauth/token";
const CANVA_REVOKE = "https://api.canva.com/rest/v1/oauth/revoke";
const CANVA_DESIGNS = "https://api.canva.com/rest/v1/designs";
const CANVA_ME = "https://api.canva.com/rest/v1/users/me";

const SCOPES = [
  "design:meta:read",
  "design:content:read",
  "design:content:write",
  "asset:read",
  "folder:read",
  "profile:read",
].join(" ");

export function canvaRedirectUri(request: Request) {
  return `${publicOrigin(request)}/api/oauth/canva/callback`;
}

export async function canvaAuthorizeUrl(request: Request) {
  const clientId = process.env.CANVA_CLIENT_ID;
  if (!clientId || !canvaConfigured()) return null;
  const verifier = randomUrlToken(32);
  const state = randomUrlToken(16);
  const challenge = await pkceChallenge(verifier);
  await saveOAuthState({ provider: "canva", state, verifier, createdAt: Date.now() });
  const url = new URL(CANVA_AUTHORIZE);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", canvaRedirectUri(request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCanvaCode(request: Request, code: string, state: string) {
  const stored = await readOAuthState();
  await clearOAuthState();
  if (!stored || stored.provider !== "canva" || stored.state !== state || !stored.verifier) {
    throw new Error("invalid-state");
  }
  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("unconfigured");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: canvaRedirectUri(request),
    code_verifier: stored.verifier,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(CANVA_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`canva-token-${res.status}`);
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!json.access_token) throw new Error("canva-token-empty");
  const me = await fetch(CANVA_ME, { headers: { Authorization: `Bearer ${json.access_token}` } });
  let accountName = "Canva";
  if (me.ok) {
    const profile = (await me.json()) as { team_user?: { display_name?: string }; user?: { display_name?: string } };
    accountName = profile.team_user?.display_name || profile.user?.display_name || "Canva";
  }
  await saveOAuthTokens({
    provider: "canva",
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: json.expires_in ? Date.now() + json.expires_in * 1000 : undefined,
    accountName,
  });
}

export type CanvaDesignHit = {
  id: string;
  title: string;
  thumbnail?: string;
  editUrl?: string;
  kind: string;
};

async function canvaAccess(): Promise<string | null> {
  const tokens = await readOAuthTokens("canva");
  return tokens?.accessToken ?? null;
}

export async function searchCanvaDesigns(query: string): Promise<CanvaDesignHit[]> {
  const token = await canvaAccess();
  if (!token) return [];
  const url = new URL(CANVA_DESIGNS);
  url.searchParams.set("query", query);
  url.searchParams.set("ownership", "any");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    items?: { id?: string; title?: string; thumbnail?: { url?: string }; urls?: { edit_url?: string } }[];
  };
  return (json.items ?? []).slice(0, 24).map((item, i) => ({
    id: String(item.id ?? `canva_${i}`),
    title: item.title || "未命名設計",
    thumbnail: item.thumbnail?.url,
    editUrl: item.urls?.edit_url,
    kind: "Canva",
  }));
}

export async function createCanvaDesign(input: {
  title: string;
  preset?: "instagramPost" | "instagramStory" | "instagramReel";
}): Promise<{ editUrl: string; id: string } | null> {
  const token = await canvaAccess();
  if (!token) return null;
  const res = await fetch(CANVA_DESIGNS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: input.title.slice(0, 50),
      design_type: { type: "preset", name: input.preset ?? "instagramPost" },
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { design?: { id?: string; urls?: { edit_url?: string } } };
  const id = json.design?.id;
  const editUrl = json.design?.urls?.edit_url;
  if (!id || !editUrl) return null;
  return { id, editUrl };
}

export async function revokeCanva() {
  const tokens = await readOAuthTokens("canva");
  const secret = process.env.CANVA_CLIENT_SECRET;
  if (tokens?.accessToken && secret) {
    await fetch(CANVA_REVOKE, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token: tokens.accessToken,
        client_secret: secret,
      }),
    }).catch(() => undefined);
  }
  await clearOAuthTokens("canva");
}
