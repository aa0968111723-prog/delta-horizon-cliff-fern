import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { CallToolErrorKind, CallToolResult } from "@/lib/app-data";
import type { ExternalMemoryItem } from "./types";
import { normalizeDriveContent, normalizeDriveFiles } from "./google-drive-normalize";

const FolderRequestSchema = z.object({
  folderId: z.string().trim().min(1).max(300).default("root"),
});

const SearchRequestSchema = z.object({
  query: z.string().trim().min(1).max(300),
});

const ReadRequestSchema = z.object({
  fileId: z.string().trim().min(1).max(300),
});

type SafeConnectorError = {
  ok: false;
  kind: CallToolErrorKind;
  message: string;
  detail?: string;
  loginRequired?: boolean;
  loginUrl?: string;
};

type SafeConnectorSuccess<T> = { ok: true; data: T };

async function safeError(result: CallToolResult): Promise<SafeConnectorError> {
  const { classifyCallToolError } = await import("@/lib/app-data");
  const state = classifyCallToolError(result) ?? { kind: "error" as const, message: "Google Drive 暫時無法使用" };
  return {
    ok: false,
    kind: state.kind,
    message: state.message,
    detail: state.detail,
    loginRequired: result.loginRequired,
    loginUrl: result.loginUrl,
  };
}

async function callDrive(toolName: string, args: Record<string, unknown>) {
  const { callTool, ConnectorType } = await import("@/lib/app-data/client.server");
  return callTool(toolName, args, { connectorType: ConnectorType.GoogleDrive });
}

export const listDriveFolder = createServerFn({ method: "POST" })
  .validator((input: unknown) => FolderRequestSchema.parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input))
  .handler(async ({ data }): Promise<SafeConnectorSuccess<ExternalMemoryItem[]> | SafeConnectorError> => {
    const { GoogleDriveTools } = await import("@/lib/app-data");
    const result = await callDrive(GoogleDriveTools.listFolder, {
      folder_id: data.folderId,
      page_size: 40,
    });
    if (!result.ok) return safeError(result);
    return { ok: true, data: normalizeDriveFiles(result.data, data.folderId) };
  });

export const searchGoogleDrive = createServerFn({ method: "POST" })
  .validator((input: unknown) => SearchRequestSchema.parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input))
  .handler(async ({ data }): Promise<SafeConnectorSuccess<ExternalMemoryItem[]> | SafeConnectorError> => {
    const { GoogleDriveTools } = await import("@/lib/app-data");
    const result = await callDrive(GoogleDriveTools.search, { q: data.query, page_size: 40 });
    if (!result.ok) return safeError(result);
    return { ok: true, data: normalizeDriveFiles(result.data) };
  });

export const readGoogleDriveFile = createServerFn({ method: "POST" })
  .validator((input: unknown) => ReadRequestSchema.parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input))
  .handler(async ({ data }): Promise<SafeConnectorSuccess<{ text: string }> | SafeConnectorError> => {
    const { GoogleDriveTools } = await import("@/lib/app-data");
    const result = await callDrive(GoogleDriveTools.readFile, { file_id: data.fileId });
    if (!result.ok) return safeError(result);
    return { ok: true, data: { text: normalizeDriveContent(result.data) } };
  });
