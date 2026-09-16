import type { CitedSource } from "@/lib/studio/types";
import { composeMemoryNotes } from "@/lib/zen/ingest";

export type LiveKnowledge = {
  sources: CitedSource[];
  notes: string;
};

export async function collectLiveSources(query: string): Promise<CitedSource[]> {
  const live = await collectLiveKnowledge(query);
  return live.sources;
}

export async function collectLiveKnowledge(query: string): Promise<LiveKnowledge> {
  const sources: CitedSource[] = [];
  const noteLines: string[] = [];

  try {
    const { executeDriveSearch, executeDriveRead } = await import("./drive.server");
    const drive = await executeDriveSearch(query);
    if (drive.ok) {
      for (const item of drive.items.slice(0, 3)) {
        sources.push({ source: "drive", label: item.name, detail: "Google Drive" });
        let excerpt = item.snippet?.slice(0, 180);
        try {
          const read = await executeDriveRead(item.id);
          if (read.ok) {
            excerpt = read.excerpt?.slice(0, 180) || excerpt;
            if (read.imageUrl || read.imageB64) {
              excerpt = excerpt || "活動照片／文宣圖";
            }
          }
        } catch {
          /* optional */
        }
        noteLines.push(`Google Drive / ${item.name}${excerpt ? `：${excerpt}` : ""}`);
      }
    }
  } catch {
    /* Drive optional */
  }

  try {
    const { searchCanvaDesigns } = await import("@/lib/oauth/canva.server");
    const canva = await searchCanvaDesigns(query);
    for (const item of canva.slice(0, 2)) {
      sources.push({ source: "canva", label: item.title, detail: "Canva" });
      noteLines.push(`Canva / ${item.title}`);
    }
  } catch {
    /* Canva optional */
  }

  try {
    const { searchInstagramMedia } = await import("@/lib/oauth/instagram.server");
    const ig = await searchInstagramMedia(query);
    for (const item of ig.slice(0, 2)) {
      const date = item.timestamp ? item.timestamp.slice(0, 10) : "";
      sources.push({
        source: "instagram",
        label: item.caption.split("\n")[0]?.slice(0, 24) || "IG 貼文",
        detail: date ? `Instagram / ${date}` : "Instagram",
      });
      noteLines.push(
        `Instagram / ${date || "歷史"}：${(item.caption.split("\n")[0] || item.caption).slice(0, 80)}`,
      );
    }
  } catch {
    /* IG optional */
  }

  return { sources, notes: composeMemoryNotes(noteLines) };
}
