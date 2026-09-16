import type { ContentKind } from "../studio/types.ts";
import type { CampaignWave } from "./types.ts";

export const PACK_SCHEDULE_KINDS: ContentKind[] = ["carousel", "story", "reels", "threads"];

export const STORY_COVER_KINDS: ContentKind[] = ["story", "reels", "countdown"];

export function usesStoryCover(kind: ContentKind) {
  return STORY_COVER_KINDS.includes(kind);
}

/** Story／Reels 用 9:16；Carousel／Threads 用主視覺，互不覆蓋。 */
export function coverForKind<T>(
  kind: ContentKind,
  covers: { feed?: T | null; story?: T | null },
): T | null {
  if (usesStoryCover(kind)) return covers.story ?? covers.feed ?? null;
  return covers.feed ?? null;
}

export type PackForSchedule = {
  plan: {
    hook: string;
    campaignName: string;
    cta: string;
    insight: string;
    body: string;
    subhead: string;
  };
  conversions: {
    threads: string;
    line: string;
    story: Array<{ headline: string; body?: string }>;
    reels: Array<{ caption: string }>;
  };
};

function firstLine(text: string) {
  return text.split("\n").map((line) => line.trim()).find(Boolean) ?? text.trim();
}

/** 各格式用自己的稿，不要四則都貼同一段招生文。 */
export function captionForPackKind(
  pack: PackForSchedule,
  kind: ContentKind,
  fallback?: { hook: string; body: string; cta: string; hashtags: string[] },
) {
  if (kind === "threads") return pack.conversions.threads || fallback?.body || pack.plan.hook;
  if (kind === "line") return pack.conversions.line || `${pack.plan.hook}\n${pack.plan.cta}`;
  if (kind === "story") {
    const story = pack.conversions.story.map((frame) => [frame.headline, frame.body].filter(Boolean).join("\n")).join("\n");
    return story || pack.plan.hook;
  }
  if (kind === "reels") {
    const reels = pack.conversions.reels.map((beat) => beat.caption).filter(Boolean).join("\n");
    return reels || pack.plan.hook;
  }
  if (fallback) return `${fallback.body}\n\n${fallback.cta}\n${fallback.hashtags.join(" ")}`.trim();
  return `${pack.plan.body}\n\n${pack.plan.cta}`.trim();
}

export function topicForPackKind(pack: PackForSchedule, kind: ContentKind) {
  return firstLine(captionForPackKind(pack, kind)) || pack.plan.hook;
}

/** 節奏上的空波用這次生成的句子填上，還沒成稿的仍可之後單獨生成。 */
export function annotateWavesFromPack(waves: CampaignWave[], pack: PackForSchedule): CampaignWave[] {
  const byIntent: Record<string, string> = {
    預熱: pack.plan.hook,
    生活: pack.plan.insight,
    情緒共鳴: pack.plan.hook,
    互動: "你這週有真的休息嗎",
    主視覺: pack.plan.campaignName,
    活動內容: firstLine(pack.plan.body) || pack.plan.subhead,
    故事: pack.plan.insight,
    倒數: pack.plan.subhead || "明天這個時候",
    當天: pack.conversions.story[0]?.headline || "今天晚上見",
    回顧: "昨天有人真的坐下來了",
  };
  return waves.map((wave) => {
    if (wave.projectId || wave.status === "published") return wave;
    const topic = byIntent[wave.intent];
    if (!topic) return wave;
    return { ...wave, topic };
  });
}

export function remainingPackKinds(waves: CampaignWave[], kinds: ContentKind[] = PACK_SCHEDULE_KINDS) {
  const taken = new Set(
    waves.filter((wave) => wave.projectId && wave.status !== "idea").map((wave) => wave.contentKind),
  );
  return kinds.filter((kind) => !taken.has(kind));
}
