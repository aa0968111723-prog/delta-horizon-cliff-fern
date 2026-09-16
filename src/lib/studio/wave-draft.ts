import { CONTENT_KIND_META, deliverablesForKind } from "./status.ts";
import type { Brief, Campaign, CampaignWave, ContentKind, CreativeSourceRef, FormatId } from "./types.ts";

export type WaveCopyTopic = "event" | "emotion" | "member" | "countdown" | "recap" | "knowledge";

export type WaveCreateSearch = {
  from: "idea";
  contentId: string;
  kind: ContentKind;
  campaignId: string;
  seed: string;
};

export type WaveProjectFields = {
  name: string;
  brandId: string;
  formatId: FormatId;
  contentKind: ContentKind;
  campaignId: string;
  status: "making";
  brief: Brief;
  sources: CreativeSourceRef[];
};

/** 活動節奏進來時用活動宣傳；限動倒數／回顧／社員故事走對應主題。 */
export function topicForKind(kind: ContentKind, hasCampaign: boolean): WaveCopyTopic {
  if (kind === "countdown") return "countdown";
  if (kind === "recap") return "recap";
  if (kind === "knowledge" || kind === "qa") return "knowledge";
  if (kind === "member-story") return "member";
  return hasCampaign ? "event" : "emotion";
}

/**
 * 從首頁「AI 幫我創作」、活動節奏、延續這則進來時自動寫文案。
 * 從一張圖進來、或這則已經有草稿時不自動跑。
 */
export function shouldAutofillCopy(
  search: {
    from?: string;
    seed?: string;
    campaignId?: string;
    contentId?: string;
    asset?: string;
  },
  ready: { hydrated: boolean; hasDrafts: boolean; hasPrompt: boolean },
): boolean {
  if (!ready.hydrated) return false;
  if (search.from === "image" || Boolean(search.asset)) return false;
  if (ready.hasDrafts) return false;
  if (!ready.hasPrompt) return false;
  return Boolean(search.seed || search.campaignId || search.contentId);
}

export function waveCreateSearch(
  projectId: string,
  wave: Pick<CampaignWave, "kind" | "hook">,
  campaignId: string,
): WaveCreateSearch {
  return {
    from: "idea",
    contentId: projectId,
    kind: wave.kind,
    campaignId,
    seed: wave.hook,
  };
}

/** 依波次型態建草稿：限動用 9:16、Reels 用封面，不要一律 4:5。 */
export function waveProjectFields(input: {
  brandId: string;
  campaign: Pick<
    Campaign,
    "id" | "name" | "date" | "time" | "location" | "oneLiner" | "intro" | "audienceIds"
  >;
  wave: Pick<CampaignWave, "title" | "kind" | "hook" | "note" | "stage">;
}): WaveProjectFields {
  const { brandId, campaign, wave } = input;
  const meta = CONTENT_KIND_META[wave.kind];
  return {
    name: wave.title || campaign.name,
    brandId,
    formatId: meta.formatId,
    contentKind: wave.kind,
    campaignId: campaign.id,
    status: "making",
    brief: {
      product: campaign.name,
      eventName: campaign.name,
      schedule: `${campaign.date} ${campaign.time}`.trim(),
      location: campaign.location,
      offer: campaign.oneLiner,
      audience: campaign.audienceIds.join("、"),
      goal: "awareness",
      features: wave.hook || campaign.intro,
      style: "安靜、具體、不說教",
      notes: wave.note,
      deliverables: deliverablesForKind(wave.kind),
    },
    sources: [
      {
        kind: "local",
        label: `活動 / ${campaign.name}`,
        detail: `${wave.stage}·${wave.title}`,
      },
    ],
  };
}
