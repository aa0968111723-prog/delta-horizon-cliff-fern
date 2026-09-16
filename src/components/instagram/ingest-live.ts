import { ingestUrlToLibrary } from "@/lib/zen/ingest-client";
import { analysisFromInsights, nextCreateHint } from "@/lib/zen/insights";
import type { LiveIgPost } from "@/lib/ai/oauth";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export async function ingestOfficialIgPosts(posts: LiveIgPost[]) {
  const addIgPost = useCreative.getState().addIgPost;
  const addMemory = useCreative.getState().addMemory;
  const addAsset = useStudio.getState().addAsset;
  for (const live of posts.slice(0, 12)) {
    const pixelId = `asset_${live.id}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 60);
    const ingested = live.mediaUrl
      ? await ingestUrlToLibrary({
          id: pixelId,
          name: live.hook || live.caption.slice(0, 24),
          source: "instagram",
          url: live.mediaUrl,
          tags: [live.mediaType],
          addAsset,
        })
      : false;
    const assetId = ingested ? pixelId : "asset_tamsui";
    addIgPost({
      ...live,
      assetId,
      analysis: analysisFromInsights(live),
    });
    addMemory({
      id: live.id.startsWith("ig_") ? `mem_${live.id}` : `mem_ig_${live.id}`,
      source: "instagram",
      title: live.hook || live.caption.slice(0, 24),
      subtitle: `Instagram / ${new Date(live.postedAt).toISOString().slice(0, 10)}`,
      tags: [live.mediaType, "官方"],
      kind: "IG",
      url: live.permalink,
      thumbAssetId: ingested ? pixelId : undefined,
    });
  }
  return nextCreateHint(useCreative.getState().igPosts);
}
