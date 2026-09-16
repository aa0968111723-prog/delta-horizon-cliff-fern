import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DEFAULT_CREATIVE_SOURCES } from "@/lib/studio/campaign-seed";
import type { CreativeSourceItem } from "@/lib/studio/campaign-types";

export type DriveSearchMode = "live" | "demo" | "unavailable" | "gate-login";

export type DriveSearchResult = {
  mode: DriveSearchMode;
  items: CreativeSourceItem[];
  detail: string;
};

function demoItems(query: string): CreativeSourceItem[] {
  const q = query.trim().toLowerCase();
  return DEFAULT_CREATIVE_SOURCES.filter((item) => item.source === "google-drive").filter((item) => {
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

function asItems(data: unknown): CreativeSourceItem[] {
  const rows = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { files?: unknown }).files)
      ? ((data as { files: unknown[] }).files)
      : data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)
        ? ((data as { items: unknown[] }).items)
        : [];
  return rows.slice(0, 12).map((row, index) => {
    const rec = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    const title = String(rec.name ?? rec.title ?? `Drive 檔案 ${index + 1}`);
    const id = String(rec.id ?? rec.fileId ?? `drive_${index}`);
    return {
      id: `live_${id}`,
      source: "google-drive",
      title,
      subtitle: String(rec.mimeType ?? rec.path ?? "Google Drive"),
      thumbnailUrl: "/seed/cup.jpg",
      category: "Drive",
      tags: ["google-drive", "live"],
      date: String(rec.modifiedTime ?? rec.date ?? "").slice(0, 10),
    };
  });
}

const SearchSchema = z.object({
  query: z.string().max(120).optional(),
});

function parseSearch(input: unknown) {
  if (input && typeof input === "object" && "data" in input) {
    const inner = (input as { data: unknown }).data;
    if (inner && typeof inner === "object") return SearchSchema.parse(inner);
  }
  if (input && typeof input === "object") return SearchSchema.parse(input);
  return { query: "" };
}

export const searchClubDrive = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseSearch(input))
  .handler(async ({ data }): Promise<DriveSearchResult> => {
    const query = data.query?.trim() || "淡江禪學社";
    try {
      const { callTool, ConnectorType, GoogleDriveTools } = await import("@/lib/app-data/client.server");
      const result = await callTool(
        GoogleDriveTools.search,
        { query },
        { connectorType: ConnectorType.GoogleDrive },
      );
      if (result.loginRequired) {
        return {
          mode: "gate-login",
          items: demoItems(query),
          detail: "目前沒有 Drive 閘道憑證。預覽改用社團示範資料夾，不會在畫面存放 token。",
        };
      }
      if (!result.ok) {
        return {
          mode: "unavailable",
          items: demoItems(query),
          detail: result.errorMessage || "Drive 閘道暫時無法使用，改顯示示範素材。",
        };
      }
      const items = asItems(result.data);
      if (!items.length) {
        return {
          mode: "live",
          items: demoItems(query),
          detail: "閘道已連線，但這個關鍵字沒有檔案。下方仍列出社團示範資料夾。",
        };
      }
      return {
        mode: "live",
        items,
        detail: `已從 Google Drive 讀到 ${items.length} 筆。`,
      };
    } catch {
      return {
        mode: "demo",
        items: demoItems(query),
        detail: "此環境沒有 Drive 連接器。使用禪學社示範記憶，不是真實 OAuth。",
      };
    }
  });
