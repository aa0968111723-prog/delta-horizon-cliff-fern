const ALLOWED = new Set(["/", "/create", "/ig", "/calendar", "/connect"]);
const KEEP_QUERY = ["q", "mode", "campaign", "asset", "item", "day", "go"] as const;

/** OAuth 回來只准進創作迴路，避免 open redirect。 */
export function sanitizeConnectNext(raw?: string | null): string {
  if (!raw) return "/connect";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return "/connect";
  }
  try {
    const url = new URL(trimmed, "https://tkz.local");
    if (url.username || url.password || url.host !== "tkz.local") return "/connect";
    if (!ALLOWED.has(url.pathname)) return "/connect";
    const keep = new URLSearchParams();
    for (const key of KEEP_QUERY) {
      const value = url.searchParams.get(key);
      if (value) keep.set(key, value.slice(0, 80));
    }
    const qs = keep.toString();
    return qs ? `${url.pathname}?${qs}` : url.pathname;
  } catch {
    return "/connect";
  }
}

export function connectReturnPath(
  next: string | null | undefined,
  opts: { ok?: string; notice?: string },
) {
  const safe = sanitizeConnectNext(next);
  const url = new URL(safe, "https://tkz.local");
  if (opts.ok) url.searchParams.set("ok", opts.ok);
  if (opts.notice) url.searchParams.set("notice", opts.notice);
  return `${url.pathname}${url.search}`;
}

export function persistableImageSrc(src?: string | null) {
  if (!src || src.length > 2000) return null;
  if (!src.startsWith("https://")) return null;
  return src;
}

export function withConnectNext(path: string, next?: string) {
  const safe = next ? sanitizeConnectNext(next) : "";
  if (!safe || safe === "/connect") return path;
  return `${path}?next=${encodeURIComponent(safe)}`;
}
