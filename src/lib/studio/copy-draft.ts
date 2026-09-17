import { localAltText } from "./copy-alt.ts";
import type { CopyDeck, CopyDraft } from "./types.ts";

export function copyFromDraft(current: CopyDeck, draft: CopyDraft): CopyDeck {
  const hook = "hook" in draft ? String(draft.hook ?? "") : current.headline;
  const body = draft.body || current.body;
  const cta = draft.cta || current.cta;
  const caption = [hook, body, cta].filter(Boolean).join("\n\n");
  const alt = ("altText" in draft ? String(draft.altText ?? "") : "").trim() || localAltText({ hook });
  const hashtags = Array.isArray(draft.hashtags) && draft.hashtags.length ? draft.hashtags : current.hashtags;
  return {
    ...current,
    headline: hook.slice(0, 24) || current.headline,
    body,
    cta,
    caption,
    hashtags,
    altText: alt || current.altText,
  };
}
