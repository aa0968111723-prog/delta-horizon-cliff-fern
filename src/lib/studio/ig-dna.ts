import type { RemoteItem } from "@/lib/connections/remote";
import { hookKind } from "./reels-cover.ts";
import type { BrandKit, IgHistoryReading, Project } from "./types.ts";

/**
 * Zen Club IG DNA：從社團自己做過的內容抽出習慣，
 * 讓 AI 生成新內容時優先參考自己的帳號，而不是一般品牌模板。
 *
 * 現在的來源是本機內容與品牌記憶；接上 Instagram 之後會再加入真實貼文與成效。
 */
export type IgDna = {
  captionLength: { min: number; max: number; avg: number };
  topHashtags: { tag: string; count: number }[];
  topCtas: { cta: string; count: number }[];
  kinds: { kind: string; count: number }[];
  colors: string[];
  hookStarts: string[];
  sampleCount: number;
};

export type IgInsightSummary = {
  topPosts: { title: string; likes: number; comments: number; reach: number; saved: number }[];
  totalLikes: number;
  totalComments: number;
  totalReach: number;
  totalSaved: number;
  sampleCount: number;
  /** 哪種開頭在真實數據裡比較有效。沒有數據時為空。 */
  hookWins: { kind: string; score: number; sample: string }[];
};

