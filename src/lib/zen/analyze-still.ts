import { analyzeStudioImage, type VisionAnalysis } from "@/lib/ai/image-studio";
import { stillPayloadFromEmbed, stillPayloadFromHref } from "./source-style.ts";

/** Look at the actual still, not only the filename. Live Grok when the key exists. */
export async function analyzeClubStill(opts: {
  href?: string;
  embed?: string;
  sourceNote?: string;
}): Promise<VisionAnalysis | null> {
  const payload = opts.embed
    ? stillPayloadFromEmbed(opts.embed)
    : opts.href
      ? await stillPayloadFromHref(opts.href)
      : null;
  if (!payload) return null;
  const result = await analyzeStudioImage({
    data: { ...payload, sourceNote: opts.sourceNote },
  });
  return result.ok ? result.analysis : null;
}
