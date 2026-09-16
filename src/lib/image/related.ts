import { hitScore } from "../club/rank.ts";
import { matchesAssetQuery, sourceLabel } from "../studio/assets.ts";
import type { AssetMeta } from "../studio/types.ts";

function relatedScore(asset: AssetMeta, query: string) {
  let n = hitScore({ title: asset.name, notes: asset.licenseNotes, tags: asset.tags }, query);
  if (asset.source === "drive" || asset.source === "canva" || asset.source === "instagram") n += 2;
  if (asset.source === "generated") n += 1;
  if (asset.favorite) n += 2;
  return n;
}

export function relatedAssetsForIdea(assets: AssetMeta[], idea: string, limit = 6) {
  const q = idea.trim();
  const matched = q ? assets.filter((asset) => matchesAssetQuery(asset, q)) : assets.filter((asset) => asset.favorite || asset.source === "seed");
  const pool = matched.length ? matched : assets.filter((asset) => asset.source === "seed" || asset.favorite);
  return [...pool].sort((a, b) => relatedScore(b, q) - relatedScore(a, q)).slice(0, limit);
}

export function relatedNotesFromAssets(assets: AssetMeta[]) {
  return assets
    .slice(0, 6)
    .map((asset) => `${sourceLabel(asset.source)} / ${asset.name}`)
    .join("；");
}

export function relatedNotesFromHits(hits: Array<{ title: string; subtitle?: string }>) {
  return hits
    .slice(0, 6)
    .map((item) => (item.subtitle ? `${item.subtitle}` : item.title))
    .filter(Boolean)
    .join("；");
}
