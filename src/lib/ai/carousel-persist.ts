import { directionPosterSvg, encodeUtf8Base64 } from "@/lib/ai/poster";
import { carouselPagesFromPlan, carouselPosterInput, carouselRowsForCampaign } from "@/lib/ai/carousel-pages";
import { persistGeneratedImage } from "@/lib/studio/raster";
import { putAssetBlob } from "@/lib/studio/assets-idb";
import { migrateAsset } from "@/lib/studio/assets";
import { uid } from "@/lib/studio/ids";
import type { CampaignPlan } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio-store";

export async function saveCarouselStills(
  plan: Pick<CampaignPlan, "carouselPages" | "hook" | "campaignName" | "insight" | "body" | "cta" | "subhead" | "colorMood">,
  opts: { eventName?: string; campaignId?: string | null; scheduledAt?: number; projectId?: string | null },
): Promise<string[]> {
  const pages = carouselPagesFromPlan(plan);
  const ids: string[] = [];
  for (let i = 0; i < pages.length; i++) {
    const input = carouselPosterInput(pages[i]!, i, {
      title: opts.eventName || plan.campaignName,
      name: "禪光",
      hook: plan.hook,
      palette: plan.colorMood,
    });
    const png = await persistGeneratedImage({
      base64: encodeUtf8Base64(directionPosterSvg(input)),
      mime: "image/svg+xml",
      width: 1080,
      height: 1350,
    });
    const id = uid("asset");
    await putAssetBlob(id, png.blob);
    useStudio.getState().addAsset(
      migrateAsset({
        id,
        name: `Carousel ${i + 1} · ${opts.eventName || "禪光"}`,
        kind: "image",
        category: "ig",
        mime: png.mime,
        width: 1080,
        height: 1350,
        tags: ["AI 生成", "Carousel", "輪播", opts.eventName || "禪光"],
        source: "generated",
        licenseNotes: "來源：AI Generated",
        licenseOwner: "禪光",
      }),
    );
    ids.push(id);
  }
  const campaignId = opts.campaignId;
  if (!campaignId || ids.length < 2) return ids;
  const store = useStudio.getState();
  const campaign = store.campaigns.find((row) => row.id === campaignId);
  store.updateCampaign(campaignId, {
    assetIds: [...new Set([...(campaign?.assetIds ?? []), ...ids])],
  });
  const rows = carouselRowsForCampaign(store.schedule, campaignId);
  if (!rows.length) {
    store.upsertSchedule({
      id: uid("sch"),
      projectId: opts.projectId ?? null,
      campaignId,
      kind: "carousel",
      title: `Carousel · ${opts.eventName || plan.campaignName}`,
      scheduledAt: opts.scheduledAt ?? Date.now(),
      publishedAt: null,
      status: "scheduled",
      caption: plan.hook,
      imageAssetId: ids[0],
      slideAssetIds: ids,
    });
    return ids;
  }
  rows.forEach((row) => {
    const prev = store.schedule.find((item) => item.id === row.id);
    if (!prev) return;
    store.upsertSchedule({
      ...prev,
      imageAssetId: ids[0],
      slideAssetIds: ids,
    });
  });
  return ids;
}
