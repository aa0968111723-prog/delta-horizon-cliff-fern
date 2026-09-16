import { formatIdFromKind } from "../club/last-pack.ts";
import { posterDataUrl, type PosterMood } from "../image/poster.ts";
import { formatById } from "../studio/formats.ts";
import type { ContentKind } from "../studio/types.ts";

const MOODS: PosterMood[] = ["sit", "night", "friends", "lights"];

export function pagePreviewSrc(input: {
  kind: ContentKind;
  src: string;
  hook: string;
  heading: string;
  body: string;
  page: number;
}) {
  if (input.page <= 0) return input.src;
  if (input.kind !== "carousel" && input.kind !== "story" && input.kind !== "reels") return input.src;
  const format = formatById(formatIdFromKind(input.kind));
  const line = (input.body.split("\n")[0] || input.heading || input.hook).trim();
  return posterDataUrl({
    hook: line,
    mood: MOODS[input.page % MOODS.length],
    width: format.width,
    height: format.height,
  });
}
