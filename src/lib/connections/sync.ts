import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ProviderId } from "./providers";
import type { RemoteItem, SyncResult } from "./remote";

export type { RemoteItem, RemoteItemKind, SyncResult } from "./remote";

function unwrapId(input: unknown): ProviderId {
  const schema = z.object({ id: z.enum(["drive", "canva", "instagram"]) });
  if (input && typeof input === "object" && "data" in input) {
    return schema.parse((input as { data: unknown }).data).id;
  }
  return schema.parse(input).id;
}

/**
 * 客戶端可呼叫的 RPC。實際讀 token、打 Drive / Canva / IG 的程式在
 * `sync.server.ts`，這個檔案只做橋樑，所以瀏覽器不會載入伺服器模組。
 */
export const syncProvider = createServerFn({ method: "POST" })
  .validator((input: unknown) => unwrapId(input))
  .handler(async ({ data: id }): Promise<SyncResult> => {
    const { runSync } = await import("./sync.server");
    return runSync(id);
  });

export const searchRemote = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const schema = z.object({
      query: z.string().max(80).catch(""),
      id: z.enum(["drive", "canva", "instagram"]).optional(),
    });
    if (input && typeof input === "object" && "data" in input) {
      return schema.parse((input as { data: unknown }).data);
    }
    return schema.parse(input);
  })
  .handler(async ({ data }): Promise<{ items: RemoteItem[]; note: string }> => {
    const { runSearch } = await import("./sync.server");
    return runSearch(data.query, data.id);
  });
