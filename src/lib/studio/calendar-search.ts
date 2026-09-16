import { isEventCampaign } from "../zen/recommend.ts";

/** Same id as SEED_CAMPAIGN_ID — keep calendar tests off the seed module graph. */
const SEED_CAMPAIGN_ID = "camp_floating_light";

export type CalendarSearch = {
  campaign?: string;
};

export function calendarSearchParams(input: CalendarSearch): CalendarSearch {
  const next: CalendarSearch = {};
  if (input.campaign) next.campaign = input.campaign;
  return next;
}

/** Home 月曆: one campaign if 已排程 is a single kit, otherwise 看全部. */
export function calendarSearchFromScheduled<T extends { campaignId?: string | null }>(items: T[]): CalendarSearch {
  const ids = [...new Set(items.map((item) => item.campaignId).filter((id): id is string => Boolean(id)))];
  if (ids.length === 1) return calendarSearchParams({ campaign: ids[0] });
  return {};
}

export function hasLiveEventCampaign<T extends { id: string; name: string; type?: string }>(campaigns: T[]) {
  return campaigns.some((row) => row.id !== SEED_CAMPAIGN_ID && isEventCampaign(row));
}

export function scheduleForCampaign<
  T extends { campaignId?: string | null },
>(items: T[], campaignId?: string | null, opts?: { hideSeed?: boolean }): T[] {
  if (campaignId) return items.filter((item) => item.campaignId === campaignId);
  if (opts?.hideSeed) return items.filter((item) => item.campaignId !== SEED_CAMPAIGN_ID);
  return items;
}

export function campaignsForCalendar<T extends { id: string; name: string; type?: string }>(
  campaigns: T[],
  campaignId?: string | null,
): T[] {
  if (campaignId) return campaigns.filter((row) => row.id === campaignId);
  const events = campaigns.filter(isEventCampaign);
  if (hasLiveEventCampaign(campaigns)) {
    return events.filter((row) => row.id !== SEED_CAMPAIGN_ID);
  }
  return events;
}

export function canvaHeroAssetId(input: {
  lastAssetId?: string | null;
  campaignAssetId?: string | null;
  heroAssetId?: string | null;
}): string | undefined {
  return input.lastAssetId || input.campaignAssetId || input.heroAssetId || undefined;
}
