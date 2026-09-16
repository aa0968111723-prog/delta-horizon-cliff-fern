import { formatIdForContentKind } from "@/lib/zen/convert";
import { isWaveScheduleItem, previewBindForSchedule, schedulePreviewAssetId } from "@/lib/zen/schedule";
import type { ScheduleItem } from "@/lib/zen/types";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export function openScheduledPreview(item: ScheduleItem) {
  const campaigns = useCreative.getState().campaigns;
  const bind = previewBindForSchedule(item, campaigns);
  useCreative.getState().setPreviewSchedule(item.id);
  const sequence =
    item.sequence ??
    useCreative.getState().sequences.find((row) => row.kind === item.contentKind || row.kind === kindAlias(item.contentKind));
  if (sequence && !bind.overlay) {
    useCreative.getState().setLastSequence(sequence);
    useCreative.getState().setIgPreview(sequence.assetIds[0] ?? bind.assetId, bind.formatId);
    useStudio.getState().setLastProjectId(sequence.projectId);
    useStudio.getState().setSlide(sequence.projectId, 0);
    return;
  }
  if (isWaveScheduleItem(item) || bind.overlay) {
    const assetId = bind.assetId ?? schedulePreviewAssetId(item, campaigns);
    useCreative.getState().setIgPreview(assetId, bind.formatId);
    return;
  }
  if (bind.projectId) {
    useStudio.getState().setLastProjectId(bind.projectId);
  }
  useCreative.getState().setIgView("preview");
  useCreative.getState().setIgFormat(bind.formatId || formatIdForContentKind(item.contentKind));
}

function kindAlias(kind: ScheduleItem["contentKind"]) {
  if (kind === "ig-post") return "post";
  return kind;
}
