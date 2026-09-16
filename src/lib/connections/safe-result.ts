import type { CallToolResult } from "@/lib/app-data";
import type { ConnectorUiState, SafeConnectorError } from "./types.ts";

export async function safeConnectorError(
  result: CallToolResult,
  fallback = "這個連接暫時無法使用",
): Promise<SafeConnectorError> {
  const { classifyCallToolError } = await import("@/lib/app-data");
  const state = classifyCallToolError(result) ?? { kind: "error" as const, message: fallback };
  return {
    ok: false,
    kind: state.kind as ConnectorUiState,
    message: state.message,
    detail: state.detail,
    loginRequired: result.loginRequired,
    loginUrl: result.loginUrl,
  };
}

export function unavailableError(message: string, detail?: string): SafeConnectorError {
  return { ok: false, kind: "unavailable", message, detail };
}

export function oauthNeededError(message: string, detail?: string): SafeConnectorError {
  return { ok: false, kind: "not_connected", message, detail };
}

export function genericError(message: string, detail?: string): SafeConnectorError {
  return { ok: false, kind: "error", message, detail };
}
