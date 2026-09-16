import { saveCarouselStills } from "@/lib/ai/carousel-persist";
import { saveCountdownStills } from "@/lib/ai/countdown-persist";
import { saveLineStill } from "@/lib/ai/line-persist";
import { saveReelsKit } from "@/lib/ai/reels-persist";
import { saveStoryStills } from "@/lib/ai/story-persist";
import { saveThreadsStill } from "@/lib/ai/threads-persist";
import type { SourceLook } from "@/lib/ai/poster";
import type { CampaignPlan } from "@/lib/studio/types";

export type KitStillOpts = {
  eventName?: string;
  campaignId?: string | null;
  projectId?: string | null;
  look?: SourceLook;
};

export async function saveIgPreviewStills(
  plan: CampaignPlan,
  opts: KitStillOpts,
): Promise<{ countdown: string[]; reels: { coverId: string; videoId?: string } }> {
  const reels = await saveReelsKit(plan, opts);
  const countdown = await saveCountdownStills(plan, opts);
  return { countdown, reels };
}

/** Raster stills after a direction is picked so the kit is visual, not text-only. Sequential to avoid store races. */
export async function saveKitStills(
  plan: CampaignPlan,
  opts: KitStillOpts,
  flags?: { skipPreview?: boolean },
): Promise<{
  carousel: string[];
  story: string[];
  line: string;
  threads: string;
  countdown: string[];
  reels: { coverId: string; videoId?: string };
}> {
  const preview = flags?.skipPreview
    ? { countdown: [] as string[], reels: { coverId: "" } }
    : await saveIgPreviewStills(plan, opts);
  const carousel = await saveCarouselStills(plan, opts);
  const story = await saveStoryStills(plan, opts);
  const line = await saveLineStill(plan, opts);
  const threads = await saveThreadsStill(plan, opts);
  return { carousel, story, line, threads, ...preview };
}
