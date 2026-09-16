import type { CallToolResult } from "@/lib/app-data";
import { normalizeInstagramMedia, normalizeInstagramProfile } from "./instagram-normalize.ts";
import type { ConnectorResult, ExternalMemoryItem, OfficialProviderStatus } from "./types.ts";
import { EMPTY_CAPABILITIES } from "./types.ts";
import { genericError, oauthNeededError, safeConnectorError, unavailableError } from "./safe-result.ts";
import type { OAuthTokenSet } from "./oauth-cookies.server.ts";

export const IG_TOKEN_COOKIE = "zen_ig_token";
export const IG_PKCE_COOKIE = "zen_ig_pkce";
export const IG_TOKEN_SALT = "zen-ig-token";
export const IG_PKCE_SALT = "zen-ig-pkce";
export const IG_SCOPES = "instagram_business_basic";
export const IG_INSIGHTS_SCOPE = "instagram_business_manage_insights";
export const IG_MCP_LIST_TOOLS = ["instagram_list_media", "list_media", "list_posts", "instagram_media"];

let rememberedMcpTool: string | null = null;

export function instagramUnavailableStatus(reason = "Instagram 尚未在此環境提供"): OfficialProviderStatus {
  return {
    provider: "instagram",
    available: false,
    mode: "none",
    connected: false,
    reason,
    scopes: [],
    capabilities: EMPTY_CAPABILITIES,
  };
}

export async function readInstagramEnv() {
  const env = await import("./provider-env.server.ts");
  const cookies = await import("./oauth-cookies.server.ts");
  return {
    catalogId: env.instagramCatalogId(),
    oauth: env.instagramOAuthCredentials(),
    secret: env.instagramTokenSecret(),
    origin: env.publicAppOriginFromRequest(cookies.currentRequest()),
  };
}

export async function instagramRedirectUri() {
  const { origin } = await readInstagramEnv();
  return origin ? `${origin}/api/instagram/callback` : null;
}

export async function currentInstagramStatus(): Promise<OfficialProviderStatus> {
  const { catalogId, oauth, secret } = await readInstagramEnv();
  if (catalogId) {
    return {
      provider: "instagram",
      available: true,
      mode: "mcp",
      connected: false,
      reason: "透過 Grok MCP 連接 Instagram。授權完成後才會讀取真實貼文。",
      scopes: [],
      capabilities: { ...EMPTY_CAPABILITIES, list: true, search: true },
    };
  }
  if (oauth && secret) {
    const cookies = await import("./oauth-cookies.server.ts");
    const token = cookies.readTokenSet(IG_TOKEN_COOKIE, secret, IG_TOKEN_SALT);
    const scopes = token?.scope.split(/\s+/).filter(Boolean) ?? [];
    return {
      provider: "instagram",
      available: true,
      mode: "oauth",
      connected: Boolean(token),
      reason: token
        ? "已用官方 Instagram API OAuth 連接。只保存貼文 metadata，憑證不會進前端。"
        : "可用官方 Instagram Login 連接。不會要求貼 Token。",
      scopes,
      capabilities: {
        ...EMPTY_CAPABILITIES,
        list: true,
        search: true,
        insights: scopes.includes(IG_INSIGHTS_SCOPE),
      },
    };
  }
  return instagramUnavailableStatus();
}

async function callInstagramMcp(toolName: string, args: Record<string, unknown>): Promise<CallToolResult> {
  const { catalogId } = await readInstagramEnv();
  if (!catalogId) return { ok: false, data: null, errorMessage: "Instagram MCP catalog is not configured" };
  const { callTool, ConnectorType } = await import("@/lib/app-data/client.server");
  return callTool(toolName, args, {
    connectorType: ConnectorType.Mcp,
    connectorCatalogId: catalogId,
  });
}

export async function listInstagramViaMcp(query?: string): Promise<ConnectorResult<ExternalMemoryItem[]>> {
  const tools = rememberedMcpTool
    ? [rememberedMcpTool, ...IG_MCP_LIST_TOOLS.filter((name) => name !== rememberedMcpTool)]
    : IG_MCP_LIST_TOOLS;
  let last: CallToolResult | null = null;
  for (const tool of tools) {
    const result = await callInstagramMcp(tool, query ? { q: query, query, limit: 40 } : { limit: 40 });
    last = result;
    if (result.ok) {
      rememberedMcpTool = tool;
      const items = normalizeInstagramMedia(result.data);
      return { ok: true, data: query ? items.filter((item) => `${item.title} ${item.snippet}`.includes(query)) : items };
    }
    const raw = (result.errorMessage ?? "").toLowerCase();
    if (result.loginRequired || raw.includes("not_connected") || raw.includes("scope_denied") || raw.includes("access_denied")) {
      return safeConnectorError(result, "Instagram 尚未完成授權");
    }
    if (!/unknown|not found|does not exist|no such tool|invalid tool/.test(raw)) {
      return safeConnectorError(result, "Instagram 暫時無法列出貼文");
    }
  }
  return last
    ? safeConnectorError(last, "這個 Instagram MCP 沒有可用的貼文列表工具")
    : unavailableError("Instagram 尚未在此環境提供");
}

