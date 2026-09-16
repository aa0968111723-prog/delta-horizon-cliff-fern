/** Home「今天推薦創作」— the campaign you just made, not the oldest seed date. */

import { HOOK_EXAMPLES, daysUntil } from "./context.ts";
import { guessEventName } from "./dates.ts";

/** Spec §6: recommend the live window, not the earliest calendar date. */
export const RECOMMEND_WINDOW_DAYS = 21;

export type RecommendableCampaign = {
  id: string;
  name: string;
  date: string;
  oneLiner: string;
  updatedAt: number;
  type?: string;
};

function isFormalInvite(text: string) {
  return /誠摯邀請|敬邀|蒞臨|不容錯過/.test(text);
}

function studentLine(text: string | null | undefined): string {
  const line = (text ?? "").trim();
  if (!line || isFormalInvite(line)) return "";
  return line;
}

/** A learned Hook is a new post, not a new 活動 that should steal 今天推薦. */
export function isEventCampaign(row: { name: string; type?: string }) {
  if (guessEventName(row.name)) return true;
  if (row.type && row.type !== "other") return true;
  return !/[？?]/.test(row.name);
}

/**
 * Prefer the campaign you just touched if its date is in [today, +21d].
 * Otherwise the soonest later date, then the latest past event.
 * Content pieces named after a Hook do not replace the live 活動.
 */
export function recommendCampaign<T extends RecommendableCampaign>(
  campaigns: T[],
  now = new Date(),
): T | undefined {
  if (!campaigns.length) return undefined;
  const events = campaigns.filter(isEventCampaign);
  const pool = events.length ? events : campaigns;

  const inWindow = pool.filter((row) => {
    const days = daysUntil(row.date, now);
    return days >= 0 && days <= RECOMMEND_WINDOW_DAYS;
  });
  if (inWindow.length) {
    return [...inWindow].sort((a, b) => b.updatedAt - a.updatedAt || a.date.localeCompare(b.date))[0];
  }

  const later = pool.filter((row) => daysUntil(row.date, now) > RECOMMEND_WINDOW_DAYS);
  if (later.length) {
    return [...later].sort((a, b) => a.date.localeCompare(b.date) || b.updatedAt - a.updatedAt)[0];
  }

  return [...pool].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt)[0];
}

/** Prefer this campaign's one-liner over a leftover seed IG Hook. */
export function recommendHook(
  campaign?: Pick<RecommendableCampaign, "oneLiner"> | null,
  learned?: string | null,
): string {
  return studentLine(campaign?.oneLiner) || studentLine(learned) || HOOK_EXAMPLES[0];
}
