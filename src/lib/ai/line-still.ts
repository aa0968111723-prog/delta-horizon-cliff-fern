import type { PosterInput } from "./poster.ts";

export function linePosterInput(plan: {
  hook: string;
  campaignName: string;
  subhead?: string;
  cta: string;
  colorMood?: string;
}): PosterInput {
  return {
    headline: plan.hook,
    subhead: plan.subhead || plan.cta,
    palette: plan.colorMood || "靜水、琥珀點",
    name: "禪光",
    width: 1040,
    height: 1040,
    variation: "composition",
  };
}

export function attachLineStill<T extends { kind: string; campaignId?: string | null; imageAssetId?: string }>(
  items: T[],
  assetId: string,
  campaignId?: string | null,
): T[] {
  if (!campaignId) return items;
  return items.map((item) => (item.kind === "line" && item.campaignId === campaignId ? { ...item, imageAssetId: assetId } : item));
}
