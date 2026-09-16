import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ConnectorType, GoogleDriveTools } from "@/lib/app-data/types";
import { classifyCallToolError } from "@/lib/app-data/errors";
import { isLoginRequired } from "@/lib/app-data/login";

const SearchInput = z.object({
  query: z.string().min(1).max(200),
});

export type DriveSearchResult =
  | {
      ok: true;
      items: { id: string; name: string; mime?: string; snippet?: string }[];
    }
  | { ok: false; error: string; loginRequired?: boolean; loginUrl?: string };

export const searchClubDrive = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const inner =
      input && typeof input === "object" && "data" in input && (input as { data: unknown }).data
        ? (input as { data: unknown }).data
        : input;
    return SearchInput.parse(inner);
  })
  .handler(async ({ data }): Promise<DriveSearchResult> => {
    const { callTool } = await import("@/lib/app-data/client.server");
    const result = await callTool(
      GoogleDriveTools.search,
      { query: data.query },
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
    const raw = result.data;
    const items = normalizeDrive(raw);
    return { ok: true, items };
  });

function normalizeDrive(raw: unknown): { id: string; name: string; mime?: string; snippet?: string }[] {
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
    };
  });
}

export const getConnectionCapabilities = createServerFn({ method: "POST" }).handler(async () => {
  return {
    drive: true,
    canva: Boolean(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET),
    instagram: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
    image: Boolean(process.env.XAI_API_KEY),
    copy: Boolean(process.env.XAI_API_KEY),
  };
});
