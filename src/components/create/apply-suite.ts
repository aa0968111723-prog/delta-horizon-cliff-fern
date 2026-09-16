import { applyVisualDirection } from "@/components/create/apply-visual";
import { uid } from "@/lib/studio/ids";
import { tonightAt } from "@/lib/zen/convert";
import { formatSuitePlan } from "@/lib/zen/from-idea";
import type { CreativePack } from "@/lib/zen/types";
import { useCreative } from "@/stores/creative-store";

export type ApplySuiteResult =
  | { ok: true; count: number; scheduled: number; firstAssetId: string }
  | { ok: false; error: string };

export async function applyFormatSuite(input: {
  pack: CreativePack;
  directionId?: string;
  campaignId?: string | null;
}): Promise<ApplySuiteResult> {
  const creative = useCreative.getState();
  const campaignId =
    input.campaignId ??
    creative.campaigns.find(
      (campaign) =>
        campaign.name === input.pack.campaignName || input.pack.campaignName.includes(campaign.name),
    )?.id ??
    null;
  const steps = formatSuitePlan(input.pack);
  const generatedIds: Partial<Record<(typeof steps)[number]["id"], string>> = {};
  const assetIds: string[] = [];
  let firstAssetId = "";
  let firstFormatId = steps[0]?.formatId;
  let scheduled = 0;

  for (const step of steps) {
    const reuseFrom = step.reuseFrom ? generatedIds[step.reuseFrom] : undefined;
    const result = await applyVisualDirection({
      pack: input.pack,
      directionId: input.directionId,
      campaignId,
      formatId: step.formatId,
      convertTarget: step.id,
      contentKind: step.contentKind,
      caption: step.caption,
      reuseAssetId: step.generate ? undefined : reuseFrom,
    });
    if (!result.ok) return result;
    generatedIds[step.id] = result.assetId;
    if (!firstAssetId) {
      firstAssetId = result.assetId;
      firstFormatId = result.formatId;
    }
    assetIds.push(result.assetId);
    creative.upsertSchedule({
      id: uid("sch"),
      title: `${input.pack.copy.hook} · ${step.label}`,
      contentKind: step.contentKind,
      status: "scheduled",
      scheduledAt: tonightAt(step.days),
      publishedAt: null,
      projectId: result.projectId,
      campaignId,
      captionPreview: step.caption,
    });
    scheduled += 1;
  }

  if (firstAssetId && firstFormatId) {
    creative.setIgPreview(firstAssetId, firstFormatId);
  }

  if (campaignId) {
    const campaign = useCreative.getState().campaigns.find((row) => row.id === campaignId);
    if (campaign) {
      creative.patchCampaign(campaignId, {
        coverAssetId: generatedIds.post ?? campaign.coverAssetId,
        relatedAssetIds: [...new Set([...assetIds, ...campaign.relatedAssetIds])].slice(0, 8),
      });
    }
  }

  return { ok: true, count: steps.length, scheduled, firstAssetId };
}
