import { directionPosterSvg, encodeUtf8Base64 } from "@/lib/ai/poster";
import { publishInstagramMedia } from "@/lib/connect/instagram-publish";
import { carouselPosterInputs, pickCarouselPages } from "@/lib/connect/publish-slides";
import { getAssetBlob } from "@/lib/studio/assets-idb";
import { bytesToBase64 } from "@/lib/studio/bytes";
import { isIgPublishMime, persistGeneratedImage } from "@/lib/studio/raster";
import type { ScheduleItem } from "@/lib/studio/types";
import { canGraphPublish } from "@/lib/zen/memory";
import { shouldPublishCarousel } from "@/lib/connect/instagram-graph";
import { useStudio } from "@/stores/studio-store";

export type PublishItemExtra = {
  permalink?: string;
  mediaUrl?: string;
  igMediaId?: string;
  saves?: number;
  reach?: number;
  impressions?: number;
  shares?: number;
  plays?: number;
};

export type PublishItemResult = {
  note: string;
  marked: boolean;
  extra?: PublishItemExtra;
};

async function pngFromBase64(base64: string, mime: string) {
  const png = await persistGeneratedImage({
    base64,
    mime,
    width: 1080,
    height: 1350,
  });
  if (!isIgPublishMime(png.mime)) return undefined;
  return png.base64;
}

async function pngFromAsset(assetId?: string) {
  if (!assetId) return undefined;
  const blob = await getAssetBlob(assetId);
  if (!blob) return undefined;
  return pngFromBase64(bytesToBase64(new Uint8Array(await blob.arrayBuffer())), blob.type || "image/png");
}

async function collectSlides(item: ScheduleItem): Promise<string[]> {
  const projects = useStudio.getState().projects;
  const pages = pickCarouselPages(projects, item);
  const project = item.projectId
    ? projects.find((row) => row.id === item.projectId)
    : projects.find((row) => row.campaignId === item.campaignId);
  const hero = await pngFromAsset(item.imageAssetId);
  if (!shouldPublishCarousel(item.kind, pages.length)) {
    return hero ? [hero] : [];
  }
  const slides: string[] = [];
  const inputs = carouselPosterInputs(pages, { title: item.title, name: project?.name });
  for (let i = 0; i < inputs.length; i++) {
    if (i === 0 && hero) {
      slides.push(hero);
      continue;
    }
    const svg = directionPosterSvg(inputs[i]!);
    const png = await pngFromBase64(encodeUtf8Base64(svg), "image/svg+xml");
    if (png) slides.push(png);
  }
  return slides;
}

export async function runPublishItem(item: ScheduleItem): Promise<PublishItemResult> {
  const caption = (item.caption || item.title).slice(0, 2200);
  await navigator.clipboard.writeText(caption).catch(() => undefined);
  if (!canGraphPublish(item.kind)) {
    return { note: "限動／Reels／Threads 請在 IG App 發。文案已複製。", marked: true };
  }
  const slides = await collectSlides(item);
  const result = await publishInstagramMedia({
    data: {
      caption,
      imageUrl: item.mediaUrl,
      imageBase64: slides[0],
      imageBase64s: slides.length >= 2 ? slides : undefined,
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
        saves: result.insights?.saved,
        reach: result.insights?.reach,
        impressions: result.insights?.impressions,
        shares: result.insights?.shares,
        plays: result.insights?.plays,
      },
    };
  }
  return { note: result.note, marked: true };
}
