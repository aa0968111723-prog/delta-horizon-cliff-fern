import { saveCarouselStills } from "@/lib/ai/carousel-persist";
import { saveCountdownStills } from "@/lib/ai/countdown-persist";
import { saveLineStill } from "@/lib/ai/line-persist";
import { saveReelsKit } from "@/lib/ai/reels-persist";
import { saveStoryStills } from "@/lib/ai/story-persist";
import { saveThreadsStill } from "@/lib/ai/threads-persist";
import type { SourceLook } from "@/lib/ai/poster";
import type { CampaignPlan, ContentKind } from "@/lib/studio/types";
import { createsScheduleRow } from "./schedule-kinds.ts";

export type KitStillOpts = {
  eventName?: string;
  campaignId?: string | null;
  projectId?: string | null;
  look?: SourceLook;
  scheduleKinds?: ContentKind[];
};

export { createsScheduleRow } from "./schedule-kinds.ts";

export async function saveIgPreviewStills(
  plan: CampaignPlan,
  opts: KitStillOpts,
): Promise<{ countdown: string[]; reels: { coverId: string; videoId?: string } }> {
  if (!createsScheduleRow(opts.scheduleKinds, "reels") && !createsScheduleRow(opts.scheduleKinds, "countdown")) {
    return { countdown: [], reels: { coverId: "" } };
  }
  const reels = createsScheduleRow(opts.scheduleKinds, "reels")
    ? await saveReelsKit(plan, opts)
    : { coverId: "" };
  const countdown = createsScheduleRow(opts.scheduleKinds, "countdown")
    ? await saveCountdownStills(plan, opts)
    : [];
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
  const kinds = opts.scheduleKinds;
  const preview = flags?.skipPreview
    ? { countdown: [] as string[], reels: { coverId: "" } }
    : await saveIgPreviewStills(plan, opts);
  const carousel = createsScheduleRow(kinds, "carousel") ? await saveCarouselStills(plan, opts) : [];
  const story = createsScheduleRow(kinds, "story") ? await saveStoryStills(plan, opts) : [];
  const line = createsScheduleRow(kinds, "line") ? await saveLineStill(plan, opts) : "";
  const threads = createsScheduleRow(kinds, "threads") ? await saveThreadsStill(plan, opts) : "";
  return { carousel, story, line, threads, ...preview };
}
