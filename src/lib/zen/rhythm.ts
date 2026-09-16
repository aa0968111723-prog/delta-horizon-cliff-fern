import type { ContentKind } from "../studio/types.ts";
import { sameTaipeiDay } from "./dates.ts";

export const STORY_FRAME_GAP_MS = 90_000;

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

/** 主視覺 already is the Feed post — a twin「IG Post」on the same night is another ad. */
export function skipConvertedIgPost(waves: { kind: string }[]) {
  return waves.some((wave) => wave.kind === "hero");
}

/** When a campaign has waves, converted IG/Carousel follow 主視覺 — they must not jump ahead of 預熱. */
export function convertedScheduledAt(
  kind: ContentKind,
  eventWhen: number,
  waves: { kind: string; scheduledAt?: number | null }[],
): number {
  const day = 86_400_000;
  const hour = 3_600_000;
  const hero = waves.find((wave) => wave.kind === "hero")?.scheduledAt;
  if (!hero) return eventWhen + offsetDaysForConvertedKind(kind) * day;
  const countdown = waves.find((wave) => wave.kind === "countdown")?.scheduledAt;
  const reason = waves.find((wave) => wave.kind === "reason")?.scheduledAt ?? hero;
  switch (kind) {
    case "ig-post":
      return hero;
    case "carousel":
      return hero + day;
    case "threads": {
      const preferred = countdown ? countdown - 3 * hour : reason + day;
      return Math.max(preferred, reason + hour);
    }
    case "reels": {
      const preferred = countdown ? countdown - 2 * hour : reason + 2 * day;
      return Math.max(preferred, reason + 2 * hour);
    }
    case "story": {
      const countdownAt = countdown ?? eventWhen - 2 * day;
      if (reason) {
        const afterReason = reason + 2 * hour;
        if (afterReason < countdownAt && !sameTaipeiDay(afterReason, countdownAt)) return afterReason;
      }
      return eventWhen - 2 * day;
    }
    case "line":
      return eventWhen - 9 * hour;
    default:
      return eventWhen + offsetDaysForConvertedKind(kind) * day;
  }
}

/** Converted 限動 titles look like「Story 1 · 茶會」— 當日提醒 is a wave, not a frame. */
export function storyFrameIndex(title?: string): number | undefined {
  const match = title?.match(/^Story\s+(\d+)/);
  if (!match) return undefined;
  const index = Number(match[1]) - 1;
  return Number.isFinite(index) && index >= 0 ? index : undefined;
}

export function convertedStoryAt(
  index: number,
  eventWhen: number,
  waves: { kind: string; scheduledAt?: number | null }[],
) {
  return convertedScheduledAt("story", eventWhen, waves) + Math.max(0, index) * STORY_FRAME_GAP_MS;
}
