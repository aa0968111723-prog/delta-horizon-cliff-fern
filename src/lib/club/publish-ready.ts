import { generateStudioImage } from "@/lib/image/studio";
import { reelsVideoPrompt } from "../convert/pack.ts";
import { ensurePublicRaster } from "./canva-push.ts";
import {
  applyReelsClip,
  formatIdFromKind,
  httpsRasterUrl,
  httpsVideoUrl,
  needsPublicRaster,
  publicReelsCoverUrl,
  skipRasterPrep,
  withPublicRaster,
  type LastPack,
} from "./last-pack.ts";
import { memoryPostFromPublish } from "./publish.ts";
import { generateReelsClip } from "./reels-video.ts";
import { runPackPublish } from "./run-publish.ts";

export type RasterSource = "existing" | "imagine" | "canva" | "none" | "video";

export async function preparePackForPublish(pack: LastPack, previewSrc: string) {
  if (skipRasterPrep(pack)) {
    return { pack, previewSrc, source: "video" as const };
  }
  if (!needsPublicRaster(pack)) {
    const ready = httpsRasterUrl(pack.formatPublicUrls?.[pack.kind]) || httpsRasterUrl(pack.canvaExportUrl) || previewSrc;
    return { pack, previewSrc: ready, source: "existing" as const };
  }
  const direction = pack.plan?.directions?.find((item) => item.name === pack.directionName) ?? pack.plan?.directions?.[0];
  const imagined = await generateStudioImage({
    data: {
      prompt: (direction?.imagePrompt || `${pack.eventName} Tamkang students, Tamsui night tea, warm tricolor light, not a temple poster`).slice(0, 1200),
      headline: pack.hook,
      eventName: pack.eventName,
      formatId: formatIdFromKind(pack.kind),
    },
  });
  const url = imagined.urls[0] ?? "";
  const fromImagine = withPublicRaster(pack, url);
  if (!needsPublicRaster(fromImagine)) {
    return { pack: fromImagine, previewSrc: httpsRasterUrl(url) || previewSrc, source: "imagine" as const };
  }
  const canva = await ensurePublicRaster({
    pack: fromImagine,
    previewSrc: url || previewSrc,
    title: pack.eventName,
  });
  const ready = httpsRasterUrl(canva.pack.formatPublicUrls?.[pack.kind]) || httpsRasterUrl(canva.pack.canvaExportUrl) || previewSrc;
  return { pack: canva.pack, previewSrc: ready, source: canva.changed ? ("canva" as const) : ("none" as const) };
}

export async function prepareReelsClip(pack: LastPack, previewSrc: string) {
  if (httpsVideoUrl(pack.reelsVideoUrl)) {
    return { pack, videoReady: true as const, videoPending: false as const };
  }
  const cover = publicReelsCoverUrl(pack) || httpsRasterUrl(previewSrc);
  const clip = await generateReelsClip({
    data: {
      prompt: reelsVideoPrompt(pack.hook, pack.packs?.reels ?? pack.converted ?? []),
      imageUrl: cover || undefined,
      requestId: pack.reelsJobId,
    },
  });
  return applyReelsClip(pack, clip);
}

export async function completePackPublish(pack: LastPack, previewSrc: string) {
  const prepared = await preparePackForPublish(pack, previewSrc);
  let next = prepared.pack;
  if (next.kind === "reels" && !httpsVideoUrl(next.reelsVideoUrl)) {
    const clip = await prepareReelsClip(next, prepared.previewSrc);
    next = clip.pack;
    if (clip.videoPending) {
      return {
        live: false,
        error: "",
        needsConnect: false,
        post: memoryPostFromPublish({ pack: next, thumb: prepared.previewSrc, live: false }),
        message: "Reels 影片還在生成。再按一次發布可以接續。",
        pack: next,
        rasterSource: prepared.source,
        videoPending: true as const,
      };
    }
  }
  const result = await runPackPublish(next, prepared.previewSrc);
  return { ...result, pack: next, rasterSource: prepared.source, videoPending: false as const };
}
