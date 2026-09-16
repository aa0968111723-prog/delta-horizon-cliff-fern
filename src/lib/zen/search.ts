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

const STOP = /^(找|尋找|以前|之前的|之前|的|照片|素材|有|很多|適合|一下|幫我|請|相關|我要|我想|做)$/;

function blob(...parts: Array<string | undefined | null>) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export function searchTerms(query: string): string[] {
  const q = query.trim();
  const terms = new Set<string>();
  if (/晚上|夜/.test(q)) {
    terms.add("晚上");
    terms.add("夜");
  }
  if (/茶會|喝茶|茶席|來喝茶/.test(q)) terms.add("茶會");
  if (/龜龜/.test(q)) terms.add("龜龜");
  if (/浮游禪光|禪光|三色光/.test(q)) {
    terms.add("浮游禪光");
    terms.add("三色光");
  }
  if (/主視覺|海報/.test(q)) {
    terms.add("主視覺");
    terms.add("海報");
  }
  if (/同學|互動/.test(q)) {
    terms.add("同學");
    terms.add("互動");
  }
  if (/淡水/.test(q)) terms.add("淡水");
  if (/校園/.test(q)) terms.add("校園");
  if (/招生|招新|迎新/.test(q)) terms.add("招生");
  if (/IG|instagram/i.test(q)) terms.add("IG");
  for (const part of q.split(/[\s,，]+/)) {
    const token = part.trim();
    if (token.length >= 2 && token.length <= 12 && !STOP.test(token) && !/^找/.test(token)) {
      terms.add(token);
    }
  }
  return [...terms];
}

export function expandCreativeQuery(query: string) {
  const q = query.trim();
  const terms = searchTerms(q);
  const extra: string[] = [];
  if (/晚上|夜/.test(q)) extra.push("night", "evening");
  if (/茶會|茶/.test(q)) extra.push("tea gathering");
  if (/龜龜/.test(q)) extra.push("turtle", "mascot");
  if (/浮游禪光|禪光|三色光/.test(q)) extra.push("lights");
  if (/主視覺|IG|海報/.test(q)) extra.push("poster", "Instagram");
  if (/同學|互動/.test(q)) extra.push("students");
  if (/淡水|校園/.test(q)) extra.push("campus");
  const merged = [...new Set([q, ...terms, ...extra])].join(" ");
  return { original: q, expanded: merged, terms };
}

function scoreBlob(terms: string[], text: string, original: string) {
  const hay = text.toLowerCase();
  if (!terms.length) return hay.includes(original.toLowerCase()) ? 1 : 0;
  let score = 0;
  for (const term of terms) {
    if (hay.includes(term.toLowerCase())) score += term.length >= 3 ? 3 : 2;
  }
  return score;
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
  if (!q) return [];
  const terms = searchTerms(q);
  const scored: { hit: SearchHit; score: number }[] = [];

  const push = (hit: SearchHit, text: string) => {
    let score = scoreBlob(terms, text, q);
    for (const term of terms) {
      if (hit.title === term) score += 6;
      else if (hit.title.includes(term)) score += 3;
    }
    if (score > 0) scored.push({ hit, score });
  };

  for (const asset of input.assets) {
    push(
      {
        id: asset.id,
        source: asset.source === "generated" ? "generated" : asset.source === "drive" || asset.source === "canva" || asset.source === "instagram" ? asset.source : "asset",
        title: asset.name,
        subtitle: asset.tags.slice(0, 4).join(" · ") || asset.category,
        thumbAssetId: asset.id,
        tags: asset.tags,
      },
      blob(asset.name, asset.category, ...(asset.tags ?? []), asset.licenseNotes),
    );
  }

  for (const camp of input.campaigns) {
    push(
      {
        id: camp.id,
        source: "campaign",
        title: camp.name,
        subtitle: `${camp.date} · ${camp.location}`,
        thumbAssetId: camp.coverAssetId ?? undefined,
        tags: [camp.type, camp.theme].filter(Boolean),
        url: `/campaigns/${camp.id}`,
      },
      blob(camp.name, camp.tagline, camp.theme, camp.description, camp.location),
    );
  }

  for (const post of input.igPosts) {
    push(
      {
        id: post.id,
        source: "instagram",
        title: post.hook || post.caption.slice(0, 24),
        subtitle: new Date(post.postedAt).toISOString().slice(0, 10),
        thumbAssetId: post.assetId,
        tags: [post.mediaType],
        url: post.permalink,
      },
      blob(post.caption, post.hook, post.analysis),
    );
  }

  for (const item of input.memory) {
    push(
      {
        id: item.id,
        source: item.source,
        title: item.title,
        subtitle: item.subtitle,
        thumbAssetId: item.thumbAssetId,
        tags: item.tags,
        url: item.url,
      },
      blob(item.title, item.subtitle, item.kind, ...(item.tags ?? [])),
    );
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 48)
    .map((row) => row.hit);
}
