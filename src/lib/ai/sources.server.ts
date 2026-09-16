import type { CitedSource } from "@/lib/studio/types";

export async function collectLiveSources(query: string): Promise<CitedSource[]> {
  const out: CitedSource[] = [];
  try {
    const { executeDriveSearch } = await import("./drive.server");
    const drive = await executeDriveSearch(query);
    if (drive.ok) {
      for (const item of drive.items.slice(0, 3)) {
        out.push({ source: "drive", label: item.name, detail: "Google Drive" });
      }
    }
  } catch {
    /* Drive optional */
  }
  try {
    const { searchCanvaDesigns } = await import("@/lib/oauth/canva.server");
    const canva = await searchCanvaDesigns(query);
    for (const item of canva.slice(0, 2)) {
      out.push({ source: "canva", label: item.title, detail: "Canva" });
    }
  } catch {
    /* Canva optional */
  }
  try {
    const { searchInstagramMedia } = await import("@/lib/oauth/instagram.server");
    const ig = await searchInstagramMedia(query);
    for (const item of ig.slice(0, 2)) {
      out.push({
        source: "instagram",
        label: item.caption.split("\n")[0]?.slice(0, 24) || "IG 貼文",
        detail: item.timestamp ? `Instagram / ${item.timestamp.slice(0, 10)}` : "Instagram",
      });
    }
  } catch {
    /* IG optional */
  }
  return out;
}
