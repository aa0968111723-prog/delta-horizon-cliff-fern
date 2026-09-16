import { applyVisualDirection } from "@/components/create/apply-visual";
import { promptFromVisionAction } from "@/lib/ai/image-directions";
import { generateCreativePack } from "@/lib/ai/pack";
import { toBriefInput } from "@/lib/ai/payload";
import { migrateBrief } from "@/lib/studio/brief";
import type { AssetMeta, CitedSource, FormatId } from "@/lib/studio/types";
import { captionForTarget, convertFromPlan } from "@/lib/zen/convert";
import {
  analysisFromAsset,
  citedFromAsset,
  contentKindForLaunchAction,
  convertTargetForLaunchAction,
  formatForAsset,
  formatForLaunchAction,
  ideaFromAsset,
  type LaunchAction,
} from "@/lib/zen/from-asset";
import { materializeCampaignFromPack, parseEventIdea } from "@/lib/zen/from-idea";
import { clientMemoryLines, composeMemoryNotes } from "@/lib/zen/ingest";
import { igDnaBlock } from "@/lib/zen/insights";
import { searchCreativeKnowledge } from "@/lib/zen/search";
import { seasonContext } from "@/lib/zen/season";
import type { CreativePack } from "@/lib/zen/types";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export type LaunchFromAssetResult =
  | { ok: true; assetId: string; projectId: string; adapter: "live" | "mock"; formatId: FormatId; campaignId: string }
  | { ok: false; error: string };

function withVisionPrompt(
  pack: CreativePack,
  action: LaunchAction,
  analysis: { content: string; color: string; composition: string; brand: string },
): CreativePack {
  if (action === "copy") return pack;
  if (!pack.directions?.length) return pack;
  const extra = promptFromVisionAction(action, analysis);
  return {
    ...pack,
    directions: pack.directions.map((item) => ({
      ...item,
      imagePrompt: `${item.imagePrompt}. ${extra}`,
    })),
  };
}

export async function launchVisionAction(input: {
  idea: string;
  action: LaunchAction;
  analysis?: { content: string; color: string; composition: string; brand: string };
  reuseAssetId?: string;
  cited?: CitedSource;
}): Promise<LaunchFromAssetResult> {
  const studio = useStudio.getState();
  const creative = useCreative.getState();
  const brand = studio.brands[0];
  if (!brand) return { ok: false, error: "還沒有品牌記憶。" };

  const season = seasonContext();
  const analysis = input.analysis;
  const parsed = parseEventIdea(input.idea);
  const brief = migrateBrief({
    eventName: parsed.name,
    schedule: `${parsed.date} ${parsed.time}`,
    location: parsed.location,
    product: input.idea,
    audience: "淡江大學學生",
    goal: "awareness",
    notes: [input.idea, analysis?.content, analysis?.brand, `${season.label}：${season.studentNow}`]
      .filter(Boolean)
      .join("\n")
      .slice(0, 400),
    deliverables: { post: true, story: true, carousel: true, reels: true, threads: true, line: true },
  });
  const world = searchCreativeKnowledge(input.idea, {
    assets: studio.assets,
    campaigns: creative.campaigns,
    igPosts: creative.igPosts,
    memory: creative.memory,
  });
  const result = await generateCreativePack({
    data: toBriefInput(brief, brand, {
      dnaNotes: igDnaBlock(creative.igPosts),
      memoryNotes: composeMemoryNotes([
        analysis?.content,
        world.memoryNotes,
        clientMemoryLines(creative.memory),
      ]),
      foundCount: Math.max(world.foundCount, input.cited ? 1 : 0),
      citedSources: [...(input.cited ? [input.cited] : []), ...world.sources].slice(0, 16),
    }),
  });
  if (!result.ok) return { ok: false, error: result.error };

  const pack = analysis ? withVisionPrompt(result.pack, input.action, analysis) : result.pack;
  creative.setLastPack(pack);
  const campaign = materializeCampaignFromPack({
    idea: input.idea,
    pack,
    campaigns: creative.campaigns,
  });
  creative.upsertCampaign(campaign);

  const convertTarget = convertTargetForLaunchAction(input.action);
  const converted = convertFromPlan(pack.plan);
  const formatId =
    input.action === "copy" && input.reuseAssetId
      ? formatForAsset(studio.assets.find((item) => item.id === input.reuseAssetId) ?? { category: "photo", width: 1080, height: 1350 })
      : formatForLaunchAction(input.action);

  const applied = await applyVisualDirection({
    pack,
    campaignId: campaign.id,
    formatId,
    convertTarget,
    contentKind: contentKindForLaunchAction(input.action),
    caption: captionForTarget(converted, convertTarget),
    reuseAssetId: input.action === "copy" ? input.reuseAssetId : undefined,
  });
  if (!applied.ok) return applied;
  return { ...applied, campaignId: campaign.id };
}

export async function launchFromAsset(input: {
  asset: AssetMeta;
  action: LaunchAction;
  analysis?: { content: string; color: string; composition: string; brand: string };
}): Promise<LaunchFromAssetResult> {
  return launchVisionAction({
    idea: ideaFromAsset(input.asset),
    action: input.action,
    analysis: input.analysis ?? analysisFromAsset(input.asset),
    reuseAssetId: input.action === "copy" ? input.asset.id : undefined,
    cited: citedFromAsset(input.asset),
  });
}
