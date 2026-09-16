import { saveCarouselStills } from "@/lib/ai/carousel-persist";
import { saveLineStill } from "@/lib/ai/line-persist";
import { saveReelsKit } from "@/lib/ai/reels-persist";
import { saveStoryStills } from "@/lib/ai/story-persist";
import { saveThreadsStill } from "@/lib/ai/threads-persist";
import type { CampaignPlan } from "@/lib/studio/types";

/** Raster stills after a direction is picked so the kit is visual, not text-only. Sequential to avoid store races. */
export async function saveKitStills(
  plan: CampaignPlan,
  opts: { eventName?: string; campaignId?: string | null; projectId?: string | null },
): Promise<{
  carousel: string[];
  story: string[];
  line: string;
  threads: string;
  reels: { coverId: string; videoId?: string };
}> {
  const carousel = await saveCarouselStills(plan, opts);
  const story = await saveStoryStills(plan, opts);
  const line = await saveLineStill(plan, opts);
  const threads = await saveThreadsStill(plan, opts);
  const reels = await saveReelsKit(plan, opts);
  return { carousel, story, line, threads, reels };
}
