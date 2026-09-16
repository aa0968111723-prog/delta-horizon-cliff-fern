import { hashtagsFromInstagramMemory } from "@/lib/connections/instagram-normalize";
import { hashtagsFromOutcomes, mergeHashtagMemory } from "@/lib/creative/learning";
import { campusContextLine } from "@/lib/creative/memory";
import { useConnectionStore } from "@/stores/connection-store";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export function rememberedHashtags() {
  const instagram = hashtagsFromInstagramMemory(useConnectionStore.getState().instagramItems);
  const outcomes = hashtagsFromOutcomes(useCreative.getState().outcomes);
  return mergeHashtagMemory(outcomes, instagram);
}

export function BrandMemoryStrip({ compact = false }: { compact?: boolean }) {
  const brand = useStudio((state) => state.brands[0]);
  const campaigns = useCreative((state) => state.campaigns);
  const outcomes = useCreative((state) => state.outcomes);
  const instagramHashtags = hashtagsFromInstagramMemory(useConnectionStore((state) => state.instagramItems));
  const outcomeHashtags = hashtagsFromOutcomes(outcomes);
  const hashtags = mergeHashtagMemory(outcomeHashtags, instagramHashtags);
  const fieldNote = brand?.memory?.learnedPatterns?.find((item) => item.startsWith("現場："));
  const campaign = campaigns[0];

  if (!brand) return null;

  return (
    <section
      data-testid="brand-memory-strip"
      className="min-w-0 rounded-xl bg-surface-2 px-3 py-3"
    >
      <p className="text-xs font-medium">這次創作已帶入 Brand Memory</p>
      <ul className="mt-2 space-y-1 text-xs leading-5 text-muted">
        <li className="break-words">校園：{campusContextLine(brand)}</li>
        {campaign ? <li className="break-words">近期活動：{campaign.name}</li> : null}
        {fieldNote ? <li className="break-words">{fieldNote}</li> : <li>現場筆記：還沒有。貼完再記誰來了。</li>}
        <li className="break-words">
          Hashtag：{hashtags.length ? hashtags.slice(0, 6).join(" ") : "先用 #淡江禪學社 #淡江生活，現場有用的會排前面"}
        </li>
        {compact ? null : (
          <li className="break-words">
            畫面：{brand.memory?.signatureElements?.slice(0, 4).join("、") || "三色光、真實社員、夜晚校園"}
          </li>
        )}
      </ul>
    </section>
  );
}
