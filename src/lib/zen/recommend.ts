/** Home「今天推薦創作」— the campaign you just made, not the oldest seed date. */

import { HOOK_EXAMPLES, daysUntil } from "./context.ts";

/** Spec §6: recommend the live window, not the earliest calendar date. */
export const RECOMMEND_WINDOW_DAYS = 21;

export type RecommendableCampaign = {
  id: string;
  name: string;
  date: string;
  oneLiner: string;
  updatedAt: number;
};

function isFormalInvite(text: string) {
  return /誠摯邀請|敬邀|蒞臨|不容錯過/.test(text);
}

function studentLine(text: string | null | undefined): string {
  const line = (text ?? "").trim();
  if (!line || isFormalInvite(line)) return "";
  return line;
}

/**
 * Prefer the campaign you just touched if its date is in [today, +21d].
 * Otherwise the soonest later date, then the latest past event.
 */
export function recommendCampaign<T extends RecommendableCampaign>(
  campaigns: T[],
  now = new Date(),
): T | undefined {
  if (!campaigns.length) return undefined;

  const inWindow = campaigns.filter((row) => {
    const days = daysUntil(row.date, now);
    return days >= 0 && days <= RECOMMEND_WINDOW_DAYS;
  });
  if (inWindow.length) {
    return [...inWindow].sort((a, b) => b.updatedAt - a.updatedAt || a.date.localeCompare(b.date))[0];
  }

  const later = campaigns.filter((row) => daysUntil(row.date, now) > RECOMMEND_WINDOW_DAYS);
  if (later.length) {
    return [...later].sort((a, b) => a.date.localeCompare(b.date) || b.updatedAt - a.updatedAt)[0];
  }

  return [...campaigns].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt)[0];
}

/** Prefer this campaign's one-liner over a leftover seed IG Hook. */
export function recommendHook(
  campaign?: Pick<RecommendableCampaign, "oneLiner"> | null,
  learned?: string | null,
): string {
  return studentLine(campaign?.oneLiner) || studentLine(learned) || HOOK_EXAMPLES[0];
}
