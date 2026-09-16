import type { ExternalMemoryItem } from "./types.ts";
import { asObject, asText, findRows, parseJsonText } from "./json.ts";

function object(value: unknown) {
  return asObject(value);
}

function text(value: unknown) {
  return asText(value);
}

export function normalizeDriveFiles(value: unknown, parentId = "root"): ExternalMemoryItem[] {
  return findRows(value).flatMap((value) => {
    const row = object(value);
    if (!row) return [];
    const id = text(row.id) || text(row.fileId) || text(row.file_id);
    const title = text(row.name) || text(row.title) || text(row.fileName) || text(row.file_name);
    if (!id || !title) return [];
    const mimeType = text(row.mimeType) || text(row.mime_type) || text(row.type);
    const parents = Array.isArray(row.parents) ? row.parents : [];
    return [{
      id,
      provider: "google-drive" as const,
      title,
      mimeType,
      isFolder: mimeType === "application/vnd.google-apps.folder" || row.isFolder === true || row.is_folder === true,
      modifiedAt: text(row.modifiedTime) || text(row.modified_time) || text(row.updatedAt),
      webUrl: text(row.webViewLink) || text(row.web_url) || text(row.url),
      thumbnailUrl: text(row.thumbnailLink) || text(row.thumbnail_url),
      parentId: text(parents[0]) || text(row.parentId) || text(row.parent_id) || parentId,
      snippet: text(row.text) || text(row.snippet) || text(row.description) || text(row.content_snippet),
      syncedAt: Date.now(),
    }];
  });
}

export function normalizeDriveContent(value: unknown) {
  const parsed = parseJsonText(value);
  if (typeof parsed === "string") return parsed.slice(0, 12_000);
  const row = object(parsed);
  if (!row) return "";
  for (const key of ["text", "content", "body", "data", "description"]) {
    const candidate = row[key];
    if (typeof candidate === "string") return candidate.slice(0, 12_000);
    if (Array.isArray(candidate)) {
      const joined = candidate
        .map((part) => {
          const item = object(part);
          return text(item?.text) || text(item?.content);
        })
        .filter(Boolean)
        .join("\n");
      if (joined) return joined.slice(0, 12_000);
    }
  }
  return "";
}
