import { migrateBrief } from "../studio/brief.ts";
import type { AssetMeta, BrandKit, Brief } from "../studio/types.ts";
import { buildCreativeMemoryContext } from "../creative/memory.ts";
import type { Campaign } from "../creative/types.ts";
import type { BriefInput } from "./schema.ts";

export function toBriefInput(
  brief: Brief,
  brand: BrandKit,
  extra?: {
    forceMock?: boolean;
    assets?: AssetMeta[];
    campaigns?: Campaign[];
    styleReferences?: { provider: string; collection: string; title: string; notes: string }[];
    instagramHashtags?: string[];
    outcomeHashtags?: string[];
  },
): BriefInput {
  const b = migrateBrief(brief);
  const eventName = b.eventName.trim() || b.product.trim();
  const d = b.deliverables;
  const any = d.post || d.story || d.carousel || d.reels;
  return {
    eventName,
    schedule: b.schedule,
    location: b.location,
    product: b.product.trim() || eventName,
    offer: b.offer,
    audience: b.audience.trim(),
    goal: b.goal,
    features: b.features,
    style: b.style,
    notes: b.notes,
    wantPost: any ? d.post : true,
    wantStory: d.story,
    wantCarousel: d.carousel,
    wantReels: d.reels,
    brandName: brand.name,
    handle: brand.handle,
    voice: brand.voice,
    doSay: brand.doSay,
    dontSay: brand.dontSay,
    forbiddenWords: brand.forbiddenWords ?? [],
    slogans: (brand.slogans ?? []).join("／"),
    preferredCtas: (brand.ctas ?? []).join("／"),
    imageStyle: [brand.imageStyle?.mood, brand.imageStyle?.lighting, brand.imageStyle?.paletteHint]
      .filter(Boolean)
      .join("；"),
    brandMemory: buildCreativeMemoryContext({
      brand,
      assets: extra?.assets ?? [],
      campaigns: extra?.campaigns ?? [],
      styleReferences: extra?.styleReferences,
      instagramHashtags: extra?.instagramHashtags,
      outcomeHashtags: extra?.outcomeHashtags,
    }),
    ...(extra?.forceMock ? { forceMock: true } : {}),
    ...(extra?.igLessons ? { igLessons: extra.igLessons.slice(0, 800) } : {}),
    ...(extra?.styleMemory ? { styleMemory: extra.styleMemory.slice(0, 400) } : {}),
  };
}
