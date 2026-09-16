import { formatIdForContentKind } from "@/lib/zen/convert";
import type { ScheduleItem } from "@/lib/zen/types";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export function openScheduledPreview(item: ScheduleItem) {
  const formatId = formatIdForContentKind(item.contentKind);
  const sequence =
    item.sequence ??
    useCreative.getState().sequences.find((row) => row.kind === item.contentKind || row.kind === kindAlias(item.contentKind));
  if (sequence) {
    useCreative.getState().setLastSequence(sequence);
    useCreative.getState().setIgPreview(sequence.assetIds[0] ?? null, formatId);
    useStudio.getState().setLastProjectId(sequence.projectId);
    useStudio.getState().setSlide(sequence.projectId, 0);
    return;
  }
  if (item.projectId) {
    useStudio.getState().setLastProjectId(item.projectId);
  }
  useCreative.getState().setIgView("preview");
  useCreative.getState().setIgFormat(formatId);
}

function kindAlias(kind: ScheduleItem["contentKind"]) {
  if (kind === "ig-post") return "post";
  return kind;
}
