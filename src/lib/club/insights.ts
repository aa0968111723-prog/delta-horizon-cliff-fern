export type IgLessonPost = {
  mediaType: string;
  caption: string;
  metrics?: { reach?: number; likes?: number; comments?: number; saves?: number };
  analysis?: string;
};

export type IgLessons = {
  hook: string;
  visual: string;
  activity: string;
  carousel: string;
  story: string;
};

function score(post: IgLessonPost) {
  const m = post.metrics;
  if (!m) return 0;
  return (m.saves ?? 0) * 3 + (m.comments ?? 0) * 2 + (m.likes ?? 0) + Math.round((m.reach ?? 0) / 40);
}

function firstLine(caption: string) {
  return caption.split("\n")[0]?.trim() || caption.slice(0, 24);
}

/** Turn IG metrics into next-generation advice, not a dashboard. */
export function lessonsFromIg(posts: IgLessonPost[]): IgLessons {
  const scored = posts.filter((post) => post.metrics).sort((a, b) => score(b) - score(a));
  if (!scored.length) {
    return {
      hook: "還沒有足夠的 IG 成效。先發，再讓 AI 記住哪種第一句會讓人停下來。",
      visual: "目前沒有圖片停留資料。夜間暖光與學生側影通常比廟宇海報更能停。",
      activity: "活動文案還缺回饋。先把時間地點講清楚，再看哪場有人真的來。",
      carousel: "Carousel 還沒有結構資料。先試 Hook → 情境 → 痛點 → 內容 → CTA。",
      story: "Story 還沒有互動資料。問一句真話，比連續三張活動海報有效。",
    };
  }
  const best = scored[0];
  const weakest = scored[scored.length - 1];
  const carousel = scored.find((post) => post.mediaType === "carousel");
  const reels = scored.find((post) => post.mediaType === "reels");
  const recap = scored.find((post) => /來的人|回顧|可以。/.test(post.caption));

  return {
    hook: `比較有效的 Hook 像是「${firstLine(best.caption)}」。少用社團全名當第一句。`,
    visual: reels
      ? `夜間光與現場感比較有停留（Reels「${firstLine(reels.caption)}」）。龜龜可以入鏡，但要配一句學生生活。`
      : `收藏較高的畫面偏生活，而不是正式海報。`,
    activity: recap
      ? `活動文案裡，「來了以後發生什麼」比預告更有停留。預告要把時間地點講早一點。`
      : `活動資訊出現太晚的貼文，停留會掉。Hook 之後兩行內要有時間地點。`,
    carousel: carousel
      ? `Carousel 結構比較有效時，中段會變成對話而不是簡章。可延續「${firstLine(carousel.caption)}」這種口吻。`
      : `Carousel 還可以試：第一頁問句、第三頁互動、最後一頁報名。`,
    story: weakest && score(weakest) < score(best) / 2
      ? `互動比較少的是「${firstLine(weakest.caption)}」這類只露角色、沒有生活句的內容。Story 改問學生此刻卡在哪。`
      : `Story 適合問一句真話，或倒數，而不是再貼一次主視覺。`,
  };
}
