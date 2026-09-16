import { contentKindLabel } from "./status.ts";
import type { ContentKind, CopyDeck } from "./types.ts";

/** 一篇做好的內容可以一鍵變成這些型態。沒有審核流程，就是再做一則。 */
export const CONVERT_TARGETS: { id: ContentKind; label: string; hint: string }[] = [
  { id: "carousel", label: "輪播", hint: "拆成五頁把一件事講完" },
  { id: "story", label: "限動", hint: "三張：鉤子、資訊、行動" },
  { id: "threads", label: "Threads", hint: "純文字、更口語" },
  { id: "line", label: "LINE 圖", hint: "一眼看完時間地點" },
  { id: "reels", label: "Reels", hint: "腳本加上封面" },
];

export function convertTargetLabel(kind: ContentKind) {
  return CONVERT_TARGETS.find((item) => item.id === kind)?.label ?? contentKindLabel(kind);
}

function firstLines(text: string, n: number): string {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, n)
    .join("\n");
}

export function convertCopy(source: CopyDeck, kind: ContentKind): CopyDeck {
  if (kind === "threads") {
    return {
      ...source,
      eyebrow: "",
      headline: source.headline.split("\n")[0] || source.headline,
      subhead: "",
      body: firstLines(source.caption || source.body, 6),
      caption: firstLines(source.caption || `${source.headline}\n\n${source.body}`, 8),
      hashtags: source.hashtags.slice(0, 4),
    };
  }
  if (kind === "line") {
    return {
      ...source,
      eyebrow: source.eyebrow || "LINE",
      headline: source.headline.replace(/\n/g, " "),
      subhead: source.subhead,
      body: firstLines(source.body, 2),
      caption: `${source.headline.replace(/\n/g, " ")}\n${source.subhead}\n${source.cta}`.trim(),
    };
  }
  if (kind === "story") {
    return {
      ...source,
      eyebrow: source.eyebrow || "STORY",
      headline: source.headline.split("\n")[0] || source.headline,
      subhead: source.subhead,
      body: firstLines(source.body, 1),
    };
  }
  if (kind === "reels") {
    return {
      ...source,
      eyebrow: "REELS",
      headline: source.headline.split("\n")[0] || source.headline,
      subhead: source.cta,
      body: source.subhead,
    };
  }
  return { ...source };
}
