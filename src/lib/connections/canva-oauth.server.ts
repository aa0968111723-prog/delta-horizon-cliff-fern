import type { CallToolResult } from "@/lib/app-data";
import { normalizeCanvaDesigns } from "./canva-normalize.ts";
import type { ConnectorResult, ExternalMemoryItem, OfficialProviderStatus } from "./types.ts";
import { EMPTY_CAPABILITIES } from "./types.ts";
import { genericError, oauthNeededError, safeConnectorError, unavailableError } from "./safe-result.ts";
import type { OAuthTokenSet } from "./oauth-cookies.server.ts";

export const CANVA_TOKEN_COOKIE = "zen_canva_token";
export const CANVA_PKCE_COOKIE = "zen_canva_pkce";
export const CANVA_TOKEN_SALT = "zen-canva-token";
export const CANVA_PKCE_SALT = "zen-canva-pkce";
export const CANVA_SCOPES = "design:meta:read design:content:read";
export const CANVA_MCP_LIST_TOOLS = ["canva_list_designs", "list_designs", "search_designs", "list-designs", "canva_search"];

let rememberedMcpTool: string | null = null;

export function canvaUnavailableStatus(reason = "Canva 尚未在此環境提供"): OfficialProviderStatus {
  return {
    provider: "canva",
    available: false,
    mode: "none",
    connected: false,
    reason,
    scopes: [],
    capabilities: EMPTY_CAPABILITIES,
  };
}

export async function readCanvaEnv() {
  const env = await import("./provider-env.server.ts");
  return {
    catalogId: env.canvaCatalogId(),
    oauth: env.canvaOAuthCredentials(),
    secret: env.canvaTokenSecret(),
    origin: env.publicAppOriginFromRequest((await import("./oauth-cookies.server.ts")).currentRequest()),
  };
}

export async function canvaRedirectUri() {
  const { origin } = await readCanvaEnv();
  return origin ? `${origin}/api/canva/callback` : null;
}

export async function currentCanvaStatus(): Promise<OfficialProviderStatus> {
  const { catalogId, oauth, secret } = await readCanvaEnv();
  if (catalogId) {
    return {
      provider: "canva",
      available: true,
      mode: "mcp",
      connected: false,
      reason: "透過 Grok MCP 連接 Canva。授權完成後才會讀取真實設計。",
      scopes: [],
      capabilities: { ...EMPTY_CAPABILITIES, list: true, search: true },
    };
  }
  if (oauth && secret) {
    const cookies = await import("./oauth-cookies.server.ts");
    const token = cookies.readTokenSet(CANVA_TOKEN_COOKIE, secret, CANVA_TOKEN_SALT);
    return {
      provider: "canva",
      available: true,
      mode: "oauth",
      connected: Boolean(token),
      reason: token
        ? "已用官方 Canva Connect OAuth 連接。只保存設計 metadata，憑證不會進前端。"
        : "可用官方 Canva Connect OAuth 連接。不會要求貼 Token。",
      scopes: token?.scope.split(/\s+/).filter(Boolean) ?? [],
      capabilities: { ...EMPTY_CAPABILITIES, list: true, search: true },
    };
  }
  return canvaUnavailableStatus();
}

async function callCanvaMcp(toolName: string, args: Record<string, unknown>): Promise<CallToolResult> {
  const { catalogId } = await readCanvaEnv();
  if (!catalogId) return { ok: false, data: null, errorMessage: "Canva MCP catalog is not configured" };
  const { callTool, ConnectorType } = await import("@/lib/app-data/client.server");
  return callTool(toolName, args, {
    connectorType: ConnectorType.Mcp,
    connectorCatalogId: catalogId,
  });
}

export async function listCanvaViaMcp(query?: string): Promise<ConnectorResult<ExternalMemoryItem[]>> {
  const tools = rememberedMcpTool
    ? [rememberedMcpTool, ...CANVA_MCP_LIST_TOOLS.filter((name) => name !== rememberedMcpTool)]
    : CANVA_MCP_LIST_TOOLS;
  let last: CallToolResult | null = null;
  for (const tool of tools) {
    const args = query
      ? { query, q: query, search: query, ownership: "any", sort_by: "relevance", limit: 40 }
      : { ownership: "any", sort_by: "modified_descending", limit: 40 };
    const result = await callCanvaMcp(tool, args);
    last = result;
    if (result.ok) {
      rememberedMcpTool = tool;
      return { ok: true, data: normalizeCanvaDesigns(result.data) };
    }
    const raw = (result.errorMessage ?? "").toLowerCase();
    if (result.loginRequired || raw.includes("not_connected") || raw.includes("scope_denied") || raw.includes("access_denied")) {
      return safeConnectorError(result, "Canva 尚未完成授權");
    }
    if (!/unknown|not found|does not exist|no such tool|invalid tool/.test(raw)) {
      return safeConnectorError(result, "Canva 暫時無法列出設計");
    }
  }
  return last
    ? safeConnectorError(last, "這個 Canva MCP 沒有可用的設計列表工具")
    : unavailableError("Canva 尚未在此環境提供");
}

