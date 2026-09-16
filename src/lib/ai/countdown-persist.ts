import { directionPosterSvg, encodeUtf8Base64 } from "@/lib/ai/poster";
import { countdownStillLine, isCountdownStillItem, storyPosterInput } from "@/lib/ai/story-frames";
import { persistGeneratedImage } from "@/lib/studio/raster";
import { putAssetBlob } from "@/lib/studio/assets-idb";
import { migrateAsset } from "@/lib/studio/assets";
import { uid } from "@/lib/studio/ids";
import type { CampaignPlan } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio-store";

export async function saveCountdownStills(
  plan: Pick<CampaignPlan, "campaignName" | "colorMood">,
  opts: { eventName?: string; campaignId?: string | null },
): Promise<string[]> {
  const campaignId = opts.campaignId;
  if (!campaignId) return [];
  const store = useStudio.getState();
  const rows = store.schedule.filter((item) => item.campaignId === campaignId && isCountdownStillItem(item));
  const ids: string[] = [];
  for (const item of rows) {
    const line = countdownStillLine(item);
    const png = await persistGeneratedImage({
      base64: encodeUtf8Base64(
        directionPosterSvg(storyPosterInput(line, 0, { eventName: opts.eventName || plan.campaignName, palette: plan.colorMood })),
      ),
      mime: "image/svg+xml",
      width: 1080,
      height: 1920,
    });
    const id = uid("asset");
    await putAssetBlob(id, png.blob);
    useStudio.getState().addAsset(
      migrateAsset({
        id,
        name: `${item.kind === "countdown" ? "倒數" : "當日"} · ${opts.eventName || plan.campaignName}`,
        kind: "image",
        category: "story-asset",
        mime: png.mime,
        width: 1080,
        height: 1920,
        tags: ["AI 生成", "Story", item.kind === "countdown" ? "倒數" : "當日", opts.eventName || "禪光"],
        source: "generated",
        licenseNotes: "來源：AI Generated",
        licenseOwner: "禪光",
      }),
    );
    ids.push(id);
    useStudio.getState().upsertSchedule({ ...item, imageAssetId: id });
  }
  if (ids.length) {
    const campaign = useStudio.getState().campaigns.find((row) => row.id === campaignId);
    useStudio.getState().updateCampaign(campaignId, {
      assetIds: [...new Set([...(campaign?.assetIds ?? []), ...ids])],
    });
  }
  return ids;
}
