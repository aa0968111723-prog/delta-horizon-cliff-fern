import type { ConnectionMeta, IgMemoryPost } from "@/lib/studio/types";

export type InsightsSync = {
  connected: boolean;
  igPosts: IgMemoryPost[];
  accountLabel?: string;
};

export type InsightsLearnPatch = {
  posts: IgMemoryPost[] | null;
  connection: (Pick<ConnectionMeta, "lastSyncAt" | "status"> & { accountLabel?: string }) | null;
};

/** Empty disconnected sync must not wipe Creative Memory. */
export function insightsLearnPatch(result: InsightsSync, now = Date.now()): InsightsLearnPatch {
  return {
    posts: result.igPosts.length ? result.igPosts : null,
    connection: result.connected
      ? {
          lastSyncAt: now,
          status: "connected",
          ...(result.accountLabel ? { accountLabel: result.accountLabel } : {}),
        }
      : null,
  };
}

export function extraFromIgMemory<
  T extends {
    igMediaId?: string;
    permalink?: string;
    saves?: number;
    reach?: number;
    impressions?: number;
    shares?: number;
    plays?: number;
  },
>(
  extra: T | undefined,
  posts: Array<{
    id: string;
    permalink?: string;
    saves?: number;
    reach?: number;
    impressions?: number;
    shares?: number;
    plays?: number;
  }>,
): T | undefined {
  if (!extra) return extra;
  const post = posts.find(
    (row) =>
      (extra.igMediaId && row.id === `ig:${extra.igMediaId}`) ||
      (extra.permalink && extra.permalink === row.permalink),
  );
  if (!post) return extra;
  return {
    ...extra,
    saves: extra.saves ?? post.saves,
    reach: extra.reach ?? post.reach,
    impressions: extra.impressions ?? post.impressions,
    shares: extra.shares ?? post.shares,
    plays: extra.plays ?? post.plays,
  };
}
