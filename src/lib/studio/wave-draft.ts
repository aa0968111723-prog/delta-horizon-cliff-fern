import { CONTENT_KIND_META, deliverablesForKind } from "./status.ts";
import type { Brief, Campaign, CampaignWave, ContentKind, CreativeSourceRef, FormatId } from "./types.ts";

export type WaveCopyTopic = "event" | "emotion" | "member" | "countdown" | "recap" | "knowledge";

export type ImageRatio = "4:5" | "1:1" | "9:16" | "1.91:1";

export type ArrivalSearch = {
  from?: string;
  seed?: string;
  campaignId?: string;
  contentId?: string;
  asset?: string;
  kind?: string;
  step?: string;
};

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

const claimedArrival = new Set<string>();

export function claimArrivalAutofill(
  channel: "copy" | "visuals" | "reels",
  search: ArrivalSearch,
): boolean {
  const key = `${channel}:${search.from ?? ""}|${search.seed ?? ""}|${search.campaignId ?? ""}|${search.contentId ?? ""}|${search.kind ?? ""}|${search.step ?? ""}|${search.asset ?? ""}`;
  if (claimedArrival.has(key)) return false;
  claimedArrival.add(key);
  return true;
}
export function wantsArrivalAutofill(search: ArrivalSearch): boolean {
  if (search.from === "image" || Boolean(search.asset)) return false;
  if (search.from === "idea" && !search.seed && !search.campaignId && !search.contentId) return false;
  return Boolean(search.seed || search.campaignId || search.contentId || search.kind || search.step === "visual");
}

/**
 * 從首頁「AI 幫我創作」、活動節奏、延續這則、快速開始進來時自動寫文案。
 * 從一張圖進來、或這則已經有草稿時不自動跑。
 */
export function shouldAutofillCopy(
  search: ArrivalSearch,
  ready: { hydrated: boolean; hasDrafts: boolean; hasPrompt: boolean },
): boolean {
  if (!ready.hydrated) return false;
  if (ready.hasDrafts) return false;
  if (!ready.hasPrompt) return false;
  return wantsArrivalAutofill(search);
}

export function shouldAutofillVisuals(
  search: ArrivalSearch,
  ready: { hydrated: boolean; hasDirections: boolean; hasIntent: boolean },
): boolean {
  if (!ready.hydrated) return false;
  if (ready.hasDirections) return false;
  if (!ready.hasIntent) return false;
  return wantsArrivalAutofill(search);
}

/** 從活動節奏／首頁進來時，第一版文案直接套到已建立的內容上。 */
export function shouldAutoApplyArrivalDraft(
  search: ArrivalSearch,
  ready: { hasLinkedProject: boolean; hasUsedDraft: boolean; hasCaption: boolean },
): boolean {
  if (!ready.hasLinkedProject) return false;
  if (ready.hasUsedDraft) return false;
  if (ready.hasCaption) return false;
  return wantsArrivalAutofill(search);
}

export function shouldAutofillReels(
  search: ArrivalSearch,
  kind: ContentKind,
  ready: { hydrated: boolean; hasReels: boolean; hasPrompt: boolean },
): boolean {
  if (kind !== "reels") return false;
  if (!ready.hydrated) return false;
  if (ready.hasReels) return false;
  if (!ready.hasPrompt) return false;
  return wantsArrivalAutofill(search);
}

export function visualIntent(parts: { idea?: string; eventName?: string; oneLiner?: string }): string {
  return (
    [parts.idea?.trim(), parts.eventName?.trim() ? `活動：${parts.eventName.trim()}` : "", parts.oneLiner?.trim()]
      .filter(Boolean)
      .join("／") || "淡江大學禪學社社課"
  );
}

export function defaultImageRatio(kind: ContentKind): ImageRatio {
  if (kind === "line") return "1.91:1";
  if (kind === "story" || kind === "countdown" || kind === "poll" || kind === "reels") return "9:16";
  if (kind === "threads" || kind === "qa") return "1:1";
  return "4:5";
}

function campaignDateMs(date: string): number {
  const parsed = Date.parse(`${date}T00:00:00`);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

/** 快速開始只帶 kind 時，用最近一場活動裡對得上的節奏當想法。 */
export function pickArrivalWave(
  campaigns: Campaign[],
  kind: ContentKind,
  campaignId?: string,
): { campaign: Campaign; wave: CampaignWave } | null {
  const list = campaignId
    ? campaigns.filter((campaign) => campaign.id === campaignId)
    : [...campaigns].sort((a, b) => campaignDateMs(a.date) - campaignDateMs(b.date));
  for (const campaign of list) {
    const pendingMatch = campaign.waves.find((wave) => !wave.contentId && wave.kind === kind);
    if (pendingMatch) return { campaign, wave: pendingMatch };
    const anyMatch = campaign.waves.find((wave) => wave.kind === kind);
    if (anyMatch) return { campaign, wave: anyMatch };
  }
  for (const campaign of list) {
    const pending = campaign.waves.find((wave) => !wave.contentId);
    if (pending) return { campaign, wave: pending };
  }
  return list[0] && list[0].waves[0] ? { campaign: list[0], wave: list[0].waves[0] } : null;
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
