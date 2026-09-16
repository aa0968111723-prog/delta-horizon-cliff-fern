/** Public origin for official OAuth redirects (preview proxy + grok.me). */

export function envPublicHost() {
  const raw = process.env.VITE_PUBLIC_HOSTNAME?.split(",")[0]?.trim() ?? "";
  const host = raw.replace(/^https?:\/\//, "").split("/")[0];
  if (!host || /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) return "";
  if (!host.includes(".")) return "";
  return host;
}

export function requestHost(request: Request): string {
  const envHost = envPublicHost();
  if (envHost) return envHost;
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return request.headers.get("host") || new URL(request.url).host;
}

export function requestProto(request: Request): "http" | "https" {
  const host = requestHost(request);
  if (host && !/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) return "https";
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded === "http" || forwarded === "https") return forwarded;
  return new URL(request.url).protocol === "https:" ? "https" : "http";
}

export function publicOrigin(request: Request): string {
  return `${requestProto(request)}://${requestHost(request)}`;
}

export function oauthStateMatches(expected: string | null, received: string | null) {
  return Boolean(expected && received && expected === received);
}
