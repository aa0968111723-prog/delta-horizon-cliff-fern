import { useMemo } from "react";
import { buildIgDna, formatIgDna } from "@/lib/studio/ig-dna";
import { useRemote } from "@/stores/remote-store";
import { useStudio } from "@/stores/studio-store";

/** 本機內容 + 已同步的 IG 貼文 → 給生成用的帳號習慣文字。 */
export function useIgDnaText(): string {
  const projects = useStudio((s) => s.projects);
  const brand = useStudio((s) => s.brands[0]);
  const remoteItems = useRemote((s) => s.items);
  return useMemo(() => {
    const posts = remoteItems.filter((item) => item.provider === "instagram");
    return formatIgDna(buildIgDna(projects, brand, posts)).slice(0, 1500);
  }, [projects, brand, remoteItems]);
}
