import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { unwrapServerInput } from "./json.ts";
import type { ConnectorResult, ExternalMemoryItem, OfficialProviderStatus } from "./types.ts";
import { genericError, unavailableError } from "./safe-result.ts";

const SearchSchema = z.object({
  query: z.string().trim().max(200).optional(),
});

export const getInstagramStatus = createServerFn({ method: "POST" }).handler(async (): Promise<OfficialProviderStatus> => {
  const { currentInstagramStatus, readInstagramProfileName } = await import("./instagram-oauth.server.ts");
  const status = await currentInstagramStatus();
  if (!status.connected) return status;
  try {
    const username = await readInstagramProfileName();
    return username ? { ...status, username } : status;
  } catch {
    return status;
  }
});

export const startInstagramConnect = createServerFn({ method: "POST" }).handler(async (): Promise<ConnectorResult<{ url: string }>> => {
  const { currentInstagramStatus, listInstagramViaMcp, startInstagramOAuthUrl } = await import("./instagram-oauth.server.ts");
  const status = await currentInstagramStatus();
  if (!status.available) {
    return unavailableError("Instagram 尚未在此環境提供", "沒有 MCP catalog，也沒有平台注入的 Instagram OAuth client。這裡不接受貼 Token。");
  }
  if (status.mode === "mcp") {
    const probe = await listInstagramViaMcp();
    if (!probe.ok && probe.loginRequired && probe.loginUrl) {
      return { ok: true, data: { url: probe.loginUrl } };
    }
    if (!probe.ok) return probe;
    return genericError("Instagram MCP 已可用，請直接同步");
  }
  return startInstagramOAuthUrl();
});

export const listInstagramMedia = createServerFn({ method: "POST" })
  .validator((input: unknown) => SearchSchema.parse(unwrapServerInput(input) ?? {}))
  .handler(async ({ data }): Promise<ConnectorResult<ExternalMemoryItem[]>> => {
    try {
      const { listInstagramRecords } = await import("./instagram-oauth.server.ts");
      return listInstagramRecords(data.query);
    } catch (error) {
      return genericError(error instanceof Error ? error.message : "Instagram 暫時無法使用");
    }
  });

export const disconnectInstagram = createServerFn({ method: "POST" }).handler(async (): Promise<ConnectorResult<{ cleared: true }>> => {
  const { revokeInstagramSession } = await import("./instagram-oauth.server.ts");
  await revokeInstagramSession();
  return { ok: true, data: { cleared: true } };
});

export const getInstagramInsightsStatus = createServerFn({ method: "POST" }).handler(async () => {
  const { readInstagramInsights } = await import("./instagram-oauth.server.ts");
  return readInstagramInsights();
});
