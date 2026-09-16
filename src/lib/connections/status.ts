import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  PROVIDERS,
  PROVIDER_ORDER,
  type ConnectionStatus,
  type ProviderId,
} from "./providers";
import { readConnection, clearConnection } from "./token-store.server";

/**
 * 連接狀態一律在伺服器端判斷：憑證有沒有設定、有沒有已授權的 token。
 * 前端只拿得到狀態與帳號名稱，永遠拿不到 token。
 */
export const getConnections = createServerFn({ method: "POST" }).handler(
  async (): Promise<ConnectionStatus[]> => {
    return PROVIDER_ORDER.map((id) => describe(id));
  },
);

function describe(id: ProviderId): ConnectionStatus {
  const spec = PROVIDERS[id];
  const configured = Boolean(process.env[spec.envKeys.clientId] && process.env[spec.envKeys.clientSecret]);
  const session = configured ? readConnection(id) : null;

  if (!configured) {
    return {
      id,
      name: spec.name,
      purpose: spec.purpose,
      reads: spec.reads,
      state: "unconfigured",
      detail: `這個環境還沒有 ${spec.name} 的應用程式憑證，所以無法開始授權。憑證要由平台以環境變數注入，不會寫進程式碼裡。`,
      accountLabel: null,
      lastSyncedAt: null,
      docsLabel: spec.docsLabel,
    };
  }

  if (!session) {
    return {
      id,
      name: spec.name,
      purpose: spec.purpose,
      reads: spec.reads,
      state: "needs-auth",
      detail: `按「連接」會跳到 ${spec.name} 的官方授權畫面，回來之後 token 只留在伺服器端。`,
      accountLabel: null,
      lastSyncedAt: null,
      docsLabel: spec.docsLabel,
    };
  }

  return {
    id,
    name: spec.name,
    purpose: spec.purpose,
    reads: spec.reads,
    state: "connected",
    detail: `已授權，可以讀取${spec.reads.slice(0, 3).join("、")}等內容。`,
    accountLabel: session.accountLabel,
    lastSyncedAt: session.lastSyncedAt,
    docsLabel: spec.docsLabel,
  };
}

const DisconnectSchema = z.object({ id: z.enum(["drive", "canva", "instagram"]) });

/** 中斷：把伺服器端的 token 清掉。 */
export const disconnectProvider = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (input && typeof input === "object" && "data" in input) {
      return DisconnectSchema.parse((input as { data: unknown }).data);
    }
    return DisconnectSchema.parse(input);
  })
  .handler(async ({ data }): Promise<{ ok: true }> => {
    clearConnection(data.id);
    return { ok: true };
  });
