import { applyVisualDirection } from "@/components/create/apply-visual";
import { uid } from "@/lib/studio/ids";
import { tonightAt } from "@/lib/zen/convert";
import { formatSuitePlan } from "@/lib/zen/from-idea";
import type { CreativePack, ScheduleItem } from "@/lib/zen/types";
import { useCreative } from "@/stores/creative-store";

export type ApplySuiteResult =
  | { ok: true; count: number; scheduled: number; firstAssetId: string; titles: string[] }
  | { ok: false; error: string };

export async function applyFormatSuite(input: {
  pack: CreativePack;
  directionId?: string;
  campaignId?: string | null;
}): Promise<ApplySuiteResult> {
  const campaignId =
    input.campaignId ??
    useCreative.getState().campaigns.find(
      (campaign) =>
        campaign.name === input.pack.campaignName || input.pack.campaignName.includes(campaign.name),
    )?.id ??
    null;
  const steps = formatSuitePlan(input.pack);
  const generatedIds: Partial<Record<(typeof steps)[number]["id"], string>> = {};
  const assetIds: string[] = [];
  const pending: ScheduleItem[] = [];
  let firstAssetId = "";
  let firstFormatId = steps[0]?.formatId;

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
    pending.push({
      id: uid("sch"),
      title: `${step.label} · ${input.pack.campaignName}`,
      contentKind: step.contentKind,
      status: "scheduled",
      scheduledAt: tonightAt(step.days),
      publishedAt: null,
      projectId: result.projectId,
      campaignId,
      captionPreview: step.caption,
    });
  }

  useCreative.setState((state) => ({
    lastVisualAssetId: firstAssetId || state.lastVisualAssetId,
    igView: firstAssetId ? "preview" : state.igView,
    ...(firstFormatId ? { igFormat: firstFormatId } : {}),
    schedule: [...pending, ...state.schedule.filter((row) => !pending.some((item) => item.id === row.id))],
    campaigns: campaignId
      ? state.campaigns.map((campaign) =>
          campaign.id === campaignId
            ? {
                ...campaign,
                coverAssetId: generatedIds.post ?? campaign.coverAssetId,
                relatedAssetIds: [...new Set([...assetIds, ...campaign.relatedAssetIds])].slice(0, 8),
                updatedAt: Date.now(),
              }
            : campaign,
        )
      : state.campaigns,
  }));

  const liveIds = new Set(useCreative.getState().schedule.map((item) => item.id));
  const missing = pending.filter((item) => !liveIds.has(item.id));
  if (missing.length) {
    return { ok: false, error: `日曆沒寫進去：${missing.map((item) => item.title).join("、")}` };
  }

  return {
    ok: true,
    count: pending.length,
    scheduled: pending.length,
    firstAssetId,
    titles: pending.map((item) => item.title),
  };
}
