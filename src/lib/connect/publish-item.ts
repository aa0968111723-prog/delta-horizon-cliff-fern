import { directionPosterSvg, encodeUtf8Base64 } from "@/lib/ai/poster";
import { pullCanvaDesign } from "@/lib/connect/canva";
import { extraFromIgMemory, insightsLearnPatch } from "@/lib/connect/insights-learn";
import { publishInstagramMedia } from "@/lib/connect/instagram-publish";
import { carouselPosterInputs, pickCarouselPages } from "@/lib/connect/publish-slides";
import { syncConnection } from "@/lib/connect/sync";
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
  insightsLearned?: boolean;
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

async function collectSlides(item: ScheduleItem): Promise<{ slides: string[]; imageUrl?: string }> {
  const projects = useStudio.getState().projects;
  const pages = pickCarouselPages(projects, item);
  const project = item.projectId
    ? projects.find((row) => row.id === item.projectId)
    : projects.find((row) => row.campaignId === item.campaignId);
  let hero = await pngFromAsset(item.imageAssetId);
  let imageUrl = item.mediaUrl;
  if (item.canvaDesignId) {
    const pulled = await pullCanvaDesign({
      data: { designId: item.canvaDesignId, format: "feed-portrait", title: item.title },
    }).catch(() => null);
    if (pulled?.ok) {
      imageUrl = pulled.imageUrl || imageUrl;
      if (pulled.imageBase64) {
        const fromCanva = await pngFromBase64(pulled.imageBase64, pulled.mime);
        if (fromCanva) hero = fromCanva;
      }
    }
  }
  if (!shouldPublishCarousel(item.kind, pages.length)) {
    return { slides: hero ? [hero] : [], imageUrl };
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
  return { slides, imageUrl };
}

async function refreshIgInsightsAfterPublish(extra?: PublishItemExtra): Promise<{
  extra?: PublishItemExtra;
  learned: boolean;
  note: string;
}> {
  const result = await syncConnection({ data: { provider: "instagram" } }).catch(() => null);
  if (!result) return { extra, learned: false, note: "" };
  const patch = insightsLearnPatch(result);
  const store = useStudio.getState();
  if (patch.posts) store.upsertIgMemory(patch.posts);
  if (patch.connection) store.setConnection("instagram", patch.connection);
  const merged = extraFromIgMemory(extra, patch.posts ?? []);
  return {
    extra: merged,
    learned: Boolean(patch.posts),
    note: patch.posts ? "已讀取成效，下次生成會學。" : "",
  };
}

async function withInsights(result: PublishItemResult): Promise<PublishItemResult> {
  if (!result.marked) return result;
  const insights = await refreshIgInsightsAfterPublish(result.extra);
  if (!insights.learned) return { ...result, extra: insights.extra ?? result.extra, insightsLearned: false };
  return {
    ...result,
    extra: insights.extra ?? result.extra,
    insightsLearned: true,
    note: `${result.note} ${insights.note}`.trim(),
  };
}

function persistMarkedPublish(item: ScheduleItem, result: PublishItemResult) {
  if (!result.marked) return result;
  useStudio.getState().publishSchedule(item.id, result.extra);
  return result;
}

export async function runPublishItem(item: ScheduleItem): Promise<PublishItemResult> {
  const caption = (item.caption || item.title).slice(0, 2200);
  await navigator.clipboard.writeText(caption).catch(() => undefined);
  useStudio.getState().publishSchedule(item.id);
  if (!canGraphPublish(item.kind)) {
    return persistMarkedPublish(
      item,
      await withInsights({ note: "限動／Reels／Threads 請在 IG App 發。文案已複製。", marked: true }),
    );
  }
  const { slides, imageUrl } = await collectSlides(item);
  const result = await publishInstagramMedia({
    data: {
      caption,
      imageUrl,
      imageBase64: slides[0],
      imageBase64s: slides.length >= 2 ? slides : undefined,
      mime: "image/png",
      title: item.title,
      format: "feed-portrait",
    },
  });
  if (result.ok) {
    return persistMarkedPublish(
      item,
      await withInsights({
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
      }),
    );
  }
  return persistMarkedPublish(item, await withInsights({ note: result.note, marked: true }));
}
