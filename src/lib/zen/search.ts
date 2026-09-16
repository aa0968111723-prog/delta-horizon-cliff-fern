import type { AssetMeta } from "../studio/types.ts";
import type { ClubCampaign, IgMemoryPost, MemoryItem } from "./types.ts";

export type SearchHit = {
  id: string;
  source: "drive" | "canva" | "instagram" | "generated" | "brand" | "asset" | "campaign";
  title: string;
  subtitle: string;
  thumbAssetId?: string;
  tags: string[];
  url?: string;
  thumbUrl?: string;
};

function blob(...parts: Array<string | undefined | null>) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function match(q: string, text: string) {
  const parts = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!parts.length) return true;
  return parts.every((p) => text.includes(p));
}

export function expandCreativeQuery(query: string) {
  const q = query.trim();
  const extra: string[] = [];
  if (/晚上|夜/.test(q)) extra.push("晚上", "night", "evening");
  if (/茶會|茶/.test(q)) extra.push("茶會", "tea gathering");
  if (/龜龜/.test(q)) extra.push("龜龜", "turtle", "mascot");
  if (/浮游禪光|禪光|三色光/.test(q)) extra.push("浮游禪光", "三色光", "lights");
  if (/主視覺|IG|海報/.test(q)) extra.push("主視覺", "poster", "Instagram");
  if (/同學|互動/.test(q)) extra.push("同學", "互動", "students");
  if (/淡水|校園/.test(q)) extra.push("淡水", "淡江", "campus");
  const merged = [q, ...extra].join(" ");
  return { original: q, expanded: merged };
}

export function groupSearchHits(hits: SearchHit[]) {
  const order = ["drive", "canva", "instagram", "generated", "campaign", "brand", "asset"] as const;
  return order
    .map((source) => ({ source, items: hits.filter((hit) => hit.source === source) }))
    .filter((group) => group.items.length > 0);
}

export function creativeSearch(query: string, input: {
  assets: AssetMeta[];
  campaigns: ClubCampaign[];
  igPosts: IgMemoryPost[];
  memory: MemoryItem[];
}): SearchHit[] {
  const q = query.trim();
  const hits: SearchHit[] = [];

  for (const asset of input.assets) {
    if (match(q, blob(asset.name, asset.category, ...(asset.tags ?? []), asset.licenseNotes))) {
      hits.push({
        id: asset.id,
        source: asset.source === "generated" ? "generated" : asset.source === "drive" || asset.source === "canva" || asset.source === "instagram" ? asset.source : "asset",
        title: asset.name,
        subtitle: asset.tags.slice(0, 4).join(" · ") || asset.category,
        thumbAssetId: asset.id,
        tags: asset.tags,
      });
    }
  }

  for (const camp of input.campaigns) {
    if (match(q, blob(camp.name, camp.tagline, camp.theme, camp.description, camp.location))) {
      hits.push({
        id: camp.id,
        source: "campaign",
        title: camp.name,
        subtitle: `${camp.date} · ${camp.location}`,
        thumbAssetId: camp.coverAssetId ?? undefined,
        tags: [camp.type, camp.theme].filter(Boolean),
        url: `/campaigns/${camp.id}`,
      });
    }
  }

  for (const post of input.igPosts) {
    if (match(q, blob(post.caption, post.hook, post.analysis))) {
      hits.push({
        id: post.id,
        source: "instagram",
        title: post.hook || post.caption.slice(0, 24),
        subtitle: new Date(post.postedAt).toISOString().slice(0, 10),
        thumbAssetId: post.assetId,
        tags: [post.mediaType],
        url: post.permalink,
      });
    }
  }

  for (const item of input.memory) {
    if (match(q, blob(item.title, item.subtitle, item.kind, ...(item.tags ?? [])))) {
      hits.push({
        id: item.id,
        source: item.source,
        title: item.title,
        subtitle: item.subtitle,
        thumbAssetId: item.thumbAssetId,
        tags: item.tags,
        url: item.url,
      });
    }
  }

  return hits.slice(0, 48);
}
