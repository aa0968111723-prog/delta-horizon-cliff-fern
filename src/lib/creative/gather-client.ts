import { gatherCreativeMemory } from "@/lib/connect/oauth";
import { useCreative } from "@/stores/creative-store";

export async function gatherIntoStore(query: string, timeoutMs = 8000) {
  const q = query.trim().slice(0, 80);
  if (q.length < 2) return { items: 0, posts: 0, sources: [] as string[] };
  try {
    const gathered = await Promise.race([
      gatherCreativeMemory({ data: { query: q } }),
      new Promise<null>((resolve) => {
        globalThis.setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
    if (!gathered) return { items: 0, posts: 0, sources: [] as string[] };
    const { addMemory, ingestIgPosts } = useCreative.getState();
    for (const item of gathered.items) addMemory(item);
    if (gathered.posts?.length) ingestIgPosts(gathered.posts);
    return {
      items: gathered.items.length,
      posts: gathered.posts?.length ?? 0,
      sources: gathered.sources,
    };
  } catch {
    return { items: 0, posts: 0, sources: [] as string[] };
  }
}
