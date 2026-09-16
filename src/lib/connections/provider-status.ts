import { hasInsightsGrant } from "./oauth-urls.ts";
import { EMPTY_CAPABILITIES, type OfficialProviderStatus } from "./types.ts";

export function canvaStatusFromConfig(input: {
  catalogId?: string;
  oauthReady: boolean;
  connected: boolean;
  scopes?: string[];
}): OfficialProviderStatus {
  if (input.catalogId) {
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
  if (input.oauthReady) {
    return {
      provider: "canva",
      available: true,
      mode: "oauth",
      connected: input.connected,
      reason: input.connected
        ? "已用官方 Canva Connect OAuth 連接。只保存設計 metadata，憑證不會進前端。"
        : "可用官方 Canva Connect OAuth 連接。不會要求貼 Token。",
      scopes: input.scopes ?? [],
      capabilities: { ...EMPTY_CAPABILITIES, list: true, search: true },
    };
  }
  return {
    provider: "canva",
    available: false,
    mode: "none",
    connected: false,
    reason: "Canva 尚未在此環境提供",
    scopes: [],
    capabilities: EMPTY_CAPABILITIES,
  };
}

export function instagramStatusFromConfig(input: {
  catalogId?: string;
  oauthReady: boolean;
  connected: boolean;
  scopes?: string[];
  username?: string;
}): OfficialProviderStatus {
  if (input.catalogId) {
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
  if (input.oauthReady) {
    const scopes = input.scopes ?? [];
    return {
      provider: "instagram",
      available: true,
      mode: "oauth",
      connected: input.connected,
      reason: input.connected
        ? "已用官方 Instagram API OAuth 連接。只保存貼文 metadata，憑證不會進前端。"
        : "可用官方 Instagram Login 連接。不會要求貼 Token。",
      username: input.username,
      scopes,
      capabilities: {
        ...EMPTY_CAPABILITIES,
        list: true,
        search: true,
        insights: input.connected && hasInsightsGrant(scopes),
      },
    };
  }
  return {
    provider: "instagram",
    available: false,
    mode: "none",
    connected: false,
    reason: "Instagram 尚未在此環境提供",
    scopes: [],
    capabilities: EMPTY_CAPABILITIES,
  };
}
