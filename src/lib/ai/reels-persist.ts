import { blobFromBase64, bytesToBase64 } from "../studio/bytes.ts";
import { putAssetBlob, getAssetBlob } from "../studio/assets-idb.ts";
import { persistGeneratedImage } from "../studio/raster.ts";
import { uid } from "../studio/ids.ts";
import { directionPosterSvg, encodeUtf8Base64, reelsAtmosphereInput } from "./poster.ts";
import { encodeReelsFromPng, type EncodedReels } from "./reels-encode.ts";
import { attachReelsCover, attachReelsVideo, isVideoMime, reelsCoverAsset, reelsVideoAsset } from "./reels-asset.ts";
import type { CampaignPlan } from "../studio/types.ts";
import { useStudio } from "@/stores/studio-store";

export async function videoBase64FromAsset(assetId?: string): Promise<string | undefined> {
  if (!assetId) return undefined;
  const blob = await getAssetBlob(assetId);
  if (!blob || (blob.type && !isVideoMime(blob.type))) return undefined;
  return bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
}

export async function saveReelsFilm(
  encoded: EncodedReels,
  opts: { eventName?: string; campaignId?: string | null },
): Promise<string> {
  const id = uid("asset");
  await putAssetBlob(id, blobFromBase64(encoded.base64, encoded.mime));
  const meta = reelsVideoAsset({
    id,
    eventName: opts.eventName,
    width: encoded.width,
    height: encoded.height,
  });
  const store = useStudio.getState();
  store.addAsset(meta);
  if (opts.campaignId) {
    const campaign = store.campaigns.find((row) => row.id === opts.campaignId);
    store.updateCampaign(opts.campaignId, {
      videoAssetId: id,
      assetIds: [...new Set([...(campaign?.assetIds ?? []), id])],
    });
  }
  for (const item of attachReelsVideo(store.schedule, id, opts.campaignId)) {
    if (item.videoAssetId === id) store.upsertSchedule(item);
  }
  return id;
}

export async function saveReelsAtmosphere(
  plan: Pick<CampaignPlan, "colorMood" | "campaignName">,
  opts: { eventName?: string; campaignId?: string | null },
): Promise<{ id: string; base64: string; mime: string }> {
  const png = await persistGeneratedImage({
    base64: encodeUtf8Base64(directionPosterSvg(reelsAtmosphereInput(plan.colorMood))),
    mime: "image/svg+xml",
    width: 1080,
    height: 1920,
  });
  const id = uid("asset");
  await putAssetBlob(id, png.blob);
  const store = useStudio.getState();
  store.addAsset(reelsCoverAsset({ id, eventName: opts.eventName || plan.campaignName, mime: png.mime, width: 1080, height: 1920 }));
  const campaignId = opts.campaignId;
  if (campaignId) {
    const campaign = store.campaigns.find((row) => row.id === campaignId);
    store.updateCampaign(campaignId, {
      assetIds: [...new Set([...(campaign?.assetIds ?? []), id])],
    });
    for (const item of attachReelsCover(store.schedule, id, campaignId)) {
      if (item.imageAssetId === id) store.upsertSchedule(item);
    }
  }
  return { id, base64: png.base64, mime: png.mime };
}

async function encodeReelsFilmFromCover(
  coverBase64: string,
  plan: Pick<CampaignPlan, "campaignName" | "reelsScript" | "hook">,
  opts: { eventName?: string; campaignId?: string | null },
) {
  const script = plan.reelsScript;
  if (!script) return;
  try {
    const encoded = await encodeReelsFromPng(coverBase64, script, script.hook || plan.hook);
    if (!encoded) return;
    await saveReelsFilm(encoded, { eventName: opts.eventName || plan.campaignName, campaignId: opts.campaignId });
  } catch {
    /* atmosphere cover is enough for IG Preview */
  }
}

export async function saveReelsKit(
  plan: Pick<CampaignPlan, "colorMood" | "campaignName" | "reelsScript" | "hook">,
  opts: { eventName?: string; campaignId?: string | null },
): Promise<{ coverId: string; videoId?: string }> {
  const cover = await saveReelsAtmosphere(plan, opts);
  if (plan.reelsScript && cover.mime === "image/png") {
    void encodeReelsFilmFromCover(cover.base64, plan, opts);
  }
  return { coverId: cover.id };
}
