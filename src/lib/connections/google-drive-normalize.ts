import type { ExternalMemoryItem } from "./types.ts";

function parseJsonText(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function object(value: unknown): Record<string, unknown> | null {
  const parsed = parseJsonText(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function findRows(value: unknown, depth = 0): unknown[] {
  if (depth > 4) return [];
  const parsed = parseJsonText(value);
  if (Array.isArray(parsed)) return parsed;
  const row = object(parsed);
  if (!row) return [];
  for (const key of ["files", "items", "results", "entries", "data"]) {
    if (key in row) {
      const found = findRows(row[key], depth + 1);
      if (found.length) return found;
    }
  }
  const content = row.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      const partObject = object(part);
      const found = findRows(partObject?.text ?? partObject?.data ?? part, depth + 1);
      if (found.length) return found;
    }
  }
  return [];
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
