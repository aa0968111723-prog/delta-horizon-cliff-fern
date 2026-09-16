import { generateStudioImage } from "@/lib/ai/image";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { migrateBrief } from "@/lib/studio/brief";
import { uid } from "@/lib/studio/ids";
import type { CreativePack } from "@/lib/zen/types";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export type ApplyVisualResult =
  | { ok: true; assetId: string; projectId: string; adapter: "live" | "mock" }
  | { ok: false; error: string };

export async function applyVisualDirection(input: {
  pack: CreativePack;
  directionId?: string;
  campaignId?: string | null;
}): Promise<ApplyVisualResult> {
  const studio = useStudio.getState();
  const creative = useCreative.getState();
  const brand = studio.brands[0];
  if (!brand) return { ok: false, error: "還沒有品牌記憶。" };

  const dir = input.pack.directions?.find((item) => item.id === input.directionId) ?? input.pack.directions?.[0];
  const plan = dir
    ? {
        ...input.pack.plan,
        headline: dir.headline || input.pack.plan.headline,
        subhead: dir.subhead || input.pack.plan.subhead,
        visualDirection: dir.concept,
      }
    : input.pack.plan;
  const brief = migrateBrief({
    eventName: input.pack.campaignName,
    audience: "淡江大學學生",
    location: "淡江大學淡水校園",
    product: input.pack.copy.hook,
    notes: dir?.concept,
    deliverables: { post: true, story: true, carousel: true, reels: true, threads: true, line: true },
  });
  const project = studio.createProject({
    name: input.pack.campaignName,
    brandId: brand.id,
    formatId: "feed-portrait",
    brief,
    templateId: plan.templateId,
  });
  studio.applyCampaignPlan(project.id, plan, brief);

  const headline = (dir?.headline || input.pack.copy.hook).replace(/\n/g, " ").slice(0, 80);
  const result = await generateStudioImage({
    data: {
      prompt: dir?.imagePrompt || plan.visualDirection || input.pack.copy.hook,
      aspect: "4:5",
      headline,
      subhead: (dir?.subhead || input.pack.campaignName).slice(0, 80),
    },
  });
  if (!result.ok) return { ok: false, error: result.error };

  const dataUrl = `data:${result.mime};base64,${result.b64}`;
  const blob = await (await fetch(dataUrl)).blob();
  const assetId = uid("asset");
  await getAssetStorage().put(assetId, blob);
  studio.addAsset({
    id: assetId,
    name: headline.slice(0, 24) || "主視覺",
    kind: "image",
    category: "generated",
    mime: result.mime,
    width: 1080,
    height: 1350,
    tags: ["AI 生成", "主視覺", input.pack.campaignName, dir?.title ?? "方向"],
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
  studio.setCopy(project.id, {
    headline,
    caption: [input.pack.copy.hook, "", input.pack.copy.body, "", input.pack.copy.cta, input.pack.copy.hashtags.join(" ")]
      .join("\n")
      .trim(),
  });

  const campaignId =
    input.campaignId ??
    creative.campaigns.find(
      (campaign) =>
        campaign.name === input.pack.campaignName || input.pack.campaignName.includes(campaign.name),
    )?.id;
  if (campaignId) {
    const campaign = creative.campaigns.find((row) => row.id === campaignId);
    if (campaign) {
      creative.upsertCampaign({
        ...campaign,
        coverAssetId: assetId,
        relatedAssetIds: [assetId, ...campaign.relatedAssetIds.filter((id) => id !== assetId)].slice(0, 8),
        projectIds: campaign.projectIds.includes(project.id)
          ? campaign.projectIds
          : [...campaign.projectIds, project.id],
        waves: campaign.waves.map((wave) =>
          wave.kind === "key-visual" ? { ...wave, projectId: project.id, status: "done" } : wave,
        ),
      });
    }
  }

  creative.setIgPreview(assetId);
  return { ok: true, assetId, projectId: project.id, adapter: result.adapter };
}
