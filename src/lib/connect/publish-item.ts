import { encodeReelsFromPng } from "@/lib/ai/reels-encode";
import { saveReelsFilm, videoBase64FromAsset } from "@/lib/ai/reels-persist";
import { directionPosterSvg, encodeUtf8Base64 } from "@/lib/ai/poster";
import { pullCanvaDesign } from "@/lib/connect/canva";
import { canvaSize } from "@/lib/connect/canva-format";
import { extraFromIgMemory, insightsLearnPatch } from "@/lib/connect/insights-learn";
import { shouldPublishCarousel } from "@/lib/connect/instagram-graph";
import { publishInstagramMedia } from "@/lib/connect/instagram-publish";
import { carouselPosterInputs, pickCarouselPages } from "@/lib/connect/publish-slides";
import { syncConnection } from "@/lib/connect/sync";
import { getAssetBlob } from "@/lib/studio/assets-idb";
import { bytesToBase64 } from "@/lib/studio/bytes";
import { isIgPublishMime, persistGeneratedImage } from "@/lib/studio/raster";
import type { ReelsScript, ScheduleItem } from "@/lib/studio/types";
import { canGraphPublish, graphPublishFormat } from "@/lib/zen/memory";
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

type PublishFormat = "story" | "feed-portrait" | "reels";

async function pngFromBase64(base64: string, mime: string, format: PublishFormat) {
  const size = canvaSize(format);
  const png = await persistGeneratedImage({
    base64,
    mime,
    width: size.width,
    height: size.height,
  });
  if (!isIgPublishMime(png.mime)) return undefined;
  return png.base64;
}

async function pngFromAsset(assetId: string | undefined, format: PublishFormat) {
  if (!assetId) return undefined;
  const blob = await getAssetBlob(assetId);
  if (!blob || blob.type.startsWith("video/")) return undefined;
  return pngFromBase64(bytesToBase64(new Uint8Array(await blob.arrayBuffer())), blob.type || "image/png", format);
}

async function collectSlides(
  item: ScheduleItem,
  format: PublishFormat,
): Promise<{ slides: string[]; imageUrl?: string }> {
  const projects = useStudio.getState().projects;
  const pages = pickCarouselPages(projects, item);
  const project = item.projectId
    ? projects.find((row) => row.id === item.projectId)
    : projects.find((row) => row.campaignId === item.campaignId);
  let hero = await pngFromAsset(item.imageAssetId, format);
  let imageUrl = item.mediaUrl;
  if (item.canvaDesignId) {
    const pulled = await pullCanvaDesign({
      data: { designId: item.canvaDesignId, format, title: item.title },
    }).catch(() => null);
    if (pulled?.ok) {
      imageUrl = pulled.imageUrl || imageUrl;
      if (pulled.imageBase64) {
        const fromCanva = await pngFromBase64(pulled.imageBase64, pulled.mime, format);
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
    const png = await pngFromBase64(encodeUtf8Base64(svg), "image/svg+xml", format);
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

function pickReelsScript(item: ScheduleItem): ReelsScript | undefined {
  const projects = useStudio.getState().projects;
  const project = item.projectId
    ? projects.find((row) => row.id === item.projectId)
    : projects.find((row) => row.campaignId === item.campaignId);
  return project?.plan?.reelsScript;
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
      await withInsights({ note: "Threads／LINE 請在 IG App 發。文案已複製。", marked: true }),
    );
  }
  const format = graphPublishFormat(item.kind) ?? "feed-portrait";
  const { slides, imageUrl } = await collectSlides(item, format);
  let videoBase64: string | undefined;
  if (format === "reels") {
    videoBase64 = await videoBase64FromAsset(item.videoAssetId);
    if (!videoBase64) {
      if (!slides[0]) {
        return persistMarkedPublish(
          item,
          await withInsights({ note: "這則 Reels 還沒有畫面。腳本已複製，可在 IG App 發。", marked: true }),
        );
      }
      const encoded = await encodeReelsFromPng(slides[0], pickReelsScript(item), item.caption || item.title);
      if (!encoded) {
        return persistMarkedPublish(
          item,
          await withInsights({
            note: "這台瀏覽器還不能編成 Reels 影片。腳本已複製，可在 IG App 發。",
            marked: true,
          }),
        );
      }
      await saveReelsFilm(encoded, { eventName: item.title, campaignId: item.campaignId });
      videoBase64 = encoded.base64;
    }
  }
  const result = await publishInstagramMedia({
    data: {
      caption,
      imageUrl,
      imageBase64: format === "reels" ? undefined : slides[0],
      imageBase64s: format === "reels" || slides.length < 2 ? undefined : slides,
      videoBase64,
      mime: format === "reels" ? "video/mp4" : "image/png",
      title: item.title,
      format,
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
