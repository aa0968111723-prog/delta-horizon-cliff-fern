import type { ContentItem, ContentMetrics } from "../studio/types.ts";

export type IgDna = {
  palette: string[];
  captionAvg: number;
  sample: number;
  hooks: string[];
  hashtags: string[];
  ctas: string[];
  visualNotes: string[];
  events: string[];
  interaction: string[];
  summary: string;
};

export type IgInsightCard = {
  question: string;
  answer: string;
};

function score(m: ContentMetrics) {
  return m.saves * 4 + m.shares * 3 + m.comments * 2 + m.likes + m.reach * 0.02;
}

function topN(map: Map<string, number>, n: number) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

/** 從自己的貼文（本機已發布 + 已連接的 IG）抽出 Zen Club IG DNA。 */
export function computeIgDna(
  contents: ContentItem[],
  extras?: { captions?: string[]; hashtags?: string[]; visuals?: string[] },
): IgDna {
  const posts = contents.filter((c) => c.status === "published" || c.copy.hook);
  const captions = [
    ...posts.map((c) => [c.copy.hook, c.copy.body, c.copy.cta].filter(Boolean).join("\n")),
    ...(extras?.captions ?? []),
  ].filter(Boolean);
  const lengths = captions.map((t) => t.replace(/\s+/g, "").length);
  const avg = lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0;

  const tagCount = new Map<string, number>();
  const ctaCount = new Map<string, number>();
  for (const c of posts) {
    for (const t of c.copy.hashtags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    if (c.copy.cta) ctaCount.set(c.copy.cta, (ctaCount.get(c.copy.cta) ?? 0) + 1);
  }
  for (const t of extras?.hashtags ?? []) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);

  const ranked = [...posts].filter((c) => c.metrics).sort((a, b) => score(b.metrics!) - score(a.metrics!));
  const hooks = ranked.map((c) => c.copy.hook).filter(Boolean).slice(0, 5);
  const visualNotes = [
    ...ranked.map((c) => c.visualDirection).filter(Boolean),
    ...(extras?.visuals ?? []),
  ].slice(0, 5);
  const events = [...new Set(posts.map((c) => c.title.split("·")[0]?.trim()).filter(Boolean) as string[])].slice(0, 6);

  const saveHeavy = ranked.filter((c) => c.metrics && c.metrics.saves > c.metrics.likes * 0.25);
  const interaction = [
    saveHeavy.length ? "收藏多的通常是知識型、一句話、或社員故事" : "互動還不夠多，先觀察收藏",
    ranked[0]?.type === "carousel" ? "Carousel 停留較久" : "單張貼文目前互動較穩",
    "限動投票比硬廣招生有效",
  ];

  const hashtags = topN(tagCount, 6);
  const ctas = topN(ctaCount, 4);
  const palette = ["#2B2B36", "#F2B56B", "#7FB7A8", "#C9B8E8", "#FFF6E9"];

  const summary = [
    `常用配色：${palette.join("、")}。`,
    hooks[0] ? `有效 Hook 像：「${hooks[0]}」——先講學生狀態。` : "Hook 樣本還不夠。",
    avg ? `Caption 大約 ${avg} 字。` : "",
    hashtags.length ? `Hashtag：${hashtags.join(" ")}。` : "",
    ctas.length ? `常用 CTA：${ctas.join("／")}。` : "",
    visualNotes[0] ? `視覺：${visualNotes[0]}。` : "",
    "生成新內容時優先參考這些，不要套一般品牌模板。",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    palette,
    captionAvg: avg,
    sample: captions.length,
    hooks,
    hashtags,
    ctas,
    visualNotes,
    events,
    interaction,
    summary,
  };
}

export function igDnaPrompt(dna: IgDna) {
  return dna.summary;
}

/** 成效回饋：回答「哪種 Hook / 圖片 / 文案比較有效」，不是報表。 */
export function performanceInsights(contents: ContentItem[]): IgInsightCard[] {
  const published = contents.filter((c) => c.metrics);
  if (!published.length) {
    return [
      {
        question: "現在能看出什麼？",
        answer: "連接 Instagram 並同步過去貼文後，AI 會告訴你哪種 Hook、圖片、Carousel 結構比較讓淡江學生停留。現在先用本機已發布的示範貼文練習。",
      },
    ];
  }
  const ranked = [...published].sort((a, b) => score(b.metrics!) - score(a.metrics!));
  const best = ranked[0];
  const bySave = [...published].sort((a, b) => (b.metrics!.saves || 0) - (a.metrics!.saves || 0))[0];
  const byShare = [...published].sort((a, b) => (b.metrics!.shares || 0) - (a.metrics!.shares || 0))[0];
  const carousels = published.filter((c) => c.type === "carousel");
  const stories = published.filter((c) => c.type === "story" || c.type === "poll");

  return [
    {
      question: "哪種 Hook 比較有效？",
      answer: best?.copy.hook
        ? `目前互動最好的第一句是「${best.copy.hook}」。學生會停下來的通常是在講他的狀態，不是在講社團。`
        : "樣本還少。",
    },
    {
      question: "哪種圖片學生比較停留？",
      answer: bySave?.visualDirection
        ? `收藏最高的是「${bySave.title}」，畫面方向：${bySave.visualDirection}。真實場景與留白比海報文字有效。`
        : "還沒有足夠的收藏數據。",
    },
    {
      question: "哪種活動文案比較有效？",
      answer: byShare?.copy.hook
        ? `分享最多的是「${byShare.copy.hook}」。願意轉傳的多半是可以丟給室友的、短的、有時間地點的。`
        : "分享數據還不夠。",
    },
    {
      question: "Carousel 哪種結構比較好？",
      answer: carousels.length
        ? "有輪播樣本時，Hook → 情境 → 痛點 → 活動 → CTA 比「每頁都在招生」收藏更高。"
        : "還沒有足夠的 Carousel 成效。先用「Hook → 情境 → 痛點 → 活動 → CTA」。",
    },
    {
      question: "Story 哪種互動比較多？",
      answer: stories.length
        ? "限動投票、問答比倒數貼紙更有回覆。硬廣招生的限動完播較差。"
        : "限動數據連上 IG 後會出現。建議先做「最近有好好休息嗎」這類投票。",
    },
  ];
}
