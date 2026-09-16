import { applyFormatSequence } from "@/components/create/apply-sequence";
import { applyVisualDirection } from "@/components/create/apply-visual";
import { uid } from "@/lib/studio/ids";
import { tonightAt } from "@/lib/zen/convert";
import { formatSuitePlan } from "@/lib/zen/from-idea";
import { applyPackToWaves, fillKeptWaveRows, mergeSuiteIntoSchedule } from "@/lib/zen/schedule";
import type { CreativePack, ScheduleItem, VisualSequence } from "@/lib/zen/types";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export type ApplySuiteResult =
  | {
      ok: true;
      count: number;
      scheduled: number;
      firstAssetId: string;
      titles: string[];
      pages: number;
    }
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
  const remembered: VisualSequence[] = [];
  let firstAssetId = "";
  let firstFormatId = steps[0]?.formatId;
  let preferred: VisualSequence | null = null;
  let pages = 0;

  for (const step of steps) {
    if (step.mode === "sequence") {
      const result = await applyFormatSequence({
        pack: input.pack,
        kind: step.id,
        campaignId,
        directionId: input.directionId,
        preview: false,
        persist: false,
        touchCampaign: false,
      });
      if (!result.ok) return result;
      generatedIds[step.id] = result.assetIds[0];
      if (!firstAssetId) {
        firstAssetId = result.assetIds[0] ?? "";
        firstFormatId = result.formatId;
      }
      assetIds.push(...result.assetIds);
      remembered.push(result.sequence);
      pages += result.assetIds.length;
      if (step.id === "carousel" || !preferred) preferred = result.sequence;
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
        sequence: result.sequence,
      });
      continue;
    }

    const reuseFrom = step.reuseFrom ? generatedIds[step.reuseFrom] : undefined;
    const result = await applyVisualDirection({
      pack: input.pack,
      directionId: input.directionId,
      campaignId,
      formatId: step.formatId,
      convertTarget: step.id,
      contentKind: step.contentKind,
      caption: step.caption,
      reuseAssetId: step.mode === "reuse" ? reuseFrom : undefined,
      preview: false,
      touchCampaign: false,
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

  if (preferred) {
    useStudio.getState().setLastProjectId(preferred.projectId);
    useStudio.getState().setSlide(preferred.projectId, 0);
    useStudio.getState().setCopy(preferred.projectId, {
      headline: input.pack.copy.hook.slice(0, 80),
      caption: [input.pack.copy.hook, "", input.pack.copy.body, "", input.pack.copy.cta, input.pack.copy.hashtags.join(" ")]
        .join("\n")
        .trim(),
    });
    useCreative.getState().setLastSequence(preferred);
  }

  useCreative.setState((state) => {
    const slotted = mergeSuiteIntoSchedule(state.schedule, pending);
    const nextSequences = [...remembered, ...state.sequences.filter((row) => !remembered.some((item) => item.kind === row.kind))].slice(
      0,
      8,
    );
    const projects: Partial<Record<string, string>> = {};
    for (const item of pending) {
      if (item.projectId) projects[item.contentKind] = item.projectId;
    }
    const current = campaignId ? state.campaigns.find((campaign) => campaign.id === campaignId) : null;
    const filled = current
      ? fillKeptWaveRows({
          items: slotted,
          campaign: current,
          pack: input.pack,
          directionId: input.directionId,
          projects,
        })
      : null;
    return {
      lastVisualAssetId: preferred?.assetIds[0] ?? firstAssetId ?? state.lastVisualAssetId,
      lastSequence: preferred ?? state.lastSequence,
      sequences: nextSequences,
      igView: firstAssetId ? "preview" : state.igView,
      previewScheduleId: pending[0]?.id ?? state.previewScheduleId,
      ...(firstFormatId ? { igFormat: preferred ? "feed-portrait" : firstFormatId } : {}),
      schedule: filled?.items ?? slotted,
      campaigns: campaignId
        ? state.campaigns.map((campaign) =>
            campaign.id === campaignId
              ? {
                  ...(filled?.campaign ?? applyPackToWaves(campaign, input.pack, input.directionId)),
                  coverAssetId: generatedIds.carousel ?? generatedIds.post ?? campaign.coverAssetId,
                  relatedAssetIds: [...new Set([...assetIds, ...campaign.relatedAssetIds])].slice(0, 8),
                  projectIds: [
                    ...new Set([
                      ...campaign.projectIds,
                      ...pending.map((item) => item.projectId).filter((id): id is string => Boolean(id)),
                    ]),
                  ],
                  updatedAt: Date.now(),
                }
              : campaign,
          )
        : state.campaigns,
    };
  });

  const liveIds = new Set(useCreative.getState().schedule.map((item) => item.id));
  const missing = pending.filter((item) => !liveIds.has(item.id));
  if (missing.length) {
    return { ok: false, error: `日曆沒寫進去：${missing.map((item) => item.title).join("、")}` };
  }
  const liveSequence = useCreative.getState().lastSequence;
  if (preferred && (!liveSequence || liveSequence.assetIds.length < 2)) {
    return { ok: false, error: "分鏡畫面沒寫進去，請再試一次。" };
  }

  return {
    ok: true,
    count: pending.length,
    scheduled: pending.length,
    firstAssetId,
    titles: pending.map((item) => item.title),
    pages,
  };
}
