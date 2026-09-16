import { uid } from "../studio/ids.ts";
import type { CampaignWave, CampaignWaveKind, ClubCampaign, ContentKind, EventKind, FormatId } from "../studio/types.ts";
import { canGraphPublish, isFeedGraphKind, isStoryGraphKind } from "./memory.ts";
import { nextKindAfter } from "./rhythm.ts";

const WAVE_LABEL: Record<CampaignWaveKind, string> = {
  warmup: "預熱",
  emotion: "情緒共鳴",
  hero: "主視覺",
  detail: "活動介紹",
  reason: "參加理由",
  countdown: "倒數",
  dayof: "當日提醒",
  recap: "活動回顧",
};

export function waveLabel(kind: CampaignWaveKind) {
  return WAVE_LABEL[kind];
}

function at(dateIso: string, plusDays: number, hour = 19) {
  const d = new Date(`${dateIso}T12:00:00+08:00`);
  d.setDate(d.getDate() + plusDays);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

function daysBetween(from: Date, to: Date) {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000));
}

/** Soft rhythm, not a hardcoded blast of ads. */
export function suggestWaves(
  campaign: Pick<ClubCampaign, "date" | "type" | "name">,
  now = new Date(),
  opts?: { recentKinds?: ContentKind[] },
): CampaignWave[] {
  const event = new Date(`${campaign.date}T19:00:00+08:00`);
  const lead = daysBetween(now, event);
  const longLead = lead >= 12;
  const kinds: Array<{ kind: CampaignWaveKind; offset: number; hour: number; notes: string }> = [];
  const recent = opts?.recentKinds ?? [];
  const needsBreath = recent.length >= 2 && ["member-story", "knowledge"].includes(nextKindAfter(recent));
  const span = Math.max(lead - 1, 1);

  kinds.push({
    kind: "warmup",
    offset: -Math.min(longLead ? 14 : 6, span),
    hour: 20,
    notes: needsBreath ? "最近連續宣傳，先插一則生活。" : longLead ? "生活感，不硬推活動名。" : "短宣傳期，先生活再活動。",
  });
  kinds.push({
    kind: "emotion",
    offset: -Math.min(longLead ? 10 : 5, span),
    hour: 21,
    notes: "讓學生覺得被看見。",
  });

  kinds.push({ kind: "hero", offset: -Math.min(7, span), hour: 19, notes: "主視覺進 Feed。" });
  kinds.push({ kind: "detail", offset: -Math.min(5, Math.max(span - 1, 1)), hour: 18, notes: "時間地點內容一次講完。" });

  if (campaign.type !== "recruit") {
    kinds.push({ kind: "reason", offset: -Math.min(3, Math.max(lead - 1, 1)), hour: 20, notes: "為什麼今晚要出門。" });
  }

  kinds.push({ kind: "countdown", offset: -1, hour: 21, notes: "Story 為主，短。" });
  kinds.push({ kind: "dayof", offset: 0, hour: 16, notes: "今天、現在、怎麼走。" });
  kinds.push({ kind: "recap", offset: 1, hour: 20, notes: "人、光、一句話，不要通稿。" });

  const seen = new Set<string>();
  return kinds
    .filter((item) => {
      const key = `${item.kind}:${item.offset}`;
      if (seen.has(item.kind) && item.kind !== "emotion") return false;
      seen.add(item.kind);
      return true;
    })
    .map((item) => ({
      id: uid("wave"),
      kind: item.kind,
      title: `${WAVE_LABEL[item.kind]} · ${campaign.name}`,
      scheduledAt: at(campaign.date, item.offset, item.hour),
      projectId: null,
      notes: item.notes,
    }));
}

/** Each campaign wave swaps a different visual axis so 換視覺 is not the same poster. */
export function waveVisualVariation(
  kind: CampaignWaveKind,
): "composition" | "mood" | "background" | "style" | "text" {
  switch (kind) {
    case "hero":
      return "composition";
    case "warmup":
    case "dayof":
      return "mood";
    case "emotion":
    case "countdown":
      return "text";
    case "reason":
      return "style";
    default:
      return "background";
  }
}

/** Countdown and 當日提醒 are Stories (9:16); the rest stay 4:5 Feed. */
export function waveFormatId(kind: CampaignWaveKind): Extract<FormatId, "story" | "feed-portrait"> {
  return kind === "countdown" || kind === "dayof" ? "story" : "feed-portrait";
}

export function contentKindForWave(kind: CampaignWaveKind): ContentKind {
  switch (kind) {
    case "warmup":
      return "member-story";
    case "emotion":
      return "ig-post";
    case "hero":
      return "carousel";
    case "detail":
      return "ig-post";
    case "reason":
      return "knowledge";
    case "countdown":
      return "countdown";
    case "dayof":
      return "story";
    case "recap":
      return "recap";
  }
}

/** Soonest scheduled first so a new tea-party kit is visible on Home / IG, not buried under LINE drafts. */
export function soonestScheduled<T extends { status: string; scheduledAt: number }>(items: T[], limit = 6): T[] {
  return [...items]
    .filter((item) => item.status === "scheduled")
    .sort((a, b) => a.scheduledAt - b.scheduledAt)
    .slice(0, limit);
}

