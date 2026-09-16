import { blobFromBase64, bytesToBase64 } from "../studio/bytes.ts";
import { putAssetBlob, getAssetBlob } from "../studio/assets-idb.ts";
import { uid } from "../studio/ids.ts";
import type { EncodedReels } from "./reels-encode.ts";
import { attachReelsVideo, isVideoMime, reelsVideoAsset } from "./reels-asset.ts";
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
