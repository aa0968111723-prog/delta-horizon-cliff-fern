import { localAltText } from "./copy-alt.ts";
import type { CopyDeck, CopyDraft } from "./types.ts";

/** 把一版文案套到畫面上：Caption、Hashtags、無障礙說明一次帶過去。 */
export function copyFromDraft(current: CopyDeck, draft: CopyDraft): CopyDeck {
  const caption = [draft.hook, draft.body, draft.cta].filter(Boolean).join("\n\n");
  const alt = (draft.altText ?? "").trim() || localAltText({ hook: draft.hook });
  return {
    ...current,
    headline: draft.hook.slice(0, 24) || current.headline,
    body: draft.body || current.body,
    cta: draft.cta || current.cta,
    caption,
    hashtags: draft.hashtags.length ? draft.hashtags : current.hashtags,
    altText: alt || current.altText,
  };
}
