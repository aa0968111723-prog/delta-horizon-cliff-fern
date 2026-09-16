import { toast } from "sonner";
import { searchCreativeWorld } from "@/lib/ai/oauth";
import { generateCreativePack } from "@/lib/ai/pack";
import { toBriefInput } from "@/lib/ai/payload";
import { migrateBrief } from "@/lib/studio/brief";
import { memorySourceFromHit } from "@/lib/zen/from-hit";
import { materializeCampaignFromPack, parseEventIdea } from "@/lib/zen/from-idea";
import { igDnaBlock } from "@/lib/zen/insights";
import { clientMemoryLines, composeMemoryNotes } from "@/lib/zen/ingest";
import { applyPackToWaves } from "@/lib/zen/schedule";
import { knowledgeFromHits, searchCreativeKnowledge, type SearchHit } from "@/lib/zen/search";
import { seasonContext } from "@/lib/zen/season";
import type { ClubCampaign, CreativePack } from "@/lib/zen/types";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export async function runIdeaPack(input: {
  idea: string;
  notes?: string;
  campaign?: ClubCampaign | null;
}): Promise<{ ok: true; pack: CreativePack; campaignId: string } | { ok: false; error: string }> {
  const brand = useStudio.getState().brands[0];
  if (!brand) {
    toast.error("還沒有品牌記憶。");
    return { ok: false, error: "還沒有品牌記憶。" };
  }
  const { memory, igPosts, campaigns, addMemory, setLastPack, upsertCampaign } = useCreative.getState();
  const { assets } = useStudio.getState();
  const parsed = parseEventIdea(input.idea);
  const season = seasonContext();
  const campaign = input.campaign ?? null;
  const world = searchCreativeKnowledge(input.idea, { assets, campaigns, igPosts, memory });
  const hits: SearchHit[] = [...world.hits];
  try {
    const live = await searchCreativeWorld({ data: { query: input.idea } });
    if (live.ok) {
      const seen = new Set(hits.map((hit) => `${hit.source}:${hit.id}`));
      for (const hit of live.hits) {
        const key = `${hit.source}:${hit.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push(hit);
        addMemory({
          id: hit.id,
          source: memorySourceFromHit(hit),
          title: hit.title,
          subtitle: hit.subtitle,
          thumbAssetId: hit.thumbAssetId,
          tags: hit.tags,
          kind: hit.source,
          url: hit.url,
        });
      }
    }
  } catch {
    /* live Drive / Canva / IG optional */
  }
  const cited = knowledgeFromHits(hits);
  const brief = migrateBrief({
    eventName: campaign?.name || parsed.name,
    schedule: campaign ? `${campaign.date} ${campaign.time}` : `${parsed.date} ${parsed.time}`,
    location: campaign?.location || parsed.location,
    product: campaign?.name || input.idea,
    offer: campaign?.cta || "",
    audience: "淡江大學學生",
    goal: campaign ? "traffic" : "awareness",
    features: campaign?.theme || "",
    style: "生活、空氣、淡水夜晚",
    notes: composeMemoryNotes([
      input.idea,
      input.notes,
      campaign?.studentPain,
      `${season.label}：${season.studentNow}`,
      season.contentHint,
    ]).slice(0, 400),
    deliverables: { post: true, story: true, carousel: true, reels: true, threads: true, line: true },
  });
  const result = await generateCreativePack({
    data: toBriefInput(brief, brand, {
      dnaNotes: igDnaBlock(igPosts),
      memoryNotes: composeMemoryNotes([input.notes, cited.notes, world.memoryNotes, clientMemoryLines(memory)]),
      foundCount: Math.max(cited.foundCount, world.foundCount, hits.length),
      citedSources: cited.sources,
    }),
  });
  if (!result.ok) {
    toast.error(result.error);
    return { ok: false, error: result.error };
  }
  setLastPack(result.pack);
  const nextCampaign = campaign
    ? applyPackToWaves(campaign, result.pack)
    : materializeCampaignFromPack({ idea: input.idea, pack: result.pack, campaigns });
  upsertCampaign(nextCampaign);
  toast.success(
    `找到 ${result.pack.foundCount} 個相關素材 · 根據過去內容生成 ${result.pack.directions.length} 個方向`,
  );
  return { ok: true, pack: result.pack, campaignId: nextCampaign.id };
}
