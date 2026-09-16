import { searchDriveLive } from "@/lib/connect/sync";
import { searchCreative, type CreativeHit } from "./search.ts";
import { useStudio } from "@/stores/studio-store";

/** Live Drive / Canva / IG when connected, then brand memory. Never scrape. */
export async function gatherCreativeHits(query: string): Promise<{ hits: CreativeHit[]; note: string }> {
  const store = useStudio.getState();
  let remotes = store.remoteFiles;
  let note = "";
  try {
    const live = await searchDriveLive({ data: { query: query.slice(0, 80) || "茶會" } });
    note = live.note;
    if (live.igPosts?.length) store.upsertIgMemory(live.igPosts);
    if (live.files.length) {
      store.upsertRemoteFiles(live.files);
      const map = new Map(remotes.map((row) => [row.id, row]));
      for (const file of live.files) map.set(file.id, file);
      remotes = [...map.values()];
    }
  } catch {
    note = "改搜本機與品牌記憶。";
  }
  const s = useStudio.getState();
  const hits = searchCreative({
    query,
    assets: s.assets,
    projects: s.projects,
    campaigns: s.campaigns,
    igMemory: s.igMemory,
    remoteFiles: remotes,
  });
  return { hits: hits.slice(0, 12), note };
}
