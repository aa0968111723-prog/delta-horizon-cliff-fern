import type { AssetMeta, AssetNeed } from "../studio/types.ts";

const KIND_CATEGORIES: Record<AssetNeed["kind"], AssetMeta["category"][]> = {
  photo: ["photo", "history"],
  people: ["people"],
  background: ["background"],
  logo: ["logo"],
  illustration: ["illustration", "icon"],
};

function needles(text: string) {
  return [...new Set(text.toLowerCase().split(/[\s,，。／/]+/).filter((term) => term.length >= 2))];
}

export function scoreAssetNeed(need: AssetNeed, asset: AssetMeta) {
  let score = KIND_CATEGORIES[need.kind].includes(asset.category) ? 2 : 0;
  const haystack = [
    asset.name,
    ...asset.tags,
    asset.analysis?.summary,
    asset.provenance?.collection,
    asset.provenance?.label,
  ].filter(Boolean).join(" ").toLowerCase();
  for (const term of needles(`${need.title} ${need.detail} ${need.kind}`)) {
    if (haystack.includes(term)) score += 1;
  }
  return score;
}

export function matchAssetNeed(need: AssetNeed, assets: AssetMeta[], limit = 3) {
  return assets
    .map((asset) => ({ asset, score: scoreAssetNeed(need, asset) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.asset.name.localeCompare(b.asset.name, "zh-TW"))
    .slice(0, limit)
    .map((item) => item.asset);
}

export function matchAssetNeeds(needs: AssetNeed[], assets: AssetMeta[]) {
  return needs.map((need) => ({ need, matches: matchAssetNeed(need, assets) }));
}
