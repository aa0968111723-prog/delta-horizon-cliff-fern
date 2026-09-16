import type { PosterInput, SourceLook } from "./poster.ts";

export function threadsPosterInput(
  plan: {
    hook: string;
    campaignName: string;
    subhead?: string;
    cta: string;
    colorMood?: string;
  },
  look?: SourceLook,
): PosterInput {
  return {
    headline: plan.hook,
    subhead: plan.subhead || plan.cta,
    palette: plan.colorMood || "靜水、琥珀點",
    name: "禪光",
    width: 1080,
    height: 1080,
    variation: "style",
    photoEmbed: look?.photoEmbed,
    sourceCredit: look?.sourceCredit,
  };
}

export function attachThreadsStill<T extends { kind: string; campaignId?: string | null; imageAssetId?: string }>(
  items: T[],
  assetId: string,
  campaignId?: string | null,
): T[] {
  if (!campaignId) return items;
  return items.map((item) =>
    item.kind === "threads" && item.campaignId === campaignId ? { ...item, imageAssetId: assetId } : item,
  );
}
