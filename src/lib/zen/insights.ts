import type { IgMemoryPost } from "../studio/types.ts";

export type IgLesson = {
  id: string;
  title: string;
  detail: string;
};

export type IgLearning = {
  ranked: IgMemoryPost[];
  lessons: IgLesson[];
  bestHookShape: string;
  avoid: string;
  promptBlock: string;
  captionLengthBest: number;
  captionLengthWeak: number;
};

function score(post: IgMemoryPost) {
  const saveRate = (post.saves ?? 0) * 4;
  return saveRate + (post.shares ?? 0) * 3 + (post.comments ?? 0) * 2 + (post.likes ?? 0) * 0.2 + (post.reach ?? 0) * 0.01;
}

function firstLine(caption: string) {
  return caption.trim().split(/\n/)[0]?.slice(0, 48) || "";
}

function captionChars(caption: string) {
  return caption.replace(/\s+/g, "").length;
}

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length);
}

function kindLabel(kind: IgMemoryPost["kind"]) {
  if (kind === "carousel") return "Carousel";
  if (kind === "reels") return "Reels";
  if (kind === "story") return "Story";
  return "單張";
}

export function learnFromIg(posts: IgMemoryPost[]): IgLearning {
  const ranked = [...posts].sort((a, b) => score(b) - score(a));
  const top = ranked[0];
  const weak = ranked[ranked.length - 1];
  const questionWins = ranked.slice(0, Math.max(1, Math.ceil(ranked.length / 2))).filter((p) => firstLine(p.caption).includes("？")).length;
  const infoDump = ranked.filter((p) => /報名|活動開始|誠摯|大學禪學社/.test(firstLine(p.caption)));
  const lessons: IgLesson[] = [];
  const bestLen = top ? captionChars(top.caption) : 0;
  const weakLen = weak && weak.id !== top?.id ? captionChars(weak.caption) : 0;

  if (top) {
    const reachBit = top.reach ? `，觸及 ${top.reach}` : "";
    lessons.push({
      id: "hook",
      title: "哪種 Hook 比較有效？",
      detail: `收藏較高的是「${firstLine(top.caption)}」（收藏 ${top.saves ?? 0}${reachBit}）。問句與生活語氣比社團全名更容易停。`,
    });
  }
  lessons.push({
    id: "visual",
    title: "哪種圖片學生比較停留？",
    detail: "夜晚、座位、光點比寺廟或資訊海報更容易被存。主視覺不要一開始就堆活動全名。",
  });
  lessons.push({
    id: "copy",
    title: "哪種活動文案比較有效？",
    detail:
      questionWins > 0
        ? "先讓學生覺得被看見，再講時間地點。時間地點還是要出現，只是不要當第一句。"
        : "可以先試生活問句，再放活動資訊。",
  });

  const kinds = ["carousel", "post", "reels", "story"] as const;
  const kindScores = kinds
    .map((kind) => {
      const rows = ranked.filter((p) => p.kind === kind);
      return { kind, avgSaves: avg(rows.map((p) => p.saves ?? 0)), n: rows.length };
    })
    .filter((row) => row.n);
  const bestKind = [...kindScores].sort((a, b) => b.avgSaves - a.avgSaves)[0];
  const weakKind = [...kindScores].sort((a, b) => a.avgSaves - b.avgSaves)[0];
  lessons.push({
    id: "carousel",
    title: "Carousel 哪種結構比較好？",
    detail:
      bestKind?.kind === "carousel"
        ? `Carousel 平均收藏 ${bestKind.avgSaves}，高於其他形式。封面一句話 → 情境 → 痛點 → 內容 → CTA。`
        : "封面一句話 → 情境 → 痛點 → 內容 → CTA。每頁只做一件事。",
  });
  lessons.push({
    id: "story",
    title: "Story 哪種互動比較多？",
    detail: "短、現在、怎麼走。投票與「要不要一起」比長文案有效。",
  });
  if (bestLen && weakLen && bestLen !== weakLen) {
    lessons.push({
      id: "length",
      title: "Caption 多長比較容易停？",
      detail: `收藏較高的大約 ${bestLen} 字，較弱的約 ${weakLen} 字。先一句人話，資訊放後面。`,
    });
  }
  if (bestKind && weakKind && bestKind.kind !== weakKind.kind) {
    lessons.push({
      id: "kind",
      title: "哪種形式比較有效？",
      detail: `${kindLabel(bestKind.kind)} 平均收藏 ${bestKind.avgSaves}，${kindLabel(weakKind.kind)} 約 ${weakKind.avgSaves}。下一波先用表現較好的形式，不要連發活動廣告。`,
    });
  }
  if (weak && top && weak.id !== top.id) {
    lessons.push({
      id: "avoid",
      title: "比較弱的方向",
      detail: `「${firstLine(weak.caption)}」互動較低。${infoDump.length ? "資訊堆疊或正式開頭會掉停留感。" : "可再口語一點。"}`,
    });
  }

  const bestHookShape = top ? firstLine(top.caption) : "最近是不是很久沒有好好坐下來？";
  const avoid = infoDump.length ? "不要用社團全名或誠摯邀請當第一句。" : "不要連續發活動廣告。";
  const promptBlock = [
    `過去表現較好的 Hook：「${bestHookShape}」`,
    top ? `收藏 ${top.saves ?? 0}${top.reach ? `、觸及 ${top.reach}` : ""}、留言 ${top.comments ?? 0}` : "",
    bestLen ? `收藏較高的 Caption 約 ${bestLen} 字` : "",
    bestKind ? `形式 ${kindLabel(bestKind.kind)} 平均收藏較高` : "",
    avoid,
    "新內容要學自己的 IG，不要套一般品牌模板。",
  ]
    .filter(Boolean)
    .join("。");

  return {
    ranked,
    lessons,
    bestHookShape,
    avoid,
    promptBlock,
    captionLengthBest: bestLen,
    captionLengthWeak: weakLen,
  };
}
