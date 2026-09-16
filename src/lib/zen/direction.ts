import type { CampaignPlan, StudentReview, VisualDirection } from "../studio/types.ts";
import { proposedHook } from "./review.ts";

const LETTERS = ["A", "B", "C"] as const;

/** Spec §8: three named directions, always 方向 A/B/C. */
export function labelDirections(dirs: VisualDirection[]): VisualDirection[] {
  return dirs.slice(0, 3).map((dir, i) => {
    const letter = LETTERS[i] ?? String(i + 1);
    if (/方向\s*[ABC]/.test(dir.name)) return dir;
    return { ...dir, name: `方向 ${letter} · ${dir.name}` };
  });
}

/** User picked a visual direction — copy and canvas follow it, not a generic poster. */
export function applyDirectionToPlan(plan: CampaignPlan, dir: VisualDirection): CampaignPlan {
  const hook = /[？?]/.test(dir.headline) ? dir.headline : plan.hook;
  return {
    ...plan,
    visualTheme: dir.palette || plan.visualTheme,
    visualDirection: `${dir.name}：${dir.concept}`,
    colorMood: dir.palette || plan.colorMood,
    headline: dir.headline || plan.headline,
    subhead: dir.subhead || plan.subhead,
    hook,
    copyPacks: plan.copyPacks?.map((pack) => ({ ...pack, hook })),
    threadsPost: plan.threadsPost
      ? plan.threadsPost.replace(plan.hook, hook)
      : plan.threadsPost,
    storyFrames: plan.storyFrames?.length
      ? plan.storyFrames.map((frame, index) => (index === 0 || frame === plan.hook ? hook : frame))
      : plan.storyFrames,
    reelsScript: plan.reelsScript
      ? {
          ...plan.reelsScript,
          hook,
          beats: plan.reelsScript.beats.map((beat, index) =>
            index === 0 ? { ...beat, caption: hook, voice: hook } : beat,
          ),
        }
      : plan.reelsScript,
  };
}

export function ensureRewriteDiffers(review: StudentReview, currentHook: string): StudentReview {
  const current = currentHook.trim();
  const rewrite = review.rewriteHook.trim();
  if (!rewrite || rewrite === current || (current && rewrite && current.startsWith(rewrite.slice(0, 10)))) {
    return { ...review, rewriteHook: proposedHook(current || "公告") };
  }
  return review;
}
