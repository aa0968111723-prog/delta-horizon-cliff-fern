import { annotateIgPosts, hasInsightMetrics, lastLearnFromInsights } from "../club/insights.ts";
import { isoFromMs } from "./schedule.ts";
import type { IgMemoryPost, LastLearn } from "./types.ts";

function hookOf(caption: string) {
  return (caption.split("\n").map((line) => line.trim()).find(Boolean) ?? "").replace(/\s+/g, "").slice(0, 22);
}

export function igPostMatchKey(post: Pick<IgMemoryPost, "caption" | "takenAt">) {
  return `${hookOf(post.caption)}|${isoFromMs(post.takenAt)}`;
}

function preferredId(prev: IgMemoryPost, next: IgMemoryPost) {
  if (next.source === "instagram" || next.id.startsWith("ig_")) return next.id;
  if (prev.source === "instagram" || prev.id.startsWith("ig_")) return prev.id;
  return next.id;
}

function mergePair(prev: IgMemoryPost, next: IgMemoryPost): IgMemoryPost {
  return {
    ...prev,
    ...next,
    id: preferredId(prev, next),
    saves: next.saves ?? prev.saves,
    comments: next.comments ?? prev.comments,
    reach: next.reach ?? prev.reach,
    likes: next.likes ?? prev.likes,
    shares: next.shares ?? prev.shares,
    mediaUrl: next.mediaUrl ?? prev.mediaUrl,
    permalink: next.permalink ?? prev.permalink,
    analysis: next.analysis ?? prev.analysis,
    assetIds: next.assetIds.length ? next.assetIds : prev.assetIds,
  };
}

/** 官方 Insights 回來時，用同一天同一句 Hook 把數字寫進已發布記憶。 */
export function mergeIgPosts(existing: IgMemoryPost[], incoming: IgMemoryPost[]): IgMemoryPost[] {
  const byId = new Map(existing.map((post) => [post.id, post]));
  const byKey = new Map(existing.map((post) => [igPostMatchKey(post), post]));

  for (const post of incoming) {
    const prev = byId.get(post.id) ?? byKey.get(igPostMatchKey(post));
    const merged = prev ? mergePair(prev, post) : post;
    if (prev && prev.id !== merged.id) byId.delete(prev.id);
    byId.set(merged.id, merged);
    byKey.set(igPostMatchKey(merged), merged);
  }

  return [...byId.values()].sort((a, b) => b.takenAt - a.takenAt);
}

/** 官方貼文／Insights 進來時：合併數字、補學生視角分析，收藏高的那篇變成下次創作的課。 */
export function prepareIgIngest(
  existing: IgMemoryPost[],
  incoming: IgMemoryPost[],
  at = Date.now(),
): { posts: IgMemoryPost[]; lastLearn: LastLearn | null } {
  const posts = annotateIgPosts(mergeIgPosts(existing, incoming));
  return {
    posts,
    lastLearn: incoming.some(hasInsightMetrics) ? lastLearnFromInsights(posts, at) : null,
  };
}
