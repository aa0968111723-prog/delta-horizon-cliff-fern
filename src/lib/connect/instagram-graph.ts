/** Pure Instagram Graph helpers — no server fns, safe for node:test. */

export const IG_GRAPH = "https://graph.facebook.com/v21.0";

export function accountsUrl(token: string) {
  return `${IG_GRAPH}/me/accounts?fields=instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`;
}

export function mediaContainerUrl(igUserId: string) {
  return `${IG_GRAPH}/${igUserId}/media`;
}

export function mediaPublishUrl(igUserId: string) {
  return `${IG_GRAPH}/${igUserId}/media_publish`;
}

export function isPublicImageUrl(url?: string | null) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return !/^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

export function containerParams(opts: { imageUrl: string; caption: string }) {
  return {
    image_url: opts.imageUrl,
    caption: opts.caption.slice(0, 2200),
  };
}

export function isStoryGraphFormat(format?: string) {
  return format === "story";
}

/** Official Stories container. Caption is not a Graph Stories field. */
export function storyParams(imageUrl: string) {
  return {
    media_type: "STORIES",
    image_url: imageUrl,
  };
}

export function graphContainerParams(opts: { imageUrl: string; caption: string; format?: string }): Record<string, string> {
  if (isStoryGraphFormat(opts.format)) return storyParams(opts.imageUrl);
  return containerParams({ imageUrl: opts.imageUrl, caption: opts.caption });
}

export function parseIgUser(json: unknown): { id: string; username?: string } | null {
  const accounts = json as { data?: { instagram_business_account?: { id: string; username?: string } }[] };
  const ig = accounts.data?.find((row) => row.instagram_business_account)?.instagram_business_account;
  return ig?.id ? ig : null;
}

export function parseContainerId(json: unknown): string | null {
  const id = (json as { id?: string }).id;
  return id || null;
}

export function parsePublishId(json: unknown): string | null {
  return parseContainerId(json);
}

export function mediaPermalinkUrl(mediaId: string) {
  return `${IG_GRAPH}/${mediaId}?fields=permalink`;
}

export function parsePermalink(json: unknown): string | null {
  const permalink = (json as { permalink?: string }).permalink;
  return permalink && permalink.startsWith("http") ? permalink : null;
}

export function mediaInsightsUrl(mediaId: string) {
  return `${IG_GRAPH}/${mediaId}/insights?metric=impressions,reach,saved,shares,plays`;
}

export function parseIgInsights(json: unknown): Record<string, number> {
  const data = (json as { data?: { name?: string; values?: { value?: number }[] }[] }).data;
  const out: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.name) out[row.name] = Number(row.values?.[0]?.value ?? 0);
  }
  return out;
}

export function containerStatusUrl(containerId: string) {
  return `${IG_GRAPH}/${containerId}?fields=status_code`;
}

export function parseContainerStatus(json: unknown): string | null {
  const code = (json as { status_code?: string }).status_code;
  return code || null;
}

export function carouselItemParams(imageUrl: string) {
  return { image_url: imageUrl, is_carousel_item: "true" };
}

export function carouselAlbumParams(childIds: string[], caption: string) {
  return {
    media_type: "CAROUSEL",
    children: childIds.slice(0, 10).join(","),
    caption: caption.slice(0, 2200),
  };
}

export function longLivedTokenUrl(opts: { clientId: string; clientSecret: string; token: string }) {
  const url = new URL(`${IG_GRAPH}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", opts.clientId);
  url.searchParams.set("client_secret", opts.clientSecret);
  url.searchParams.set("fb_exchange_token", opts.token);
  return url.toString();
}

export function containerPhase(status: string | null): "ready" | "error" | "wait" {
  const code = (status ?? "").toUpperCase();
  if (code === "FINISHED") return "ready";
  if (code === "ERROR" || code === "EXPIRED" || code === "FAILED") return "error";
  return "wait";
}

export function shouldPublishCarousel(kind: string, pageCount: number) {
  return kind === "carousel" && pageCount >= 2;
}

export async function waitUntilContainerReady(opts: {
  containerId: string;
  token: string;
  fetchJson: (url: string) => Promise<unknown>;
  sleep?: (ms: number) => Promise<void>;
  attempts?: number;
  delayMs?: number;
}): Promise<{ ok: true; status: string } | { ok: false; status: string | null }> {
  const attempts = opts.attempts ?? 15;
  const delayMs = opts.delayMs ?? 2000;
  const sleep = opts.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  let last: string | null = null;
  for (let i = 0; i < attempts; i++) {
    const url = new URL(containerStatusUrl(opts.containerId));
    url.searchParams.set("access_token", opts.token);
    const json = await opts.fetchJson(url.toString());
    last = parseContainerStatus(json);
    const phase = containerPhase(last);
    if (phase === "ready") return { ok: true, status: last || "FINISHED" };
    if (phase === "error") return { ok: false, status: last };
    await sleep(delayMs);
  }
  return { ok: false, status: last };
}
