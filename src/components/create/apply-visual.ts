import { generateStudioImage } from "@/lib/ai/image";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { migrateBrief } from "@/lib/studio/brief";
import { FORMATS } from "@/lib/studio/formats";
import { uid } from "@/lib/studio/ids";
import type { ContentKind, FormatId } from "@/lib/studio/types";
import {
  aspectForTarget,
  briefFlagsForTarget,
  categoryForTarget,
  contentKindForFormat,
  convertFromPlan,
  convertTargetForFormat,
  planForConvertTarget,
  type ConvertTargetId,
} from "@/lib/zen/convert";
import type { CreativePack } from "@/lib/zen/types";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export type ApplyVisualResult =
  | { ok: true; assetId: string; projectId: string; adapter: "live" | "mock"; formatId: FormatId }
  | { ok: false; error: string };

export async function applyVisualDirection(input: {
  pack: CreativePack;
  directionId?: string;
  campaignId?: string | null;
  formatId?: FormatId;
  convertTarget?: ConvertTargetId;
  contentKind?: ContentKind;
  caption?: string;
  reuseAssetId?: string;
  projectId?: string;
  headline?: string;
  subhead?: string;
  preview?: boolean;
  touchCampaign?: boolean;
}): Promise<ApplyVisualResult> {
  const studio = useStudio.getState();
  const creative = useCreative.getState();
  const brand = studio.brands[0];
  if (!brand) return { ok: false, error: "還沒有品牌記憶。" };

  const formatId = input.formatId ?? "feed-portrait";
  const targetId = input.convertTarget ?? convertTargetForFormat(formatId);
  const aspect = aspectForTarget(targetId);
  const formatMeta = FORMATS.find((item) => item.id === formatId);
  const dir = input.pack.directions?.find((item) => item.id === input.directionId) ?? input.pack.directions?.[0];
  const converted = convertFromPlan(input.pack.plan);
  const headline = (input.headline || dir?.headline || input.pack.copy.hook).replace(/\n/g, " ").slice(0, 80);
  const subhead = (input.subhead || dir?.subhead || input.pack.campaignName).slice(0, 80);
  const planBase = dir
    ? {
        ...input.pack.plan,
        headline: headline || input.pack.plan.headline,
        subhead: subhead || input.pack.plan.subhead,
        visualDirection: dir.concept,
      }
    : { ...input.pack.plan, headline: headline || input.pack.plan.headline, subhead };
  const plan = planForConvertTarget(planBase, converted, targetId);
  const brief = migrateBrief({
    eventName: input.pack.campaignName,
    audience: "淡江大學學生",
    location: "淡江大學淡水校園",
    product: input.pack.copy.hook,
    notes: dir?.concept,
    deliverables: briefFlagsForTarget(targetId),
  });
  let project = input.projectId ? studio.projects.find((row) => row.id === input.projectId) : undefined;
  if (!project) {
    project = studio.createProject({
      name: `${input.pack.campaignName}${targetId === "post" ? "" : ` · ${targetId}`}`,
      brandId: brand.id,
      formatId,
      brief,
      templateId: plan.templateId,
    });
    studio.applyCampaignPlan(project.id, plan, brief);
    studio.setActiveFormat(project.id, formatId);
  } else {
    studio.ensureArtboard(project.id, formatId);
  }
  studio.updateProject(project.id, {
    contentKind: input.contentKind ?? contentKindForFormat(formatId),
  });
  let assetId = input.reuseAssetId ?? "";
  let adapter: "live" | "mock" = "mock";

  if (input.reuseAssetId) {
    const existing = studio.assets.find((item) => item.id === input.reuseAssetId);
    if (!existing) return { ok: false, error: "找不到這張素材。" };
    studio.placeAsset(project.id, existing.id);
    studio.updateAsset(existing.id, {
      lastUsedAt: Date.now(),
      useCount: existing.useCount + 1,
    });
    assetId = existing.id;
  } else {
    const result = await generateStudioImage({
      data: {
        prompt: `${dir?.imagePrompt || plan.visualDirection || input.pack.copy.hook}. ${input.subhead || formatMeta?.usage || targetId}`,
        aspect,
        headline,
        subhead,
      },
    });
    if (!result.ok) return { ok: false, error: result.error };
    adapter = result.adapter;
    const dataUrl = `data:${result.mime};base64,${result.b64}`;
    const blob = await (await fetch(dataUrl)).blob();
    assetId = uid("asset");
    await getAssetStorage().put(assetId, blob);
    studio.addAsset({
      id: assetId,
      name: headline.slice(0, 24) || "主視覺",
      kind: "image",
      category: categoryForTarget(targetId),
      mime: result.mime,
      width: formatMeta?.width ?? 1080,
      height: formatMeta?.height ?? 1350,
      tags: ["AI 生成", targetId, input.pack.campaignName, dir?.title ?? "方向"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: "generated",
      licenseNotes: result.adapter === "mock" ? "本機主視覺，可再進畫布或 Canva。" : "AI 生成，可再進畫布或 Canva。",
      licenseOwner: "禪光",
      favorite: false,
      lastUsedAt: Date.now(),
      useCount: 1,
    });
    studio.placeAsset(project.id, assetId);
  }
  const caption =
    input.caption ??
    [input.pack.copy.hook, "", input.pack.copy.body, "", input.pack.copy.cta, input.pack.copy.hashtags.join(" ")]
      .join("\n")
      .trim();
  studio.setCopy(project.id, { headline, caption });

  if (input.touchCampaign !== false) {
    const campaignId =
      input.campaignId ??
      creative.campaigns.find(
        (campaign) =>
          campaign.name === input.pack.campaignName || input.pack.campaignName.includes(campaign.name),
      )?.id;
    if (campaignId) {
      const campaign = useCreative.getState().campaigns.find((row) => row.id === campaignId);
      if (campaign) {
        creative.patchCampaign(campaignId, {
          coverAssetId: targetId === "post" || targetId === "carousel" ? assetId : campaign.coverAssetId ?? assetId,
          relatedAssetIds: [assetId, ...campaign.relatedAssetIds.filter((id) => id !== assetId)].slice(0, 8),
          projectIds: campaign.projectIds.includes(project.id)
            ? campaign.projectIds
            : [...campaign.projectIds, project.id],
        });
      }
    }
  }

  if (input.preview !== false) {
    useCreative.getState().setIgPreview(assetId, formatId);
  }
  return { ok: true, assetId, projectId: project.id, adapter, formatId };
}
