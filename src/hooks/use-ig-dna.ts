import { useMemo } from "react";
import { buildIgDna, buildIgInsights, formatIgDna, formatIgInsights, formatIgReading } from "@/lib/studio/ig-dna";
import { useRemote } from "@/stores/remote-store";
import { useStudio } from "@/stores/studio-store";

function useIgPosts() {
  const remoteItems = useRemote((s) => s.items);
  return useMemo(() => remoteItems.filter((item) => item.provider === "instagram"), [remoteItems]);
}

/** 本機內容 + 已同步的 IG 貼文 + 讀過的帳號習慣 → 給生成用。 */
export function useIgDnaText(): string {
  const projects = useStudio((s) => s.projects);
  const brand = useStudio((s) => s.brands[0]);
  const posts = useIgPosts();
  return useMemo(() => {
    const dna = buildIgDna(projects, brand, posts);
    return [formatIgReading(brand?.memory.igReading), formatIgDna(dna)].filter(Boolean).join("\n").slice(0, 1500);
  }, [projects, brand, posts]);
}

/** 已同步的真實成效。沒有數字就是空字串。 */
export function useIgInsightsText(): string {
  const posts = useIgPosts();
  return useMemo(() => formatIgInsights(buildIgInsights(posts)).slice(0, 1200), [posts]);
}
