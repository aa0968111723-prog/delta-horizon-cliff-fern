import { applyVisualDirection } from "@/components/create/apply-visual";
import {
  convertFromPlan,
  convertTargetById,
  sequenceBeats,
  type ConvertTargetId,
} from "@/lib/zen/convert";
import { pagesOf } from "@/lib/studio/layers";
import type { CreativePack, VisualSequence } from "@/lib/zen/types";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export type ApplySequenceResult =
  | {
      ok: true;
      assetIds: string[];
      labels: string[];
      projectId: string;
      formatId: ReturnType<typeof convertTargetById>["formatId"];
      sequence: VisualSequence;
    }
  | { ok: false; error: string };

export async function applyFormatSequence(input: {
  pack: CreativePack;
  kind: ConvertTargetId;
  campaignId?: string | null;
  directionId?: string;
  preview?: boolean;
  persist?: boolean;
  touchCampaign?: boolean;
}): Promise<ApplySequenceResult> {
  const target = convertTargetById(input.kind);
  const beats = sequenceBeats(convertFromPlan(input.pack.plan), target.formatId, target.contentKind);
  if (beats.length < 2) {
    return { ok: false, error: "這則還沒有分鏡可以做成畫面。" };
  }

  const assetIds: string[] = [];
  const labels: string[] = [];
  let projectId = "";
  let formatId = target.formatId;
  const persist = input.persist !== false;
  const preview = input.preview !== false;

  for (const [index, beat] of beats.entries()) {
    if (index > 0 && projectId) {
      const project = useStudio.getState().projects.find((row) => row.id === projectId);
      const pages = project ? pagesOf(project, target.formatId) : [];
      if (pages.length <= index) useStudio.getState().addSlide(projectId, "blank");
      else useStudio.getState().setSlide(projectId, index);
    }
    const result = await applyVisualDirection({
      pack: input.pack,
      directionId: input.directionId,
      campaignId: input.campaignId,
      formatId: target.formatId,
      convertTarget: target.id,
      contentKind: target.contentKind,
      caption: beat.title,
      headline: beat.title,
      subhead: beat.kicker,
      projectId: projectId || undefined,
      preview: false,
      touchCampaign: persist && input.touchCampaign !== false && index === 0,
    });
    if (!result.ok) return result;
    projectId = result.projectId;
    formatId = result.formatId;
    assetIds.push(result.assetId);
    labels.push(beat.kicker);
  }

  const sequence: VisualSequence = { kind: input.kind, labels, assetIds, projectId };

  if (persist) {
    const campaignId =
      input.campaignId ??
      useCreative.getState().campaigns.find(
        (campaign) =>
          campaign.name === input.pack.campaignName || input.pack.campaignName.includes(campaign.name),
      )?.id ??
      null;
    useCreative.getState().setLastSequence(sequence);
    useCreative.setState((state) => ({
      lastVisualAssetId: assetIds[0] ?? state.lastVisualAssetId,
      igView: preview ? "preview" : state.igView,
      igFormat: formatId,
      campaigns: campaignId
        ? state.campaigns.map((campaign) =>
            campaign.id === campaignId
              ? {
                  ...campaign,
                  coverAssetId:
                    input.kind === "carousel" ? (assetIds[0] ?? campaign.coverAssetId) : campaign.coverAssetId,
                  relatedAssetIds: [...new Set([...assetIds, ...campaign.relatedAssetIds])].slice(0, 8),
                  projectIds: campaign.projectIds.includes(projectId)
                    ? campaign.projectIds
                    : [...campaign.projectIds, projectId],
                  updatedAt: Date.now(),
                }
              : campaign,
          )
        : state.campaigns,
    }));
    const live = useCreative.getState().lastSequence;
    if (!live || live.assetIds.length !== assetIds.length) {
      return { ok: false, error: "分鏡畫面沒寫進去，請再試一次。" };
    }
  }

  useStudio.getState().setSlide(projectId, 0);
  if (preview) useStudio.getState().setLastProjectId(projectId);
  return { ok: true, assetIds, labels, projectId, formatId, sequence };
}
