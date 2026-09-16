import { migrateBrief } from "@/lib/studio/brief";
import type { BrandKit, Brief } from "@/lib/studio/types";
import { buildBrandMemoryPrompt } from "@/lib/creative/memory";
import type { BriefInput } from "./schema";

export function toBriefInput(
  brief: Brief,
  brand: BrandKit,
  extra?: { forceMock?: boolean },
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
    brandMemory: buildBrandMemoryPrompt(brand),
    ...(extra?.forceMock ? { forceMock: true } : {}),
  };
}
