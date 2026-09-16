import type { CampaignPlan, StudentReview, VisualDirection } from "../studio/types.ts";
import { proposedHook } from "./review.ts";

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
