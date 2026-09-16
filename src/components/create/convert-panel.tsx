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
  packWithCaption,
  previewLines,
  tonightAt,
  type ConvertTargetId,
} from "@/lib/zen/convert";
import { convertStaggerDays } from "@/lib/zen/from-idea";
import { applyConvertedSlot } from "@/lib/zen/schedule";
import type { CreativePack, VisualSequence } from "@/lib/zen/types";
import { uid } from "@/lib/studio/ids";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";

function formatWhen(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function ConvertPanel({
  pack,
  campaignId,
  caption,
  compact,
  stay,
  onConverted,
}: {
  pack: CreativePack;
  campaignId?: string | null;
  caption?: string;
  compact?: boolean;
  stay?: boolean;
  onConverted?: (info: { id: ConvertTargetId; caption: string }) => void;
}) {
  const navigate = useNavigate();
  const upsertSchedule = useCreative((s) => s.upsertSchedule);
  const patchCampaign = useCreative((s) => s.patchCampaign);
  const setPreviewSchedule = useCreative((s) => s.setPreviewSchedule);
  const livePack = caption?.trim() ? packWithCaption(pack, caption) : pack;
  const converted = convertFromPlan(livePack.plan);
  const [busyId, setBusyId] = useState<ConvertTargetId | null>(null);

  function commitSlot(id: ConvertTargetId, extra?: { projectId?: string; sequence?: VisualSequence }) {
    const target = CONVERT_TARGETS.find((row) => row.id === id)!;
    const nextCaption = captionForTarget(converted, id);
    const live =
      extra?.sequence ??
      (useCreative.getState().lastSequence?.kind === id ? useCreative.getState().lastSequence : undefined);
    const visualId = useCreative.getState().lastVisualAssetId;
    const { placed } = applyConvertedSlot(useCreative.getState().schedule, {
      id: uid("sch"),
      title: `${livePack.copy.hook} · ${target.label}`,
      contentKind: target.contentKind,
      status: "scheduled",
      scheduledAt: tonightAt(convertStaggerDays(id)),
      publishedAt: null,
      projectId: extra?.projectId ?? live?.projectId ?? null,
      campaignId: campaignId ?? null,
      captionPreview: nextCaption,
      sequence: live,
    });
    upsertSchedule(placed);
    setPreviewSchedule(placed.id);
    if (campaignId && visualId) {
      const campaign = useCreative.getState().campaigns.find((row) => row.id === campaignId);
      if (campaign) {
        patchCampaign(campaignId, {
          relatedAssetIds: [visualId, ...campaign.relatedAssetIds.filter((item) => item !== visualId)].slice(0, 8),
        });
      }
    }
    return { placed, nextCaption, target };
  }

  async function toPreview(id: ConvertTargetId) {
    const target = CONVERT_TARGETS.find((row) => row.id === id)!;
    setBusyId(id);
    try {
      if (id === "carousel" || id === "story" || id === "reels") {
        const result = await applyFormatSequence({
          pack: livePack,
          kind: id,
          campaignId,
        });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        const { nextCaption } = commitSlot(id, { projectId: result.projectId, sequence: result.sequence });
        onConverted?.({ id, caption: nextCaption });
        toast.success(`已做成 ${result.labels.length} 張${target.label}，已排進日曆`);
        if (!stay) await navigate({ to: "/instagram" });
        return;
      }
      const result = await applyVisualDirection({
        pack: livePack,
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
      const { nextCaption } = commitSlot(id, { projectId: result.projectId });
      onConverted?.({ id, caption: nextCaption });
      toast.success(`已做成${target.label}，已排進日曆`);
      if (!stay) await navigate({ to: "/instagram" });
    } finally {
      setBusyId(null);
    }
  }

  function toCalendar(id: ConvertTargetId) {
    const { placed, target } = commitSlot(id);
    const when = formatWhen(placed.scheduledAt);
    toast.success(`已排進日曆（${target.label}，${when}）`);
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

  if (compact) {
    return (
      <div className="flex min-w-0 flex-wrap gap-2" data-testid="convert-targets">
        {CONVERT_TARGETS.map((target) => (
          <button
            key={target.id}
            type="button"
            data-testid={`convert-target-${target.id}`}
            disabled={Boolean(busyId)}
            onClick={() => void toPreview(target.id)}
            className={cn(
              "min-h-11 rounded-full px-3 py-2 text-xs",
              busyId === target.id ? "bg-accent text-accent-fg" : "bg-bg",
            )}
          >
            {busyId === target.id ? "生成中…" : `做成 ${target.label}`}
          </button>
        ))}
      </div>
    );
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
