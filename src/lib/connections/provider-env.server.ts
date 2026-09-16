function readEnv(key: string) {
  const value = process.env[key]?.trim();
  return value || undefined;
}

export function canvaCatalogId() {
  return (
    readEnv("CANVA_CONNECTOR_CATALOG_ID") ||
    readEnv("GROK_CANVA_CONNECTOR_CATALOG_ID") ||
    readEnv("GROK_MCP_CANVA_CATALOG_ID")
  );
}

export function canvaOAuthCredentials() {
  const clientId = readEnv("CANVA_CLIENT_ID") || readEnv("CANVA_CONNECT_CLIENT_ID");
  const clientSecret = readEnv("CANVA_CLIENT_SECRET") || readEnv("CANVA_CONNECT_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function canvaTokenSecret() {
  return readEnv("CANVA_TOKEN_SECRET") || canvaOAuthCredentials()?.clientSecret;
}

export function instagramCatalogId() {
  return (
    readEnv("INSTAGRAM_CONNECTOR_CATALOG_ID") ||
    readEnv("GROK_INSTAGRAM_CONNECTOR_CATALOG_ID") ||
    readEnv("GROK_MCP_INSTAGRAM_CATALOG_ID")
  );
}

export function instagramOAuthCredentials() {
  const clientId =
    readEnv("INSTAGRAM_APP_ID") ||
    readEnv("INSTAGRAM_CLIENT_ID") ||
    readEnv("META_APP_ID");
  const clientSecret =
    readEnv("INSTAGRAM_APP_SECRET") ||
    readEnv("INSTAGRAM_CLIENT_SECRET") ||
    readEnv("META_APP_SECRET");
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function instagramTokenSecret() {
  return readEnv("INSTAGRAM_TOKEN_SECRET") || instagramOAuthCredentials()?.clientSecret;
}

export function publicAppOriginFromRequest(request: Request | null) {
  if (!request) return null;
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = (forwardedHost || request.headers.get("host") || "").split(":")[0]?.trim();
  if (!host) return null;
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (host === "localhost" || host === "127.0.0.1" ? "http" : "https");
  return `${proto}://${forwardedHost || request.headers.get("host")}`;
}
