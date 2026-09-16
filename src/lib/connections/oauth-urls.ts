export const CANVA_AUTHORIZE_URL = "https://www.canva.com/api/oauth/authorize";
export const CANVA_SCOPES = "design:meta:read design:content:read";

export const IG_AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
export const IG_BASIC_SCOPE = "instagram_business_basic";
export const IG_INSIGHTS_SCOPE = "instagram_business_manage_insights";

export function instagramScopeList(includeInsights = false) {
  return includeInsights ? [IG_BASIC_SCOPE, IG_INSIGHTS_SCOPE] : [IG_BASIC_SCOPE];
}

export function instagramScopeParam(includeInsights = false) {
  return instagramScopeList(includeInsights).join(",");
}

export function splitScopes(value: string | string[] | undefined) {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(" ") : value;
  return [...new Set(raw.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean))];
}

export function hasInsightsGrant(scopes: string[]) {
  return scopes.includes(IG_INSIGHTS_SCOPE);
}

export function buildCanvaAuthorizeUrl(input: {
  clientId: string;
  redirectUri: string;
  challenge: string;
  state: string;
}) {
  const url = new URL(CANVA_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("scope", CANVA_SCOPES);
  url.searchParams.set("code_challenge", input.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", input.state);
  return url.toString();
}

export function buildInstagramAuthorizeUrl(input: {
  clientId: string;
  redirectUri: string;
  challenge: string;
  state: string;
  includeInsights?: boolean;
}) {
  const url = new URL(IG_AUTHORIZE_URL);
  url.searchParams.set("enable_fb_login", "0");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", instagramScopeParam(Boolean(input.includeInsights)));
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export function parseInstagramTokenPayload(value: unknown): {
  accessToken: string;
  userId: string;
  scopes: string[];
  expiresIn: number;
} | null {
  const row = asTokenRow(value);
  if (!row) return null;
  const nested = Array.isArray(row.data) ? asTokenRow(row.data[0]) : null;
  const accessToken = text(row.access_token) || text(nested?.access_token);
  if (!accessToken) return null;
  const permissions = row.permissions ?? nested?.permissions ?? row.scope ?? nested?.scope;
  const expires = Number(row.expires_in ?? nested?.expires_in ?? 0);
  return {
    accessToken,
    userId: text(row.user_id) || text(nested?.user_id) || text(row.userId),
    scopes: splitScopes(typeof permissions === "string" || Array.isArray(permissions) ? permissions : undefined),
    expiresIn: Number.isFinite(expires) ? expires : 0,
  };
}

function asTokenRow(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : typeof value === "number" ? String(value) : "";
}
