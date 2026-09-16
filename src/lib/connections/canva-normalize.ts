import type { ExternalMemoryItem } from "./types.ts";
import { asObject, asText, findRows, unixToIso } from "./json.ts";

export function inferCanvaCollection(title: string) {
  if (/浮游禪光/.test(title)) return "浮游禪光";
  if (/茶會/.test(title)) return "茶會";
  if (/招生|迎新/.test(title)) return "招生";
  return "Canva 設計";
}

function urlsOf(row: Record<string, unknown>) {
  const urls = asObject(row.urls) ?? asObject(row.links) ?? {};
  return (
    asText(urls.edit_url) ||
    asText(urls.editUrl) ||
    asText(urls.view_url) ||
    asText(urls.viewUrl) ||
    asText(row.edit_url) ||
    asText(row.view_url) ||
    asText(row.url) ||
    asText(row.webUrl)
  );
}

function thumbnailOf(row: Record<string, unknown>) {
  const thumb = asObject(row.thumbnail) ?? asObject(row.thumbnail_url);
  return (
    asText(thumb?.url) ||
    asText(row.thumbnailUrl) ||
    asText(row.thumbnail_url) ||
    asText(row.thumbnail)
  );
}

export function normalizeCanvaDesigns(value: unknown): ExternalMemoryItem[] {
  const rows = findRows(value);
  const source = rows.length ? rows : (() => {
    const single = asObject(value);
    return single?.id || single?.design_id ? [single] : [];
  })();

  return source.flatMap((value) => {
    const row = asObject(value);
    if (!row) return [];
    if (asText(row.access_token) || asText(row.refresh_token) || asText(row.client_secret)) {
      return [];
    }
    const id = asText(row.id) || asText(row.design_id) || asText(row.designId);
    const title = asText(row.title) || asText(row.name);
    if (!id || !title) return [];
    const collection = inferCanvaCollection(title);
    const sourceDate = unixToIso(row.updated_at ?? row.updatedAt ?? row.created_at ?? row.createdAt);
    const pages = asText(row.page_count) || asText(row.pageCount);
    return [{
      id,
      provider: "canva" as const,
      title,
      mimeType: asText(row.mimeType) || "canva/design",
      isFolder: false,
      modifiedAt: sourceDate,
      webUrl: urlsOf(row),
      thumbnailUrl: thumbnailOf(row),
      parentId: "canva",
      snippet: asText(row.snippet) || asText(row.description) || [title, pages ? `${pages} 頁` : "", collection].filter(Boolean).join(" · "),
      syncedAt: Date.now(),
      collection,
      sourceDate,
    }];
  });
}

export function canvaDesignOpenUrl(item: Pick<ExternalMemoryItem, "id" | "webUrl">) {
  return item.webUrl || `https://www.canva.com/design/${item.id}/edit`;
}

export function scopesInclude(scopes: string[], needed: string) {
  return scopes.some((scope) => scope === needed || scope.startsWith(`${needed}:`));
}
