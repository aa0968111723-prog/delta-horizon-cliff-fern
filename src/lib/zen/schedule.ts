import { uid } from "../studio/ids.ts";
import type { CampaignWave, CampaignWaveKind, ClubCampaign, EventKind } from "../studio/types.ts";

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
export function suggestWaves(campaign: Pick<ClubCampaign, "date" | "type" | "name">, now = new Date()): CampaignWave[] {
  const event = new Date(`${campaign.date}T19:00:00+08:00`);
  const lead = daysBetween(now, event);
  const longLead = lead >= 12;
  const kinds: Array<{ kind: CampaignWaveKind; offset: number; hour: number; notes: string }> = [];

  if (longLead) {
    kinds.push({ kind: "warmup", offset: -Math.min(14, lead - 1), hour: 20, notes: "生活感，不硬推活動名。" });
    kinds.push({ kind: "emotion", offset: -Math.min(10, lead - 1), hour: 21, notes: "讓學生覺得被看見。" });
  } else {
    kinds.push({ kind: "emotion", offset: -Math.min(6, Math.max(lead - 1, 1)), hour: 21, notes: "先共鳴再宣傳。" });
  }

  kinds.push({ kind: "hero", offset: -Math.min(7, Math.max(lead - 1, 1)), hour: 19, notes: "主視覺進 Feed。" });
  kinds.push({ kind: "detail", offset: -Math.min(5, Math.max(lead - 1, 1)), hour: 18, notes: "時間地點內容一次講完。" });

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

export function eventKindFromText(text: string): EventKind {
  if (/茶/.test(text)) return "tea";
  if (/光|浮游|燈/.test(text)) return "light";
  if (/坐|靜坐|冥想/.test(text)) return "sitting";
  if (/招新|招生|迎新/.test(text)) return "recruit";
  if (/課|工作坊|工作坊/.test(text)) return "workshop";
  if (/談|分享|講座/.test(text)) return "talk";
  return "other";
}
