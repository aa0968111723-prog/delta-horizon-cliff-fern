import type { ContentKind } from "../studio/types.ts";

const LIFE: ContentKind[] = ["member-story", "knowledge", "qa", "poll"];
const PROMO: ContentKind[] = ["ig-post", "carousel", "poster", "countdown"];

/** Keep the grid from looking like a recruitment board. */
export function nextKindAfter(recent: ContentKind[]): ContentKind {
  const last = recent[recent.length - 1];
  const promoStreak = countTail(recent, (k) => PROMO.includes(k));
  if (promoStreak >= 2 || last === "countdown") return "member-story";
  if (last === "member-story") return "knowledge";
  if (last === "knowledge") return "story";
  if (last === "story") return "carousel";
  if (LIFE.includes(last)) return "carousel";
  return "ig-post";
}

function countTail(list: ContentKind[], pred: (k: ContentKind) => boolean) {
  let n = 0;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (!pred(list[i])) break;
    n += 1;
  }
  return n;
}

export function rhythmHint(recent: ContentKind[]) {
  const next = nextKindAfter(recent);
  if (countTail(recent, (k) => PROMO.includes(k)) >= 2) {
    return `最近連續在發活動。下一則改成生活或故事（建議：${next}），再回頭宣傳。`;
  }
  return `下一則可做 ${next}，穿插生活與互動，不要整排招生。`;
}

/** Spread converted formats so the calendar is not a stack of ads on one night. */
export function offsetDaysForConvertedKind(kind: ContentKind): number {
  switch (kind) {
    case "ig-post":
      return -7;
    case "carousel":
      return -5;
    case "threads":
      return -4;
    case "reels":
      return -3;
    case "story":
      return -2;
    case "line":
      return -1;
    default:
      return -5;
  }
}

/** When a campaign has waves, converted IG/Carousel follow 主視覺 — they must not jump ahead of 預熱. */
export function convertedScheduledAt(
  kind: ContentKind,
  eventWhen: number,
  waves: { kind: string; scheduledAt?: number | null }[],
): number {
  const day = 86_400_000;
  const hero = waves.find((wave) => wave.kind === "hero")?.scheduledAt;
  if (!hero) return eventWhen + offsetDaysForConvertedKind(kind) * day;
  const countdown = waves.find((wave) => wave.kind === "countdown")?.scheduledAt;
  switch (kind) {
    case "ig-post":
      return hero;
    case "carousel":
      return hero + day;
    case "threads":
      return hero + 2 * day;
    case "reels":
      return hero + 3 * day;
    case "story":
      return countdown ?? eventWhen - 2 * day;
    case "line":
      return eventWhen - day;
    default:
      return eventWhen + offsetDaysForConvertedKind(kind) * day;
  }
}
