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
