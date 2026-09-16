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
