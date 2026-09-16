import { guessEventName } from "../zen/dates.ts";
import { hookLine } from "../zen/insights.ts";
import type { CreativeHit } from "../zen/search.ts";

/** Drive / Canva filenames stay pinned; the spoken idea is the event, not「2025 茶會現場」. */
export function spokenIdeaFromFile(title: string) {
  return guessEventName(title) || title;
}

export type CreateSearch = {
  mode?: string;
  idea?: string;
  asset?: string;
  campaign?: string;
  remote?: string;
};

/** Omit empty keys so optional search params stay out of the URL. */
export function createSearchParams(input: CreateSearch): CreateSearch {
  const next: CreateSearch = {};
  if (input.mode) next.mode = input.mode;
  if (input.idea) next.idea = input.idea;
  if (input.asset) next.asset = input.asset;
  if (input.campaign) next.campaign = input.campaign;
  if (input.remote) next.remote = input.remote;
  return next;
}

/** Local studio canvases stay in /studio. Drive / Canva / IG / 素材 go to AI 創作. */
export function isStudioHit(hit: Pick<CreativeHit, "source" | "projectId" | "remoteId" | "assetId" | "campaignId">) {
  return Boolean(hit.projectId) && hit.source === "local" && !hit.remoteId && !hit.assetId && !hit.campaignId;
}

/** Spec 二十三：搜尋縮圖後直接加入創作，並帶上那份來源。 */
export function createSearchFromHit(hit: CreativeHit): CreateSearch {
  if (hit.campaignId) {
    return createSearchParams({ mode: "campaign", idea: hit.title, campaign: hit.campaignId });
  }
  if (hit.source === "canva" && hit.remoteId) {
    return createSearchParams({ mode: "from-canva", idea: spokenIdeaFromFile(hit.title), remote: hit.remoteId });
  }
  if (hit.source === "drive" && hit.remoteId) {
    return createSearchParams({ mode: "from-drive", idea: spokenIdeaFromFile(hit.title), remote: hit.remoteId });
  }
  if (hit.source === "instagram") {
    return createSearchParams({
      mode: "from-ig",
      idea: hookLine(hit.title),
      asset: hit.assetId,
    });
  }
  if (hit.assetId) {
    return createSearchParams({
      mode: "from-image",
      idea: `延續「${hit.title}」的風格，做新的活動，不要複製舊作品。`,
      asset: hit.assetId,
    });
  }
  return createSearchParams({ mode: "idea", idea: hit.title });
}