export async function instagramTokenRequest(body: URLSearchParams, path: string) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await response.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    error?: { message?: string };
    error_message?: string;
  };
  if (!response.ok || !json.access_token) {
    throw new Error(json.error?.message || json.error_message || "Instagram 授權失敗");
  }
  return json;
}

async function persistInstagramToken(token: OAuthTokenSet) {
  const { secret } = await readInstagramEnv();
  if (!secret) return;
  const cookies = await import("./oauth-cookies.server.ts");
  cookies.writeTokenSet(IG_TOKEN_COOKIE, token, secret, IG_TOKEN_SALT);
}

async function refreshInstagramToken(token: OAuthTokenSet) {
  const response = await fetch(`https://graph.instagram.com/refresh_access_token?${new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: token.accessToken,
  })}`);
  const json = await response.json() as { access_token?: string; expires_in?: number };
  if (!response.ok || !json.access_token) return token;
  const next: OAuthTokenSet = {
    accessToken: json.access_token,
    refreshToken: token.refreshToken,
    expiresAt: Date.now() + Math.max(60, (json.expires_in ?? 60 * 60 * 24 * 50) - 60) * 1000,
    scope: token.scope || IG_SCOPES,
  };
  await persistInstagramToken(next);
  return next;
}

async function exchangeInstagramCode(code: string) {
  const { oauth } = await readInstagramEnv();
  const redirectUri = await instagramRedirectUri();
  if (!oauth || !redirectUri) throw new Error("Instagram OAuth 尚未設定");
  const { secret } = await readInstagramEnv();
  const cookies = await import("./oauth-cookies.server.ts");
  const pkce = cookies.readPkce(IG_PKCE_COOKIE, secret, IG_PKCE_SALT);
  const body = new URLSearchParams({
    client_id: oauth.clientId,
    client_secret: oauth.clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });
  if (pkce?.verifier) body.set("code_verifier", pkce.verifier);
  const shortLived = await instagramTokenRequest(body, "https://api.instagram.com/oauth/access_token");
  const longLived = await fetch(`https://graph.instagram.com/access_token?${new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: oauth.clientSecret,
    access_token: shortLived.access_token ?? "",
  })}`);
  const longJson = await longLived.json() as { access_token?: string; expires_in?: number };
  const accessToken = longJson.access_token || shortLived.access_token;
  if (!accessToken) throw new Error("Instagram 授權失敗");
  return {
    accessToken,
    refreshToken: "",
    expiresAt: Date.now() + Math.max(60, (longJson.expires_in ?? 60 * 60 * 24 * 50) - 60) * 1000,
    scope: IG_SCOPES,
  } satisfies OAuthTokenSet;
}

async function authorizedInstagramFetch(path: string) {
  const { secret } = await readInstagramEnv();
  const cookies = await import("./oauth-cookies.server.ts");
  let token = cookies.readTokenSet(IG_TOKEN_COOKIE, secret, IG_TOKEN_SALT);
  if (!token) return null;
  if (token.expiresAt && token.expiresAt < Date.now() + 10 * 24 * 60 * 60 * 1000) {
    token = await refreshInstagramToken(token);
  }
  return fetch(`https://graph.instagram.com/v21.0${path}`, {
    headers: { Authorization: `Bearer ${token.accessToken}`, Accept: "application/json" },
  });
}

export async function listInstagramViaOauth(query?: string): Promise<ConnectorResult<ExternalMemoryItem[]>> {
  const response = await authorizedInstagramFetch("/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&limit=40");
  if (!response) return oauthNeededError("請先連接 Instagram", "授權完成後才會讀取真實貼文，不會使用模擬貼文。");
  if (response.status === 401) return oauthNeededError("Instagram 授權已過期，請重新授權");
  if (response.status === 403) return { ok: false, kind: "scope_denied", message: "目前授權不包含讀取 IG 貼文" };
  if (!response.ok) return genericError("Instagram 暫時無法列出貼文");
  const items = normalizeInstagramMedia(await response.json());
  if (!query?.trim()) return { ok: true, data: items };
  const needle = query.trim();
  return { ok: true, data: items.filter((item) => `${item.title} ${item.snippet}`.includes(needle)) };
}

