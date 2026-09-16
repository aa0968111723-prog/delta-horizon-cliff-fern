import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { parseIdea } from "@/lib/club/idea";
import { MEMORY_ITEMS, searchMemory, type MemoryItem } from "@/lib/club/memory";
import { ConnectorType, GoogleDriveTools } from "@/lib/app-data/types";
import { classifyCallToolError } from "@/lib/app-data/errors";
import { driveSearchQuery } from "@/lib/connections/presets";
import { asDriveHits, mergeRanked } from "./hits.ts";

export type SearchHit = MemoryItem & { live?: boolean; mimeType?: string };

function parseInput(input: unknown) {
  const inner = input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input;
  return z
    .object({
      query: z.string().max(120),
      folderName: z.string().max(80).optional(),
      folderId: z.string().max(80).optional(),
    })
    .parse(inner);
}

export const searchCreative = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseInput(input))
  .handler(async ({ data }): Promise<{
    ok: true;
    query: string;
    groups: Record<string, SearchHit[]>;
    found: number;
    loginRequired?: boolean;
    loginUrl?: string;
    driveDetail: string;
  }> => {
    const parsed = parseIdea(data.query);
    const query = parsed.searchQuery || data.query;
    const driveQuery = driveSearchQuery(query || "淡江 禪學社", data.folderName);
    const local = searchMemory(query);
    const { getRequest } = await import("@tanstack/react-start/server");
    const { readBlobFromCookie } = await import("@/lib/connections/vault.server");
    const { fetchCanvaDesigns, fetchInstagramMedia } = await import("@/lib/connections/live");
    const req = getRequest();
    const blob = await readBlobFromCookie(req?.headers.get("cookie") ?? null);
    const [liveCanva, liveIg] = await Promise.all([fetchCanvaDesigns(blob, query), fetchInstagramMedia(blob)]);
    let drive: SearchHit[] = [];
    let loginRequired = false;
    let loginUrl: string | undefined;
    let driveDetail = "尚未連接時，先顯示社團 Creative Memory。";

    try {
      const { callTool } = await import("@/lib/app-data/client.server");
      const listed = data.folderId
        ? await Promise.race([
            callTool(
              GoogleDriveTools.listFolder,
              { folder_id: data.folderId, folderId: data.folderId, id: data.folderId },
              { connectorType: ConnectorType.GoogleDrive },
            ),
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error("drive-timeout")), 4000);
            }),
          ]).catch(() => null)
        : null;
      const result = listed?.ok
        ? listed
        : await Promise.race([
            callTool(
              GoogleDriveTools.search,
              { query: driveQuery, q: driveQuery },
              { connectorType: ConnectorType.GoogleDrive },
            ),
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error("drive-timeout")), 4000);
            }),
          ]);
      if (result.loginRequired) {
        loginRequired = true;
        loginUrl = result.loginUrl;
        driveDetail = "需要透過官方 Google 連接才能讀取 Drive。";
      } else if (result.ok) {
        drive = asDriveHits(result.data);
        driveDetail = drive.length
          ? `找到 ${drive.length} 個 Drive 檔案${data.folderName ? ` · ${data.folderName}` : ""}`
          : "Drive 已連線，這次沒有符合的檔。";
      } else {
        const classified = classifyCallToolError(result);
        driveDetail = classified?.message || result.errorMessage || "Drive 暫時無法搜尋。";
      }
    } catch {
      driveDetail = "預覽環境可能還讀不到 Google Drive，社團記憶仍可搜。";
    }

    const groups: Record<string, SearchHit[]> = {
      drive: mergeRanked(query, drive, local.filter((item) => item.source === "drive")),
      canva: mergeRanked(query, liveCanva, local.filter((item) => item.source === "canva")),
      instagram: mergeRanked(query, liveIg, local.filter((item) => item.source === "instagram")),
      generated: mergeRanked(
        query,
        [],
        local.filter((item) => item.source === "generated"),
      ),
    };
    const found = Object.values(groups).reduce((n, list) => n + list.length, 0);
    return { ok: true, query: data.query, groups, found, loginRequired, loginUrl, driveDetail };
  });

export { MEMORY_ITEMS };
