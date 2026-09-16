import { migrateBrief } from "@/lib/studio/brief";
import type { BrandKit, Brief, CitedSource } from "@/lib/studio/types";
import type { BriefInput } from "./schema";

export function toBriefInput(
  brief: Brief,
  brand: BrandKit,
  extra?: {
    forceMock?: boolean;
    dnaNotes?: string;
    memoryNotes?: string;
    foundCount?: number;
    citedSources?: CitedSource[];
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
    wantThreads: d.threads,
    wantLine: d.line,
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
    ...(extra?.dnaNotes ? { dnaNotes: extra.dnaNotes } : {}),
    ...(extra?.memoryNotes ? { memoryNotes: extra.memoryNotes } : {}),
    ...(typeof extra?.foundCount === "number" ? { foundCount: extra.foundCount } : {}),
    ...(extra?.citedSources?.length ? { citedSources: extra.citedSources } : {}),
  };
}