export async function listInstagramRecords(query?: string): Promise<ConnectorResult<ExternalMemoryItem[]>> {
  const status = await currentInstagramStatus();
  if (!status.available) {
    return unavailableError("Instagram 尚未在此環境提供", "這個環境沒有 Instagram MCP catalog，也沒有注入的官方 OAuth 憑證。");
  }
  if (status.mode === "mcp") return listInstagramViaMcp(query);
  return listInstagramViaOauth(query);
}

export async function readInstagramProfileName() {
  const response = await authorizedInstagramFetch("/me?fields=id,username");
  if (!response?.ok) return "";
  return normalizeInstagramProfile(await response.json()).username;
}

export async function completeInstagramOAuth(code: string, state: string) {
  const { secret, oauth } = await readInstagramEnv();
  const redirectUri = await instagramRedirectUri();
  if (!secret || !oauth || !redirectUri) {
    return { ok: false as const, message: "Instagram 尚未在此環境提供" };
  }
  const cookies = await import("./oauth-cookies.server.ts");
  const pkce = cookies.readPkce(IG_PKCE_COOKIE, secret, IG_PKCE_SALT);
  if (!pkce || pkce.state !== state) {
    return { ok: false as const, message: "Instagram 授權狀態已過期，請再試一次" };
  }
  const token = await exchangeInstagramCode(code);
  await persistInstagramToken(token);
  cookies.clearAuthCookie(IG_PKCE_COOKIE);
  return { ok: true as const };
}

export async function startInstagramOAuthUrl(): Promise<ConnectorResult<{ url: string }>> {
  const { oauth, secret } = await readInstagramEnv();
  const redirectUri = await instagramRedirectUri();
  if (!oauth || !secret || !redirectUri) {
    return unavailableError("Instagram 尚未在此環境提供", "缺少 OAuth 回呼位址或伺服器密鑰。");
  }
  const { createPkce } = await import("./secret-box.ts");
  const cookies = await import("./oauth-cookies.server.ts");
  const pkce = createPkce();
  cookies.writePkce(IG_PKCE_COOKIE, { verifier: pkce.verifier, state: pkce.state, createdAt: Date.now() }, secret, IG_PKCE_SALT);
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", oauth.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", IG_SCOPES);
  url.searchParams.set("state", pkce.state);
  url.searchParams.set("code_challenge", pkce.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return { ok: true, data: { url: url.toString() } };
}

export async function revokeInstagramSession() {
  const cookies = await import("./oauth-cookies.server.ts");
  cookies.clearAuthCookie(IG_TOKEN_COOKIE);
  cookies.clearAuthCookie(IG_PKCE_COOKIE);
}

export async function readInstagramInsights(): Promise<ConnectorResult<import("./types.ts").InstagramInsightsSnapshot>> {
  const status = await currentInstagramStatus();
  if (!status.available) {
    return unavailableError("Instagram 尚未在此環境提供", "沒有官方 OAuth 或 MCP catalog，不會顯示模擬成效。");
  }
  if (status.mode === "oauth" && !status.connected) {
    return oauthNeededError("請先連接 Instagram", "授權完成後，若帳號真的有 Insights 權限才會讀取官方數據。");
  }
  const response = await authorizedInstagramFetch("/me/insights?metric=views,reach,profile_views,total_interactions&period=day");
  if (!response) {
    return {
      ok: false,
      kind: "unavailable",
      message: "官方 Insights 尚未授權",
      detail: "需要 Instagram 的 insights 權限才會顯示成效。這裡不會用模擬數據填空。",
    };
  }
  if (response.status === 401) return oauthNeededError("Instagram 授權已過期，請重新授權");
  if (response.status === 403) {
    return {
      ok: false,
      kind: "unavailable",
      message: "這個帳號尚未開通官方 Insights",
      detail: "目前授權不包含 instagram_business_manage_insights。這裡不會用模擬數據填空。",
    };
  }
  if (!response.ok) {
    return genericError("官方 Insights 暫時無法讀取", "不會顯示模擬成效。稍後再試，或確認帳號是專業帳號。");
  }
  const { normalizeInstagramInsights } = await import("./instagram-normalize.ts");
  const rows = normalizeInstagramInsights(await response.json());
  if (!rows.length) {
    return genericError("官方 Insights 沒有回傳可用數據", "沒有數字時不會補假數據。");
  }
  return {
    ok: true,
    data: {
      period: rows[0]?.period || "day",
      rows,
      fetchedAt: Date.now(),
    },
  };
}
