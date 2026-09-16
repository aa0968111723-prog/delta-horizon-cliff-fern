import { createCanvaFromPlan } from "@/lib/connections/oauth";
import { formatById } from "@/lib/studio/formats";
import { blobToDataUrl, rasterizeToJpeg } from "@/lib/image/raster";
import { formatIdFromKind, httpsRasterUrl, needsPublicRaster, withCanvaExport, type LastPack } from "./last-pack.ts";
import { graphImageUrl } from "./publish.ts";
import type { ContentKind } from "../studio/types.ts";

export { needsPublicRaster };

export async function pushHeroToCanva(input: {
  title: string;
  kind: ContentKind | string;
  previewSrc: string;
  caption: string;
  copyCaption?: boolean;
}) {
  if (input.copyCaption !== false) {
    await navigator.clipboard.writeText(input.caption).catch(() => undefined);
  }
  const format = formatById(formatIdFromKind(input.kind as ContentKind));
  const jpeg = await rasterizeToJpeg(input.previewSrc, format.width, format.height);
  let imageBase64: string | undefined;
  if (jpeg) {
    const dataUrl = await blobToDataUrl(jpeg);
    if (dataUrl.length <= 1_400_000) imageBase64 = dataUrl;
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const imageUrl = graphImageUrl(input.previewSrc, origin) || httpsRasterUrl(input.previewSrc) || undefined;
  return createCanvaFromPlan({
    data: {
      title: input.title.slice(0, 80),
      kind: input.kind,
      imageBase64,
      imageUrl,
    },
  });
}

export type CanvaPushResult = Awaited<ReturnType<typeof pushHeroToCanva>>;

export function canvaPushMessage(result: CanvaPushResult) {
  if (result.ok && result.exportUrl) return "已把主視覺送進 Canva，並匯出公開圖，之後可以官方發布到 IG。";
  if (result.ok) return "已在 Canva 開新設計，文案已複製。";
  if (result.needsConnect) return "還沒連接 Canva。連接後會自動把主視覺送進去。";
  return `${result.error} 文案已複製。`;
}

export function applyCanvaPush(pack: LastPack, result: CanvaPushResult): LastPack {
  if (!result.ok) return pack;
  return withCanvaExport(pack, result);
}

export async function ensurePublicRaster(input: { pack: LastPack; previewSrc: string; title: string }) {
  if (!needsPublicRaster(input.pack)) return { pack: input.pack, changed: false as const, message: "" };
  const result = await pushHeroToCanva({
    title: input.title,
    kind: input.pack.kind,
    previewSrc: input.previewSrc,
    caption: input.pack.caption,
    copyCaption: false,
  });
  if (!result.ok) return { pack: input.pack, changed: false as const, message: "" };
  return { pack: applyCanvaPush(input.pack, result), changed: true as const, message: canvaPushMessage(result) };
}
