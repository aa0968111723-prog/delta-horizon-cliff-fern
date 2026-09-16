import type { RemoteItem } from "@/lib/connections/remote";
import { hookKind } from "./reels-cover.ts";
import type { BrandKit, Project } from "./types.ts";

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