export function buildIgDna(
  projects: Project[],
  brand: BrandKit | undefined,
  remotePosts: RemoteItem[] = [],
): IgDna {
  const captions = [
    ...projects.map((p) => p.copy.caption.trim()).filter(Boolean),
    ...remotePosts.map((p) => p.detail).filter(Boolean),
  ];
  const lengths = captions.map((c) => c.length);
  const hashtags = new Map<string, number>();
  const ctas = new Map<string, number>();
  const kinds = new Map<string, number>();
  const hooks: string[] = [];

  for (const project of projects) {
    for (const tag of project.copy.hashtags) {
      const key = tag.startsWith("#") ? tag : `#${tag}`;
      hashtags.set(key, (hashtags.get(key) ?? 0) + 1);
    }
    const cta = project.copy.cta.trim();
    if (cta) ctas.set(cta, (ctas.get(cta) ?? 0) + 1);
    kinds.set(project.contentKind, (kinds.get(project.contentKind) ?? 0) + 1);
    const firstLine = project.copy.caption.split("\n").find((line) => line.trim());
    if (firstLine) hooks.push(firstLine.trim());
  }

  for (const draft of projects.flatMap((p) => p.copyDrafts)) {
    if (draft.hook) hooks.push(draft.hook);
    if (draft.cta) ctas.set(draft.cta, (ctas.get(draft.cta) ?? 0) + 1);
  }

  for (const post of remotePosts) {
    const firstLine = post.title.trim();
    if (firstLine) hooks.push(firstLine);
    const tags = post.detail.match(/#[^\s#]+/g) ?? [];
    for (const tag of tags) {
      hashtags.set(tag, (hashtags.get(tag) ?? 0) + 1);
    }
    kinds.set(post.kind === "video" ? "reels" : "ig-post", (kinds.get(post.kind === "video" ? "reels" : "ig-post") ?? 0) + 1);
  }

  return {
    captionLength: {
      min: lengths.length ? Math.min(...lengths) : 0,
      max: lengths.length ? Math.max(...lengths) : 0,
      avg: lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0,
    },
    topHashtags: rank(hashtags).slice(0, 8),
    topCtas: rank(ctas)
      .slice(0, 5)
      .map((row) => ({ cta: row.tag, count: row.count })),
    kinds: rank(kinds)
      .slice(0, 6)
      .map((row) => ({ kind: row.tag, count: row.count })),
    colors: (brand?.colors ?? []).map((c) => c.hex),
    hookStarts: [...new Set(hooks)].slice(0, 6),
    sampleCount: projects.length + remotePosts.length,
  };
}

export function engagementScore(metrics?: RemoteItem["metrics"]): number {
  if (!metrics) return 0;
  return (
    (metrics.likes ?? 0) +
    (metrics.comments ?? 0) * 3 +
    (metrics.saved ?? 0) * 4 +
    (metrics.shares ?? 0) * 5 +
    Math.round((metrics.reach ?? 0) / 20) +
    (metrics.plays ?? 0)
  );
}

/** 給文案／視覺／活動生成讀的帳號習慣。沒有樣本就空字串，不編造數據。 */
export function formatIgDna(dna: IgDna): string {
  if (!dna.sampleCount) return "";
  return [
    `樣本 ${dna.sampleCount} 則自己的內容`,
    dna.captionLength.avg
      ? `文案長度大約 ${dna.captionLength.avg} 字（${dna.captionLength.min}–${dna.captionLength.max}）`
      : "",
    dna.topHashtags.length ? `常用標籤：${dna.topHashtags.map((row) => row.tag).join(" ")}` : "",
    dna.topCtas.length ? `常用行動：${dna.topCtas.map((row) => row.cta).join("、")}` : "",
    dna.hookStarts.length ? `用過的開頭：${dna.hookStarts.join("／")}` : "",
    dna.kinds.length ? `常用型態：${dna.kinds.map((row) => row.kind).join("、")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** 給生成讀的真實成效。沒有數字就空字串，不編造觸及或收藏。 */
export function formatIgInsights(insights: IgInsightSummary): string {
  const hasMetrics = insights.totalLikes || insights.totalComments || insights.totalReach || insights.totalSaved;
  if (!insights.sampleCount || !hasMetrics) return "";
  return [
    `真實成效樣本 ${insights.sampleCount} 則`,
    insights.totalLikes ? `合計按讚 ${insights.totalLikes}` : "",
    insights.totalComments ? `合計留言 ${insights.totalComments}` : "",
    insights.totalReach ? `合計觸及 ${insights.totalReach}` : "",
    insights.totalSaved ? `合計收藏 ${insights.totalSaved}` : "",
    insights.hookWins.length
      ? `比較有效的開頭：${insights.hookWins.map((row) => `${row.kind}「${row.sample}」`).join("／")}`
      : "",
    insights.topPosts[0] ? `互動較高：「${insights.topPosts[0].title}」` : "",
    "生成時優先延續有效的開頭類型，不要編造成效數字。",
  ]
    .filter(Boolean)
    .join("\n");
}

function clip(text: string, max: number) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(1, max - 1))}…`;
}

/** 從統計結果整理一版可讀的帳號習慣。沒有金鑰時用這個，不編造成效。 */
export function localIgReading(dna: IgDna): IgHistoryReading {
  const continueWith: string[] = [];
  if (dna.hookStarts[0]) continueWith.push(`開頭延續「${clip(dna.hookStarts[0], 28)}」這種生活感`);
  if (dna.topCtas[0]) continueWith.push(`行動句用「${dna.topCtas[0].cta}」`);
  if (dna.topHashtags.length) {
    continueWith.push(`標籤保留 ${dna.topHashtags.slice(0, 3).map((row) => row.tag).join(" ")}`);
  }
  if (dna.captionLength.avg) continueWith.push(`文案長度大約 ${dna.captionLength.avg} 字`);
  if (!continueWith.length) {
    continueWith.push("時間地點寫清楚", "對淡江學生講話，不要講抽象的青年");
  }

  return {
    voice: dna.hookStarts[0]
      ? `像社團學長姐在說話，常用「${clip(dna.hookStarts[0], 24)}」這種開頭。`
      : "像社團學長姐在說話，短、具體、對淡江學生講話。",
    continueWith: continueWith.slice(0, 4),
    avoid: ["不要寫成像行銷公司的稿", "不要講抽象的青年或世代", "沒有真實成效就不要編造數字"],
    nextPost: dna.sampleCount
      ? "下一篇延續這個語氣，但換成現在學期正在發生的事。"
      : "先寫一篇有時間地點的社課邀請，開頭用學生正在經歷的事。",
    analyzedAt: Date.now(),
    sampleCount: dna.sampleCount,
    adapter: "local",
  };
}

export function formatIgReading(reading?: IgHistoryReading | null): string {
  if (!reading?.voice) return "";
  return [
    reading.adapter === "live" ? "AI 讀過這個帳號的過去內容" : "本機從過去內容整理的帳號習慣",
    `語氣：${reading.voice}`,
    reading.continueWith.length ? `值得延續：${reading.continueWith.join("、")}` : "",
    reading.avoid.length ? `不要再做：${reading.avoid.join("、")}` : "",
    reading.nextPost ? `下一篇可以：${reading.nextPost}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** 給模型讀的過去內文。遠端貼文優先，再補本機做過的內容。 */
export function igHistoryCaptions(projects: Project[], remotePosts: RemoteItem[], limit = 12): string[] {
  const fromRemote = remotePosts
    .map((post) => [post.title, post.detail].filter(Boolean).join("\n").trim())
    .filter(Boolean);
  const fromProjects = projects
    .map((project) => [project.copy.caption, project.copy.headline].filter(Boolean).join("\n").trim())
    .filter(Boolean);
  return [...fromRemote, ...fromProjects].slice(0, limit);
}

export function buildIgInsights(remotePosts: RemoteItem[]): IgInsightSummary {
  const withMetrics = remotePosts
    .map((post) => ({
      title: post.title,
      likes: post.metrics?.likes ?? 0,
      comments: post.metrics?.comments ?? 0,
      reach: post.metrics?.reach ?? 0,
      saved: post.metrics?.saved ?? 0,
      score: engagementScore(post.metrics),
      kind: hookKind(post.title),
    }))
    .sort((a, b) => b.score - a.score);

  const byKind = new Map<string, { score: number; sample: string }>();
  for (const row of withMetrics) {
    if (!row.score) continue;
    const prev = byKind.get(row.kind);
    if (!prev || row.score > prev.score) {
      byKind.set(row.kind, { score: (prev?.score ?? 0) + row.score, sample: row.title });
    } else {
      byKind.set(row.kind, { score: prev.score + row.score, sample: prev.sample });
    }
  }

  return {
    topPosts: withMetrics.slice(0, 5),
    totalLikes: withMetrics.reduce((sum, row) => sum + row.likes, 0),
    totalComments: withMetrics.reduce((sum, row) => sum + row.comments, 0),
    totalReach: withMetrics.reduce((sum, row) => sum + row.reach, 0),
    totalSaved: withMetrics.reduce((sum, row) => sum + row.saved, 0),
    sampleCount: remotePosts.length,
    hookWins: [...byKind.entries()]
      .map(([kind, row]) => ({ kind, score: row.score, sample: row.sample }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4),
  };
}

function rank(map: Map<string, number>): { tag: string; count: number }[] {
  return [...map.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}
