import {
  clearOAuthState,
  clearOAuthTokens,
  instagramConfigured,
  publicOrigin,
  readOAuthState,
  readOAuthTokens,
  saveOAuthState,
  saveOAuthTokens,
} from "@/lib/oauth/session.server";
import { randomUrlToken } from "@/lib/oauth/crypto";

const SCOPES = ["instagram_business_basic", "instagram_business_manage_insights"].join(",");

export function instagramRedirectUri(request: Request) {
  return `${publicOrigin(request)}/api/oauth/instagram/callback`;
}

export async function instagramAuthorizeUrl(request: Request) {
  const clientId = process.env.META_APP_ID;
  if (!clientId || !instagramConfigured()) return null;
  const state = randomUrlToken(16);
  await saveOAuthState({ provider: "instagram", state, createdAt: Date.now() });
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", instagramRedirectUri(request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeInstagramCode(request: Request, code: string, state: string) {
  const stored = await readOAuthState();
  await clearOAuthState();
  if (!stored || stored.provider !== "instagram" || stored.state !== state) {
    throw new Error("invalid-state");
  }
  const clientId = process.env.META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;
  if (!clientId || !clientSecret) throw new Error("unconfigured");
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: instagramRedirectUri(request),
    code,
  });
  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`ig-token-${res.status}`);
  const json = (await res.json()) as {
    access_token?: string;
    user_id?: string | number;
    data?: { access_token?: string; user_id?: string | number }[];
  };
  const short = json.access_token ?? json.data?.[0]?.access_token;
  const userId = String(json.user_id ?? json.data?.[0]?.user_id ?? "");
  if (!short) throw new Error("ig-token-empty");

  let accessToken = short;
  const longRes = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(clientSecret)}&access_token=${encodeURIComponent(short)}`,
  );
  if (longRes.ok) {
    const longJson = (await longRes.json()) as { access_token?: string; expires_in?: number };
    if (longJson.access_token) accessToken = longJson.access_token;
    const me = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=id,username,account_type&access_token=${encodeURIComponent(accessToken)}`,
    );
    let accountName = "Instagram";
    if (me.ok) {
      const profile = (await me.json()) as { username?: string };
      accountName = profile.username ? `@${profile.username}` : "Instagram";
    }
    await saveOAuthTokens({
      provider: "instagram",
      accessToken,
      expiresAt: longJson.expires_in ? Date.now() + longJson.expires_in * 1000 : undefined,
      accountName,
      accountId: userId,
    });
    return;
  }

  await saveOAuthTokens({
    provider: "instagram",
    accessToken,
    accountName: "Instagram",
    accountId: userId,
  });
}

export type IgMediaHit = {
  id: string;
  caption: string;
  mediaType: string;
  permalink?: string;
  timestamp?: string;
  thumbnail?: string;
  likes?: number;
  comments?: number;
};

export async function searchInstagramMedia(query: string): Promise<IgMediaHit[]> {
  const tokens = await readOAuthTokens("instagram");
  if (!tokens?.accessToken) return [];
  const url = new URL("https://graph.instagram.com/v21.0/me/media");
  url.searchParams.set(
    "fields",
    "id,caption,media_type,media_url,permalink,timestamp,thumbnail_url,like_count,comments_count",
  );
  url.searchParams.set("limit", "30");
  url.searchParams.set("access_token", tokens.accessToken);
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = (await res.json()) as {
    data?: {
      id?: string;
      caption?: string;
      media_type?: string;
      media_url?: string;
      permalink?: string;
      timestamp?: string;
      thumbnail_url?: string;
      like_count?: number;
      comments_count?: number;
    }[];
  };
  const q = query.trim().toLowerCase();
  return (json.data ?? [])
    .filter((item) => !q || (item.caption ?? "").toLowerCase().includes(q) || q.split(/\s+/).some((p) => (item.caption ?? "").toLowerCase().includes(p)))
    .slice(0, 24)
    .map((item) => ({
      id: String(item.id ?? ""),
      caption: item.caption ?? "",
      mediaType: (item.media_type ?? "IMAGE").toLowerCase(),
      permalink: item.permalink,
      timestamp: item.timestamp,
      thumbnail: item.thumbnail_url ?? item.media_url,
      likes: item.like_count ?? 0,
      comments: item.comments_count ?? 0,
    }));
}

export async function revokeInstagram() {
  const tokens = await readOAuthTokens("instagram");
  if (tokens?.accessToken) {
    await fetch(`https://graph.instagram.com/me/permissions?access_token=${encodeURIComponent(tokens.accessToken)}`, {
      method: "DELETE",
    }).catch(() => undefined);
  }
  await clearOAuthTokens("instagram");
}
