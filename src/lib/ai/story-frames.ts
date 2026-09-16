import type { PosterInput } from "./poster.ts";
import type { ScheduleItem } from "../studio/types.ts";

export function storyFrameLines(plan: {
  storyFrames?: string[];
  storyBeats?: string[];
  hook: string;
  campaignName: string;
  subhead?: string;
  cta: string;
}): string[] {
  const listed = (plan.storyFrames?.length ? plan.storyFrames : plan.storyBeats) ?? [];
  const frames = listed.map((line) => line.trim()).filter(Boolean);
  if (frames.length >= 3) return frames.slice(0, 5);
  const fallback = [plan.hook, plan.campaignName, plan.subhead || "", plan.cta].map((line) => line.trim()).filter(Boolean);
  return [...frames, ...fallback.filter((line) => !frames.includes(line))].slice(0, 5);
}

export function storyPosterInput(
  line: string,
  index: number,
  opts?: { eventName?: string; palette?: string },
): PosterInput {
  return {
    headline: line,
    subhead: index === 0 ? opts?.eventName : undefined,
    palette: opts?.palette || "靜水、琥珀點",
    name: index === 0 ? "禪光" : "淡江禪學社",
    width: 1080,
    height: 1920,
    variation: index === 0 ? "mood" : index === 2 ? "text" : "composition",
  };
}

export function isStoryScheduleKind(kind: string) {
  return kind === "story" || kind === "countdown";
}

export function attachStoryAssets<T extends { kind: string; campaignId?: string | null; imageAssetId?: string }>(
  items: T[],
  assetIds: string[],
  campaignId?: string | null,
): T[] {
  if (!campaignId || !assetIds.length) return items;
  let n = 0;
  return items.map((item) => {
    if (isStoryScheduleKind(item.kind) && item.campaignId === campaignId && n < assetIds.length) {
      return { ...item, imageAssetId: assetIds[n++] };
    }
    return item;
  });
}

export function storyRowsForFrames(
  existing: Array<Pick<ScheduleItem, "id" | "kind" | "campaignId" | "imageAssetId" | "scheduledAt">>,
  frames: string[],
  campaignId: string,
): Array<{ index: number; caption: string; existingId?: string }> {
  const stories = existing
    .filter((item) => item.kind === "story" && item.campaignId === campaignId)
    .sort((a, b) => a.scheduledAt - b.scheduledAt);
  return frames.map((caption, index) => ({
    index,
    caption,
    existingId: stories[index]?.id,
  }));
}
