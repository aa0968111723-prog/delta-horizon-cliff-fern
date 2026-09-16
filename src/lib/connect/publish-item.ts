import { publishInstagramMedia } from "@/lib/connect/instagram-publish";
import { getAssetBlob } from "@/lib/studio/assets-idb";
import { bytesToBase64 } from "@/lib/studio/bytes";
import { persistGeneratedImage } from "@/lib/studio/raster";
import type { ScheduleItem } from "@/lib/studio/types";
import { canGraphPublish } from "@/lib/zen/memory";

export type PublishItemResult = {
  note: string;
  marked: boolean;
  extra?: { permalink?: string; mediaUrl?: string; igMediaId?: string };
};

export async function runPublishItem(item: ScheduleItem): Promise<PublishItemResult> {
  const caption = (item.caption || item.title).slice(0, 2200);
  await navigator.clipboard.writeText(caption).catch(() => undefined);
  if (!canGraphPublish(item.kind)) {
    return { note: "限動／Reels／Threads 請在 IG App 發。文案已複製。", marked: true };
  }
  let imageBase64: string | undefined;
  if (item.imageAssetId) {
    const blob = await getAssetBlob(item.imageAssetId);
    if (blob) {
      const png = await persistGeneratedImage({
        base64: bytesToBase64(new Uint8Array(await blob.arrayBuffer())),
        mime: blob.type || "image/png",
        width: 1080,
        height: 1350,
      });
      imageBase64 = png.base64;
    }
  }
  const result = await publishInstagramMedia({
    data: {
      caption,
      imageUrl: item.mediaUrl,
      imageBase64,
      mime: "image/png",
      title: item.title,
      format: "feed-portrait",
    },
  });
  if (result.ok) {
    return {
      note: result.note,
      marked: true,
      extra: {
        mediaUrl: result.imageUrl || item.mediaUrl,
        permalink: result.permalink,
        igMediaId: result.mediaId,
      },
    };
  }
  return { note: result.note, marked: true };
}
