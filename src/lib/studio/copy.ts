import type { BrandBoilerplate, CampaignPlan, CopyDeck } from "./types";

export function emptyCopy(handle = "", boilerplate?: BrandBoilerplate): CopyDeck {
  return {
    eyebrow: "",
    headline: "新的貼文",
    subhead: "",
    body: "",
    cta: boilerplate?.cta || "了解更多",
    handle,
    caption: "",
    hashtags: boilerplate?.hashtags ?? [],
    altText: "",
  };
}

export function copyFromPlan(plan: CampaignPlan, handle: string): CopyDeck {
  return {
    eyebrow: plan.eyebrow || plan.hook.slice(0, 24),
    headline: plan.headline || plan.campaignName,
    subhead: plan.subhead || plan.insight,
    body: plan.body || plan.visualDirection,
    cta: plan.cta || "了解更多",
    handle,
    caption: plan.captions.find((row) => row.style === "一般版")?.text ?? plan.captions[0]?.text ?? "",
    hashtags: plan.hashtags,
    altText: plan.altText,
  };
}

export function planToCopy(plan: CampaignPlan, current: CopyDeck, fields: Partial<CopyDeck>): CopyDeck {
  return {
    ...current,
    ...fields,
    caption: fields.caption ?? plan.captions.find((row) => row.style === "一般版")?.text ?? plan.captions[0]?.text ?? current.caption,
    hashtags: fields.hashtags ?? plan.hashtags ?? current.hashtags,
    altText: fields.altText ?? plan.altText ?? current.altText,
  };
}

export function withBoilerplate(copy: CopyDeck, boilerplate?: BrandBoilerplate): CopyDeck {
  if (!boilerplate) return copy;
  const close = boilerplate.captionClose.trim();
  const tags = [...new Set([...(copy.hashtags ?? []), ...boilerplate.hashtags])];
  return {
    ...copy,
    cta: copy.cta || boilerplate.cta,
    hashtags: tags,
    caption: close && copy.caption && !copy.caption.includes(close)
      ? `${copy.caption}\n\n${close}`
      : copy.caption,
  };
}
