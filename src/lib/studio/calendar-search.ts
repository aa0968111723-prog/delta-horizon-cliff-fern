export type CalendarSearch = {
  campaign?: string;
};

export function calendarSearchParams(input: CalendarSearch): CalendarSearch {
  const next: CalendarSearch = {};
  if (input.campaign) next.campaign = input.campaign;
  return next;
}

export function scheduleForCampaign<T extends { campaignId?: string | null }>(items: T[], campaignId?: string | null): T[] {
  if (!campaignId) return items;
  return items.filter((item) => item.campaignId === campaignId);
}

export function campaignsForCalendar<T extends { id: string }>(campaigns: T[], campaignId?: string | null): T[] {
  if (!campaignId) return campaigns;
  return campaigns.filter((row) => row.id === campaignId);
}

export function canvaHeroAssetId(input: {
  lastAssetId?: string | null;
  campaignAssetId?: string | null;
  heroAssetId?: string | null;
}): string | undefined {
  return input.lastAssetId || input.campaignAssetId || input.heroAssetId || undefined;
}