/**
 * Home 已排程: due pieces you just wrote first (到時間發布),
 * then the recommended 活動. Seed 浮游禪光 stays out when a live event is focused.
 */
export function homeScheduled<
  T extends { id: string; status: string; scheduledAt: number; campaignId?: string | null },
>(
  items: T[],
  opts: { eventId?: string | null; pieceIds?: string[] },
  now = Date.now(),
  limit = 6,
): T[] {
  const unpublished = items.filter((item) => item.status === "scheduled");
  const pieceIds = new Set(opts.pieceIds ?? []);
  const pieceDue = dueScheduled(
    unpublished.filter((item) => item.campaignId && pieceIds.has(item.campaignId)),
    now,
  );
  const eventRows = opts.eventId
    ? soonestScheduled(
        unpublished.filter((item) => item.campaignId === opts.eventId),
        limit,
      )
    : [];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of [...pieceDue, ...eventRows]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}

/** Story strip should keep 倒數 even when Feed waves fill the generic upcoming list. */
export function igStoryStrip<T extends { status: string; scheduledAt: number; kind: string }>(items: T[], limit = 8): T[] {
  return soonestScheduled(
    items.filter((item) => item.kind === "story" || item.kind === "countdown"),
    limit,
  );
}

export function igNextReels<T extends { status: string; scheduledAt: number; kind: string }>(items: T[], limit = 3): T[] {
  return soonestScheduled(
    items.filter((item) => item.kind === "reels"),
    limit,
  );
}

/** 到時間發布：沒有 cron，過了預計時間就出現「現在可以發」。 */
export function isDue<T extends { status: string; scheduledAt: number }>(item: T, now = Date.now()) {
  return item.status === "scheduled" && item.scheduledAt <= now;
}

export function dueScheduled<T extends { status: string; scheduledAt: number }>(items: T[], now = Date.now()): T[] {
  return [...items].filter((item) => isDue(item, now)).sort((a, b) => a.scheduledAt - b.scheduledAt);
}

/** Agenda puts overdue rows first so one-tap publish is not buried under later drafts. */
export function agendaSorted<T extends { status: string; scheduledAt: number }>(items: T[], now = Date.now()): T[] {
  const due = dueScheduled(items, now);
  const rest = [...items].filter((item) => !isDue(item, now)).sort((a, b) => a.scheduledAt - b.scheduledAt);
  return [...due, ...rest];
}

/** Prefer a due Feed post, then a due Story, then a due Reels (official Graph). */
export function firstPublishable<
  T extends { status: string; scheduledAt: number; kind: ContentKind },
>(items: T[], now = Date.now()): T | undefined {
  const unpublished = [...items]
    .filter((item) => item.status !== "published")
    .sort((a, b) => a.scheduledAt - b.scheduledAt);
  const due = dueScheduled(unpublished, now);
  return (
    due.find((item) => isFeedGraphKind(item.kind)) ??
    due.find((item) => isStoryGraphKind(item.kind)) ??
    due.find((item) => canGraphPublish(item.kind)) ??
    due[0] ??
    unpublished.find((item) => isFeedGraphKind(item.kind)) ??
    unpublished.find((item) => isStoryGraphKind(item.kind)) ??
    unpublished.find((item) => canGraphPublish(item.kind)) ??
    unpublished[0]
  );
}

/** Keep wave ids when regenerating a campaign so calendar rows upsert instead of duplicating. */
export function mergeCampaignWaves(existing: CampaignWave[] | undefined, fresh: CampaignWave[]): CampaignWave[] {
  return fresh.map((row) => {
    const prev = existing?.find((wave) => wave.kind === row.kind);
    if (!prev) return row;
    return {
      ...row,
      id: prev.id,
      projectId: prev.projectId ?? row.projectId,
      imageAssetId: prev.imageAssetId,
      caption: prev.caption,
      notes: row.notes || prev.notes,
    };
  });
}

export function scheduleItemsForWave<T extends { campaignId: string | null; title: string }>(
  items: T[],
  campaignId: string,
  kind: CampaignWaveKind,
): T[] {
  const label = waveLabel(kind);
  return items.filter((item) => item.campaignId === campaignId && item.title.startsWith(label));
}

export function heroScheduleItem<T extends { campaignId: string | null; title: string; kind: string }>(
  items: T[],
  campaignId: string,
) {
  return (
    scheduleItemsForWave(items, campaignId, "hero")[0] ??
    items.find((item) => item.campaignId === campaignId && (item.kind === "carousel" || item.kind === "ig-post"))
  );
}

export function eventKindFromText(text: string): EventKind {
  if (/茶/.test(text)) return "tea";
  if (/光|浮游|燈/.test(text)) return "light";
  if (/坐|靜坐|冥想/.test(text)) return "sitting";
  if (/招新|招生|迎新/.test(text)) return "recruit";
  if (/課|工作坊/.test(text)) return "workshop";
  if (/談|分享|講座/.test(text)) return "talk";
  return "other";
}
