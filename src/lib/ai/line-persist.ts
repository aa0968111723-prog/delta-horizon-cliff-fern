import { directionPosterSvg, encodeUtf8Base64 } from "@/lib/ai/poster";
import { attachLineStill, linePosterInput } from "@/lib/ai/line-still";
import { persistGeneratedImage } from "@/lib/studio/raster";
import { putAssetBlob } from "@/lib/studio/assets-idb";
import { migrateAsset } from "@/lib/studio/assets";
import { uid } from "@/lib/studio/ids";
import type { CampaignPlan } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio-store";

export async function saveLineStill(
  plan: Pick<CampaignPlan, "hook" | "campaignName" | "subhead" | "cta" | "colorMood" | "lineCopy">,
  opts: { eventName?: string; campaignId?: string | null; scheduledAt?: number; projectId?: string | null },
): Promise<string> {
  const input = linePosterInput(plan);
  const png = await persistGeneratedImage({
    base64: encodeUtf8Base64(directionPosterSvg(input)),
    mime: "image/svg+xml",
    width: 1040,
    height: 1040,
  });
  const id = uid("asset");
  await putAssetBlob(id, png.blob);
  useStudio.getState().addAsset(
    migrateAsset({
      id,
      name: `LINE · ${opts.eventName || "禪光"}`,
      kind: "image",
      category: "ig",
      mime: png.mime,
      width: 1040,
      height: 1040,
      tags: ["AI 生成", "LINE", "宣傳圖", opts.eventName || "禪光"],
      source: "generated",
      licenseNotes: "來源：AI Generated",
      licenseOwner: "禪光",
    }),
  );
  const campaignId = opts.campaignId;
  if (!campaignId) return id;
  const store = useStudio.getState();
  const campaign = store.campaigns.find((row) => row.id === campaignId);
  store.updateCampaign(campaignId, {
    assetIds: [...new Set([...(campaign?.assetIds ?? []), id])],
  });
  const rows = attachLineStill(store.schedule, id, campaignId);
  const attached = rows.filter((item) => item.kind === "line" && item.campaignId === campaignId && item.imageAssetId === id);
  if (!attached.length) {
    store.upsertSchedule({
      id: uid("sch"),
      projectId: opts.projectId ?? null,
      campaignId,
      kind: "line",
      title: `LINE · ${opts.eventName || plan.campaignName}`,
      scheduledAt: opts.scheduledAt ?? Date.now(),
      publishedAt: null,
      status: "scheduled",
      caption: plan.lineCopy || plan.hook,
      imageAssetId: id,
    });
    return id;
  }
  attached.forEach((item) => store.upsertSchedule(item));
  return id;
}
