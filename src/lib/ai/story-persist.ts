import { directionPosterSvg, encodeUtf8Base64, licenseFromLook, type SourceLook } from "@/lib/ai/poster";
import { storyFrameLines, storyPosterInput, storyRowsForFrames } from "@/lib/ai/story-frames";
import { persistGeneratedImage } from "@/lib/studio/raster";
import { putAssetBlob } from "@/lib/studio/assets-idb";
import { migrateAsset } from "@/lib/studio/assets";
import { uid } from "@/lib/studio/ids";
import type { CampaignPlan } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio-store";

export async function saveStoryStills(
  plan: Pick<CampaignPlan, "storyFrames" | "storyBeats" | "hook" | "campaignName" | "subhead" | "cta" | "colorMood">,
  opts: { eventName?: string; campaignId?: string | null; scheduledAt?: number; projectId?: string | null; look?: SourceLook },
): Promise<string[]> {
  const frames = storyFrameLines(plan);
  const ids: string[] = [];
  for (let i = 0; i < frames.length; i++) {
    const input = storyPosterInput(frames[i]!, i, { eventName: opts.eventName, palette: plan.colorMood, look: opts.look });
    const png = await persistGeneratedImage({
      base64: encodeUtf8Base64(directionPosterSvg(input)),
      mime: "image/svg+xml",
      width: 1080,
      height: 1920,
    });
    const id = uid("asset");
    await putAssetBlob(id, png.blob);
    useStudio.getState().addAsset(
      migrateAsset({
        id,
        name: `Story ${i + 1} · ${opts.eventName || "禪光"}`,
        kind: "image",
        category: "story-asset",
        mime: png.mime,
        width: 1080,
        height: 1920,
        tags: ["AI 生成", "Story", "限動", opts.eventName || "禪光"],
        source: "generated",
        licenseNotes: licenseFromLook(opts.look),
        licenseOwner: "禪光",
      }),
    );
    ids.push(id);
  }
  const campaignId = opts.campaignId;
  if (!campaignId) return ids;
  const store = useStudio.getState();
  const campaign = store.campaigns.find((row) => row.id === campaignId);
  store.updateCampaign(campaignId, {
    assetIds: [...new Set([...(campaign?.assetIds ?? []), ...ids])],
  });
  const rows = storyRowsForFrames(store.schedule, frames, campaignId);
  const baseAt = opts.scheduledAt ?? Date.now();
  rows.forEach((row) => {
    const prev = row.existingId ? store.schedule.find((item) => item.id === row.existingId) : undefined;
    store.upsertSchedule({
      id: prev?.id ?? uid("sch"),
      projectId: opts.projectId ?? prev?.projectId ?? null,
      campaignId,
      kind: "story",
      title: `Story ${row.index + 1} · ${opts.eventName || plan.campaignName}`,
      scheduledAt: prev?.scheduledAt ?? baseAt + row.index * 90_000,
      publishedAt: null,
      status: "scheduled",
      caption: row.caption,
      body: frames[row.index],
      imageAssetId: ids[row.index],
    });
  });
  return ids;
}
