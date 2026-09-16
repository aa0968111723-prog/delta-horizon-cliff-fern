import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { MEMORY_ITEMS, searchMemory, type MemoryItem } from "@/lib/club/memory";
import { ConnectorType, GoogleDriveTools } from "@/lib/app-data/types";
import { classifyCallToolError } from "@/lib/app-data/errors";

export type SearchHit = MemoryItem & { live?: boolean };

function parseInput(input: unknown) {
  const inner = input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input;
  return z.object({ query: z.string().max(120) }).parse(inner);
}

function asDriveHits(data: unknown): SearchHit[] {
  if (!data) return [];
  const rows = Array.isArray(data) ? data : typeof data === "object" && data && "files" in data ? (data as { files: unknown[] }).files : [];
  return rows.slice(0, 12).map((row, index) => {
    const item = row as { id?: string; name?: string; mimeType?: string; modifiedTime?: string };
    return {
      id: item.id || `drive_${index}`,
      source: "drive",
      title: item.name || "未命名檔案",
      subtitle: "Google Drive",
      tags: ["drive"],
      kind: "asset",
      date: (item.modifiedTime || "").slice(0, 10),
      thumb: "/seed/campus.svg",
      notes: item.mimeType || "Drive 檔案",
      live: true,
    };
  });
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
    const local = searchMemory(data.query);
    const { getRequest } = await import("@tanstack/react-start/server");
    const { readBlobFromCookie } = await import("@/lib/connections/vault.server");
    const { fetchCanvaDesigns, fetchInstagramMedia } = await import("@/lib/connections/live");
    const req = getRequest();
    const blob = await readBlobFromCookie(req?.headers.get("cookie") ?? null);
    const [liveCanva, liveIg] = await Promise.all([fetchCanvaDesigns(blob), fetchInstagramMedia(blob)]);
    let drive: SearchHit[] = [];
    let loginRequired = false;
    let loginUrl: string | undefined;
    let driveDetail = "尚未連接時，先顯示社團 Creative Memory。";

    try {
      const { callTool } = await import("@/lib/app-data/client.server");
      const result = await Promise.race([
        callTool(
          GoogleDriveTools.search,
          { query: data.query || "淡江 禪學社" },
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
        driveDetail = drive.length ? `找到 ${drive.length} 個 Drive 檔案` : "Drive 已連線，這次沒有符合的檔。";
      } else {
        const classified = classifyCallToolError(result);
        driveDetail = classified?.message || result.errorMessage || "Drive 暫時無法搜尋。";
      }
    } catch {
      driveDetail = "預覽環境可能還讀不到 Google Drive，社團記憶仍可搜。";
    }

    const q = data.query.trim().toLowerCase();
    const matchLive = (item: SearchHit) => {
      if (!q) return true;
      const blobText = [item.title, item.subtitle, item.notes, item.caption, ...item.tags].join(" ").toLowerCase();
      return q.split(/\s+/).every((part) => blobText.includes(part));
    };
    const groups: Record<string, SearchHit[]> = {
      drive: [...drive, ...local.filter((item) => item.source === "drive")],
      canva: [...liveCanva.filter(matchLive), ...local.filter((item) => item.source === "canva")],
      instagram: [...liveIg.filter(matchLive), ...local.filter((item) => item.source === "instagram")],
      generated: local.filter((item) => item.source === "generated"),
    };
    const found = Object.values(groups).reduce((n, list) => n + list.length, 0);
    return { ok: true, query: data.query, groups, found, loginRequired, loginUrl, driveDetail };
  });

export { MEMORY_ITEMS };
