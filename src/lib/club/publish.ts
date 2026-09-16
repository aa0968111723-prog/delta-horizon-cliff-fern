import { httpsRasterUrl, httpsVideoUrl, type LastPack } from "./last-pack.ts";
import type { ContentKind } from "../studio/types.ts";

export function graphImageUrl(src: string, origin = "") {
  const raw = src.trim();
  if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return "";
  if (raw.startsWith("https://")) return httpsRasterUrl(raw);
  if (raw.startsWith("/") && origin) return httpsRasterUrl(`${origin.replace(/\/$/, "")}${raw}`);
  return "";
}

export function publicPublishUrl(pack: LastPack, previewSrc: string, origin = "") {
  const candidates = [pack.formatPublicUrls?.[pack.kind], pack.canvaExportUrl, previewSrc];
  for (const src of candidates) {
    if (!src) continue;
    const url = graphImageUrl(src, origin);
    if (url) return url;
  }
  return "";
}

export function publicVideoUrl(pack: LastPack) {
  return pack.kind === "reels" ? httpsVideoUrl(pack.reelsVideoUrl) : "";
}

export function publishCaption(pack: Pick<LastPack, "caption" | "hashtags" | "hook">) {
  const hook = pack.hook.trim();
  const rest = (pack.caption || "").trim();
  const body = !rest || rest.startsWith(hook) ? rest || hook : `${hook}\n${rest}`;
  const tags = (pack.hashtags ?? []).filter(Boolean).join(" ");
  if (!tags || body.includes("#")) return body.slice(0, 2200);
  return `${body}\n\n${tags}`.slice(0, 2200);
}

export function publishMediaType(kind: ContentKind): "image" | "carousel" | "reels" {
  if (kind === "carousel") return "carousel";
  if (kind === "reels") return "reels";
  return "image";
}

export function memoryThumb(src: string, fallback: string) {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return fallback;
  return src;
}

export function memoryPostFromPublish(input: {
  pack: LastPack;
  thumb: string;
  live: boolean;
  mediaId?: string;
  permalink?: string;
}) {
  const { pack } = input;
  return {
    id: input.mediaId || `ig_pub_${pack.projectId}_${pack.kind}`,
    mediaType: publishMediaType(pack.kind),
    caption: publishCaption(pack),
    takenAt: Date.now(),
    thumb: memoryThumb(input.thumb, pack.heroThumb || "/seed/tea.svg"),
    permalink: input.permalink,
    metricsSource: input.live ? ("live" as const) : ("memory" as const),
    analysis: `剛發布 · ${pack.kind} · ${pack.eventName}。Hook：${pack.hook}`,
  };
}

export function publishNeedsVideo(kind: ContentKind, videoUrl?: string) {
  return kind === "reels" && !httpsVideoUrl(videoUrl);
}