export async function canvaTokenRequest(body: URLSearchParams): Promise<OAuthTokenSet> {
  const { oauth } = await readCanvaEnv();
  if (!oauth) throw new Error("Canva OAuth 尚未設定");
  const basic = Buffer.from(`${oauth.clientId}:${oauth.clientSecret}`).toString("base64");
  const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = await response.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || "Canva 授權失敗");
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? "",
    expiresAt: Date.now() + Math.max(60, (json.expires_in ?? 14400) - 60) * 1000,
    scope: json.scope ?? CANVA_SCOPES,
  };
}

async function persistCanvaToken(token: OAuthTokenSet) {
  const { secret } = await readCanvaEnv();
  if (!secret) return;
  const cookies = await import("./oauth-cookies.server.ts");
  cookies.writeTokenSet(CANVA_TOKEN_COOKIE, token, secret, CANVA_TOKEN_SALT);
}

async function refreshCanvaToken(token: OAuthTokenSet) {
  if (!token.refreshToken) return token;
  const next = await canvaTokenRequest(new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: token.refreshToken,
  }));
  await persistCanvaToken(next);
  return next;
}

async function authorizedCanvaFetch(path: string) {
  const { secret } = await readCanvaEnv();
  const cookies = await import("./oauth-cookies.server.ts");
  let token = cookies.readTokenSet(CANVA_TOKEN_COOKIE, secret, CANVA_TOKEN_SALT);
  if (!token) return null;
  if (token.expiresAt && token.expiresAt < Date.now() + 15_000 && token.refreshToken) {
    token = await refreshCanvaToken(token);
  }
  const request = (accessToken: string) => fetch(`https://api.canva.com/rest/v1${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  let response = await request(token.accessToken);
  if (response.status === 401 && token.refreshToken) {
    token = await refreshCanvaToken(token);
    response = await request(token.accessToken);
  }
  return response;
}

export async function listCanvaViaOauth(query?: string): Promise<ConnectorResult<ExternalMemoryItem[]>> {
  const params = new URLSearchParams({
    ownership: "any",
    sort_by: query ? "relevance" : "modified_descending",
    limit: "50",
  });
  if (query) params.set("query", query);
  const response = await authorizedCanvaFetch(`/designs?${params.toString()}`);
  if (!response) return oauthNeededError("請先連接 Canva", "授權完成後才會讀取真實設計，不會使用模擬稿。");
  if (response.status === 401) return oauthNeededError("Canva 授權已過期，請重新授權");
  if (response.status === 403) return { ok: false, kind: "scope_denied", message: "目前授權不包含讀取設計 metadata" };
  if (!response.ok) return genericError("Canva 暫時無法列出設計");
  return { ok: true, data: normalizeCanvaDesigns(await response.json()) };
}

export async function listCanvaDesignRecords(query?: string): Promise<ConnectorResult<ExternalMemoryItem[]>> {
  const status = await currentCanvaStatus();
  if (!status.available) {
    return unavailableError("Canva 尚未在此環境提供", "這個環境沒有 Canva MCP catalog，也沒有注入的 Canva OAuth 憑證。不會假裝已連接。");
  }
  if (status.mode === "mcp") return listCanvaViaMcp(query);
  return listCanvaViaOauth(query);
}

export async function completeCanvaOAuth(code: string, state: string) {
  const { secret, oauth } = await readCanvaEnv();
  const redirectUri = await canvaRedirectUri();
  if (!secret || !oauth || !redirectUri) {
    return { ok: false as const, message: "Canva 尚未在此環境提供" };
  }
  const cookies = await import("./oauth-cookies.server.ts");
  const pkce = cookies.readPkce(CANVA_PKCE_COOKIE, secret, CANVA_PKCE_SALT);
  if (!pkce || pkce.state !== state) {
    return { ok: false as const, message: "Canva 授權狀態已過期，請再試一次" };
  }
  const token = await canvaTokenRequest(new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier: pkce.verifier,
    redirect_uri: redirectUri,
  }));
  await persistCanvaToken(token);
  cookies.clearAuthCookie(CANVA_PKCE_COOKIE);
  return { ok: true as const };
}

export async function startCanvaOAuthUrl(): Promise<ConnectorResult<{ url: string }>> {
  const { oauth, secret } = await readCanvaEnv();
  const redirectUri = await canvaRedirectUri();
  if (!oauth || !secret || !redirectUri) {
    return unavailableError("Canva 尚未在此環境提供", "缺少 OAuth 回呼位址或伺服器密鑰。");
  }
  const { createPkce } = await import("./secret-box.ts");
  const cookies = await import("./oauth-cookies.server.ts");
  const pkce = createPkce();
  cookies.writePkce(CANVA_PKCE_COOKIE, { verifier: pkce.verifier, state: pkce.state, createdAt: Date.now() }, secret, CANVA_PKCE_SALT);
  const url = new URL("https://www.canva.com/api/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", oauth.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", CANVA_SCOPES);
  url.searchParams.set("code_challenge", pkce.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", pkce.state);
  return { ok: true, data: { url: url.toString() } };
}

export async function revokeCanvaSession() {
  const { oauth, secret } = await readCanvaEnv();
  const cookies = await import("./oauth-cookies.server.ts");
  const token = cookies.readTokenSet(CANVA_TOKEN_COOKIE, secret, CANVA_TOKEN_SALT);
  if (token && oauth) {
    try {
      const basic = Buffer.from(`${oauth.clientId}:${oauth.clientSecret}`).toString("base64");
      await fetch("https://api.canva.com/rest/v1/oauth/revoke", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ token: token.refreshToken || token.accessToken }),
      });
    } catch {
      /* revoke is best-effort */
    }
  }
  cookies.clearAuthCookie(CANVA_TOKEN_COOKIE);
  cookies.clearAuthCookie(CANVA_PKCE_COOKIE);
}

async function thumbnailToDataUrl(url: string): Promise<ConnectorResult<{ dataUrl: string }>> {
  if (!/^https:\/\//i.test(url)) {
    return genericError("這個設計沒有可用縮圖，無法分析。");
  }
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) return genericError("無法讀取 Canva 縮圖");
  const mime = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  if (!mime.startsWith("image/")) return genericError("Canva 縮圖不是圖片，無法分析。");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > 1_500_000) return genericError("Canva 縮圖太大，無法分析。");
  return { ok: true, data: { dataUrl: `data:${mime};base64,${bytes.toString("base64")}` } };
}

export async function readCanvaDesignThumbnail(designId: string): Promise<ConnectorResult<{
  dataUrl: string;
  title: string;
  collection: string;
}>> {
  const status = await currentCanvaStatus();
  if (!status.available) {
    return unavailableError("Canva 尚未在此環境提供", "沒有 MCP catalog，也沒有注入的 Canva OAuth 憑證。");
  }
  if (status.mode === "mcp") {
    const listed = await listCanvaViaMcp();
    if (!listed.ok) return listed;
    const item = listed.data.find((row) => row.id === designId);
    if (!item?.thumbnailUrl) return genericError("這個設計沒有可用縮圖，無法分析。可改為在 Canva 開啟。");
    const thumb = await thumbnailToDataUrl(item.thumbnailUrl);
    if (!thumb.ok) return thumb;
    return {
      ok: true,
      data: { dataUrl: thumb.data.dataUrl, title: item.title, collection: item.collection || "浮游禪光" },
    };
  }
  const response = await authorizedCanvaFetch(`/designs/${encodeURIComponent(designId)}`);
  if (!response) return oauthNeededError("請先連接 Canva");
  if (response.status === 401) return oauthNeededError("Canva 授權已過期，請重新授權");
  if (response.status === 403) return { ok: false, kind: "scope_denied", message: "目前授權不包含讀取設計 metadata" };
  if (!response.ok) return genericError("Canva 暫時無法讀取這個設計");
  const [design] = normalizeCanvaDesigns(await response.json());
  if (!design?.thumbnailUrl) return genericError("這個設計沒有可用縮圖，無法分析。可改為在 Canva 開啟。這不是 Design Autofill，也不會匯出原稿。");
  const thumb = await thumbnailToDataUrl(design.thumbnailUrl);
  if (!thumb.ok) return thumb;
  return {
    ok: true,
    data: { dataUrl: thumb.data.dataUrl, title: design.title, collection: design.collection || "浮游禪光" },
  };
}
