import { ConnectorType, GoogleDriveTools } from "@/lib/app-data/types";
import { classifyCallToolError } from "@/lib/app-data/errors";
import { isLoginRequired } from "@/lib/app-data/login";
import { expandCreativeQuery } from "@/lib/zen/search";
import type { DriveSearchResult } from "./drive";

export async function executeDriveSearch(query: string, folderHint?: string): Promise<DriveSearchResult> {
  const { expanded } = expandCreativeQuery(query);
  const scoped = folderHint?.trim() ? `${folderHint.trim()} ${expanded}` : expanded;
  const { callTool } = await import("@/lib/app-data/client.server");
  const result = await callTool(
    GoogleDriveTools.search,
    { query: scoped },
    { connectorType: ConnectorType.GoogleDrive },
  );
  if (isLoginRequired(result)) {
    return {
      ok: false,
      error: "需要透過官方 Google 連接才能讀 Drive。",
      loginRequired: true,
      loginUrl: result.loginUrl,
    };
  }
  if (!result.ok) {
    const classified = classifyCallToolError(result);
    return { ok: false, error: classified?.message ?? result.errorMessage ?? "Drive 暫時無法搜尋。" };
  }
  return { ok: true, items: normalizeDrive(result.data) };
}

export type DriveReadResult =
  | {
      ok: true;
      name?: string;
      mime?: string;
      excerpt?: string;
      imageB64?: string;
      imageMime?: string;
      imageUrl?: string;
    }
  | { ok: false; error: string; loginRequired?: boolean; loginUrl?: string };

export async function executeDriveRead(fileId: string): Promise<DriveReadResult> {
  const { callTool } = await import("@/lib/app-data/client.server");
  const attempts: Record<string, unknown>[] = [{ fileId }, { id: fileId }, { file_id: fileId }];
  let last: DriveReadResult = { ok: false, error: "Drive 檔案讀不到。" };
  for (const args of attempts) {
    const result = await callTool(GoogleDriveTools.readFile, args, {
      connectorType: ConnectorType.GoogleDrive,
    });
    if (isLoginRequired(result)) {
      return {
        ok: false,
        error: "需要透過官方 Google 連接才能讀 Drive。",
        loginRequired: true,
        loginUrl: result.loginUrl,
      };
    }
    if (!result.ok) {
      const classified = classifyCallToolError(result);
      last = { ok: false, error: classified?.message ?? result.errorMessage ?? "Drive 檔案讀不到。" };
      continue;
    }
    const { excerptFromDriveRead } = await import("@/lib/zen/ingest");
    const parsed = excerptFromDriveRead(result.data);
    return { ok: true, ...parsed };
  }
  return last;
}

function pickUrl(row: Record<string, unknown>) {
  for (const key of ["webViewLink", "webContentLink", "url", "link", "alternateLink"]) {
    const value = row[key];
    if (typeof value === "string" && value.startsWith("http")) return value;
  }
  return undefined;
}

function normalizeDrive(
  raw: unknown,
): { id: string; name: string; mime?: string; snippet?: string; url?: string; thumbnail?: string }[] {
  if (!raw) return [];
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === "object" && raw && "files" in raw && Array.isArray((raw as { files: unknown[] }).files)
      ? (raw as { files: unknown[] }).files
      : typeof raw === "object" && raw && "results" in raw && Array.isArray((raw as { results: unknown[] }).results)
        ? (raw as { results: unknown[] }).results
        : [];
  return list.slice(0, 24).map((item, i) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      id: String(row.id ?? row.fileId ?? `drive_${i}`),
      name: String(row.name ?? row.title ?? "未命名"),
      mime: typeof row.mimeType === "string" ? row.mimeType : undefined,
      snippet: typeof row.snippet === "string" ? row.snippet : typeof row.description === "string" ? row.description : undefined,
      url: pickUrl(row),
      thumbnail:
        typeof row.thumbnailLink === "string" && row.thumbnailLink.startsWith("http")
          ? row.thumbnailLink
          : typeof row.thumbnail === "string" && row.thumbnail.startsWith("http")
            ? row.thumbnail
            : undefined,
    };
  });
}
