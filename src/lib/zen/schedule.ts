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

/** Clock times are 淡水 evenings, not the host timezone. Taipei has no DST. */
function at(dateIso: string, plusDays: number, hour = 19) {
  const [year, month, day] = dateIso.split("-").map(Number);
  return Date.UTC(year, (month || 1) - 1, (day || 1) + plusDays, hour - 8, 0, 0);
}

function daysBetween(from: Date, to: Date) {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000));
}

const WAVE_HOUR: Record<CampaignWaveKind, number> = {
  warmup: 20,
  emotion: 21,
  hero: 19,
  detail: 18,
  reason: 20,
  countdown: 21,
  dayof: 16,
  recap: 20,
};

/**
 * Pre-event waves keep order 生活 → 情緒 → 主視覺 → 介紹 → 理由,
 * and never land 預熱 on the same evening after 主視覺.
 */
export function placePreEventWaves(
  lead: number,
  longLead: boolean,
  includeReason: boolean,
): Array<{ kind: CampaignWaveKind; offset: number; hour: number }> {
  type PreKind = "warmup" | "emotion" | "hero" | "detail" | "reason";
  const kinds: PreKind[] = ["warmup", "emotion", "hero", "detail"];
  if (includeReason) kinds.push("reason");
  const minOff = -lead;
  const maxOff = -2;
  const ideals: Record<PreKind, number> = {
    warmup: -lead,
    emotion: -(longLead ? 10 : Math.min(5, Math.max(lead - 1, 1))),
    hero: -(longLead ? 7 : Math.min(5, Math.max(lead - 2, 1))),
    detail: -(longLead ? 5 : Math.min(4, Math.max(lead - 3, 1))),
    reason: -(longLead ? 3 : Math.min(3, Math.max(lead - 4, 1))),
  };
  const items = kinds.map((kind) => ({
    kind,
    offset: Math.min(maxOff, Math.max(minOff, ideals[kind])),
    hour: WAVE_HOUR[kind],
  }));
  for (let i = 1; i < items.length; i++) {
    if (items[i].offset <= items[i - 1].offset) {
      items[i].offset = items[i - 1].offset + 1;
    }
  }
  const overflow = items[items.length - 1].offset - maxOff;
  if (overflow > 0) {
    for (const item of items) item.offset -= overflow;
    if (items[0].offset < minOff) {
      items[0].offset = minOff;
      for (let i = 1; i < items.length; i++) {
        items[i].offset = Math.min(maxOff, Math.max(items[i - 1].offset + 1, items[i].offset));
      }
    }
  }
  return items;
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
  const recent = opts?.recentKinds ?? [];
  const needsBreath = recent.length >= 2 && ["member-story", "knowledge"].includes(nextKindAfter(recent));
  const notes: Record<CampaignWaveKind, string> = {
    warmup: needsBreath ? "最近連續宣傳，先插一則生活。" : longLead ? "生活感，不硬推活動名。" : "短宣傳期，先生活再活動。",
    emotion: "讓學生覺得被看見。",
    hero: "主視覺進 Feed。",
    detail: "時間地點內容一次講完。",
    reason: "為什麼今晚要出門。",
    countdown: "Story 為主，短。",
    dayof: "今天、現在、怎麼走。",
    recap: "人、光、一句話，不要通稿。",
  };
  const kinds: Array<{ kind: CampaignWaveKind; offset: number; hour: number; notes: string }> = [
    ...placePreEventWaves(lead, longLead, campaign.type !== "recruit").map((item) => ({
      ...item,
      notes: notes[item.kind],
    })),
    { kind: "countdown", offset: -1, hour: WAVE_HOUR.countdown, notes: notes.countdown },
    { kind: "dayof", offset: 0, hour: WAVE_HOUR.dayof, notes: notes.dayof },
    { kind: "recap", offset: 1, hour: WAVE_HOUR.recap, notes: notes.recap },
  ];

  return kinds.map((item) => ({
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
