import { generateStudioImage } from "@/lib/image/studio";
import { ensurePublicRaster } from "./canva-push.ts";
import { formatIdFromKind, httpsRasterUrl, needsPublicRaster, withPublicRaster, type LastPack } from "./last-pack.ts";
import { publishNeedsVideo } from "./publish.ts";
import { runPackPublish } from "./run-publish.ts";

export type RasterSource = "existing" | "imagine" | "canva" | "none" | "video";

export async function preparePackForPublish(pack: LastPack, previewSrc: string) {
  if (publishNeedsVideo(pack.kind, pack.reelsVideoUrl)) {
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

export async function completePackPublish(pack: LastPack, previewSrc: string) {
  const prepared = await preparePackForPublish(pack, previewSrc);
  const result = await runPackPublish(prepared.pack, prepared.previewSrc);
  return { ...result, pack: prepared.pack, rasterSource: prepared.source };
}
