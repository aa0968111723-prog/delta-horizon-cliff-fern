export type PostFeel = "strong" | "ok" | "weak";

const FEEL_METRICS: Record<
  PostFeel,
  { saves: number; likes: number; comments: number; shares: number; reach: number; analysis: string }
> = {
  strong: {
    saves: 22,
    likes: 84,
    comments: 6,
    shares: 4,
    reach: 430,
    analysis: "你覺得學生會停。下次生成會學這個 Hook 與畫面。",
  },
  ok: {
    saves: 9,
    likes: 32,
    comments: 2,
    shares: 1,
    reach: 240,
    analysis: "普通。可以留，下一次 Hook 再更貼淡江生活。",
  },
  weak: {
    saves: 1,
    likes: 7,
    comments: 0,
    shares: 0,
    reach: 160,
    analysis: "偏弱。下次少用這種開頭，不要社團全名或公告。",
  },
};

export function metricsFromFeel(feel: PostFeel) {
  return FEEL_METRICS[feel];
}

export function feelLabel(feel: PostFeel) {
  if (feel === "strong") return "學生會停";
  if (feel === "weak") return "偏弱";
  return "普通";
}
