import { toast } from "sonner";
import { generateCreativePack } from "@/lib/ai/pack";
import { toBriefInput } from "@/lib/ai/payload";
import { migrateBrief } from "@/lib/studio/brief";
import { ideaFromHit, memorySourceFromHit } from "@/lib/zen/from-hit";
import { igDnaBlock } from "@/lib/zen/insights";
import type { SearchHit } from "@/lib/zen/search";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export async function createFromHit(hit: SearchHit) {
  const brand = useStudio.getState().brands[0];
  if (!brand) {
    toast.error("還沒有品牌記憶。");
    return false;
  }
  const { memory, igPosts, addMemory, setLastPack } = useCreative.getState();
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
  const idea = ideaFromHit(hit);
  const brief = migrateBrief({
    eventName: hit.title.slice(0, 40),
    product: idea,
    audience: "淡江大學學生",
    location: "淡江大學淡水校園",
    goal: "awareness",
    notes: idea,
    deliverables: { post: true, story: true, carousel: true, reels: true, threads: true, line: true },
  });
  const result = await generateCreativePack({
    data: {
      ...toBriefInput(brief, brand, { dnaNotes: igDnaBlock(igPosts) }),
      memoryNotes: [`${hit.subtitle} / ${hit.title}`, ...memory.map((m) => m.subtitle)].join("\n"),
    },
  });
  if (!result.ok) {
    toast.error(result.error);
    return false;
  }
  setLastPack(result.pack);
  toast.success(`已根據「${hit.title}」生成 3 個方向`);
  return true;
}
