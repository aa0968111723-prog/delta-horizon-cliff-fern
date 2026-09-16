import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { applyVisualDirection } from "@/components/create/apply-visual";
import { applyFormatSequence } from "@/components/create/apply-sequence";
import { Button } from "@/components/ui/button";
import {
  CONVERT_TARGETS,
  captionForTarget,
  clipboardText,
  convertFromPlan,
  previewLines,
  tonightAt,
  type ConvertTargetId,
} from "@/lib/zen/convert";
import { convertStaggerDays } from "@/lib/zen/from-idea";
import { placeScheduleItems } from "@/lib/zen/schedule";
import type { CreativePack } from "@/lib/zen/types";
import { uid } from "@/lib/studio/ids";
import { useCreative } from "@/stores/creative-store";

export function ConvertPanel({
  pack,
  campaignId,
}: {
  pack: CreativePack;
  campaignId?: string | null;
}) {
  const navigate = useNavigate();
  const upsertSchedule = useCreative((s) => s.upsertSchedule);
  const patchCampaign = useCreative((s) => s.patchCampaign);
  const converted = convertFromPlan(pack.plan);
  const [busyId, setBusyId] = useState<ConvertTargetId | null>(null);

  async function toPreview(id: ConvertTargetId) {
    const target = CONVERT_TARGETS.find((row) => row.id === id)!;
    setBusyId(id);
    try {
      if (id === "carousel" || id === "story" || id === "reels") {
        const result = await applyFormatSequence({
          pack,
          kind: id,
          campaignId,
        });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(`已做成 ${result.labels.length} 張${target.label}，打開 IG Preview`);
        await navigate({ to: "/instagram" });
        return;
      }
      const result = await applyVisualDirection({
        pack,
        campaignId,
        formatId: target.formatId,
        convertTarget: target.id,
        contentKind: target.contentKind,
        caption: captionForTarget(converted, id),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`已做成${target.label}，打開 IG Preview`);
      await navigate({ to: "/instagram" });
    } finally {
      setBusyId(null);
    }
  }

  function toCalendar(id: ConvertTargetId) {
    const target = CONVERT_TARGETS.find((row) => row.id === id)!;
    const visualId = useCreative.getState().lastVisualAssetId;
    const live = useCreative.getState().lastSequence;
    const [placed] = placeScheduleItems(useCreative.getState().schedule, [
      {
        id: uid("sch"),
        title: `${pack.copy.hook} · ${target.label}`,
        contentKind: target.contentKind,
        status: "scheduled",
        scheduledAt: tonightAt(convertStaggerDays(id)),
        publishedAt: null,
        projectId: live?.kind === id ? live.projectId : null,
        campaignId: campaignId ?? null,
        captionPreview: captionForTarget(converted, id),
        sequence: live?.kind === id ? live : undefined,
      },
    ]);
    if (placed) upsertSchedule(placed);
    if (campaignId && visualId) {
      const campaign = useCreative.getState().campaigns.find((row) => row.id === campaignId);
      if (campaign) {
        patchCampaign(campaignId, {
          relatedAssetIds: [visualId, ...campaign.relatedAssetIds.filter((item) => item !== visualId)].slice(0, 8),
        });
      }
    }
    const days = convertStaggerDays(id);
    toast.success(days ? `已排進日曆（${target.label}，${days} 天後）` : `已排進日曆（${target.label}，今晚）`);
    void navigate({ to: "/calendar" });
  }

  async function copyText(id: ConvertTargetId) {
    const text = clipboardText(converted, id);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製");
    } catch {
      toast.message(text.slice(0, 80));
    }
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {CONVERT_TARGETS.map((target) => (
        <article key={target.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs text-muted">{target.label}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {previewLines(converted, target.id)
              .slice(0, 5)
              .map((line, i) => (
                <li key={`${target.id}-${i}`} className="line-clamp-2">
                  {line}
                </li>
              ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" disabled={Boolean(busyId)} onClick={() => void toPreview(target.id)}>
              {busyId === target.id
                ? "生成中…"
                : target.id === "carousel"
                  ? "做成 5 頁 Carousel"
                  : target.id === "story"
                    ? "做成 3–5 張 Story"
                    : target.id === "reels"
                      ? "做成 Reels 分鏡畫面"
                      : `做成 ${target.label}`}
            </Button>
            <Button size="sm" variant="secondary" disabled={Boolean(busyId)} onClick={() => toCalendar(target.id)}>
              排進日曆
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void copyText(target.id)}>
              複製
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
