import type { ContentKind } from "../studio/types.ts";
import { buildPublishedPost } from "./publish.ts";
import type { ClubCampaign, IgMemoryPost } from "./types.ts";

export type MarkPublishedInput = {
  campaigns: ClubCampaign[];
  campaignId?: string;
  waveId?: string;
  projectId?: string;
  title?: string;
  caption?: string;
  kind?: ContentKind;
  assetIds?: string[];
  now?: number;
};

export type MarkPublishedResult = {
  campaigns: ClubCampaign[];
  post: IgMemoryPost;
  campaignId?: string;
  waveId?: string;
  projectId?: string;
};

function resolveWave(campaigns: ClubCampaign[], input: MarkPublishedInput) {
  let campaignId = input.campaignId;
  let waveId = input.waveId;
  if (!campaignId && input.projectId) {
    for (const campaign of campaigns) {
      const wave = campaign.waves.find((item) => item.projectId === input.projectId);
      if (wave) {
        campaignId = campaign.id;
        waveId = waveId ?? wave.id;
        break;
      }
    }
  }
  const campaign = campaignId ? campaigns.find((item) => item.id === campaignId) : undefined;
  const wave =
    campaign && waveId
      ? campaign.waves.find((item) => item.id === waveId)
      : campaign?.waves.find((item) => item.projectId && item.projectId === input.projectId) ??
        campaign?.waves.find((item) => item.status === "scheduled") ??
        campaign?.waves.find((item) => item.intent === "主視覺");
  return { campaign, wave, campaignId, waveId: wave?.id ?? waveId };
}

export function applyMarkPublished(input: MarkPublishedInput): MarkPublishedResult | null {
  const now = input.now ?? Date.now();
  const { campaign, wave, campaignId, waveId } = resolveWave(input.campaigns, input);
  const title = input.title?.trim() || wave?.topic || "";
  const caption = input.caption?.trim() || title;
  if (!wave && !title && !caption) return null;
  const kind: ContentKind = input.kind ?? wave?.contentKind ?? "ig-post";
  const post = buildPublishedPost({
    title: title || "已發布內容",
    caption: caption || title || "已發布內容",
    kind,
    assetIds: input.assetIds,
    publishedAt: now,
  });
  const campaigns =
    campaign && wave
      ? input.campaigns.map((item) =>
          item.id === campaign.id
            ? {
                ...item,
                updatedAt: now,
                waves: item.waves.map((row) =>
                  row.id === wave.id ? { ...row, status: "published" as const, publishedAt: now } : row,
                ),
              }
            : item,
        )
      : input.campaigns;
  return {
    campaigns,
    post,
    campaignId,
    waveId,
    projectId: input.projectId ?? wave?.projectId ?? undefined,
  };
}
