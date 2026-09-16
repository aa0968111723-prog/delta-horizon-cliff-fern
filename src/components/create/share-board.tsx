import { convertPlan } from "@/lib/ai/convert";
import type { CampaignPlan } from "@/lib/studio/types";
import { AssetMedia } from "@/components/shared/asset-media";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { useStudio } from "@/stores/studio-store";
import { toast } from "sonner";
import { useMemo } from "react";

export function ShareBoard({
  plan,
  campaignId,
  onSchedule,
}: {
  plan: CampaignPlan;
  campaignId?: string | null;
  onSchedule?: (kind: "threads" | "line") => void;
}) {
  const threads = convertPlan(plan, "threads").items[0] ?? "";
  const line = convertPlan(plan, "line").items[0] ?? "";
  const schedule = useStudio((s) => s.schedule);
  const stills = useMemo(() => {
    if (!campaignId) return { lineId: undefined, threadsId: undefined };
    return {
      lineId: schedule.find((item) => item.campaignId === campaignId && item.kind === "line")?.imageAssetId,
      threadsId: schedule.find((item) => item.campaignId === campaignId && item.kind === "threads")?.imageAssetId,
    };
  }, [schedule, campaignId]);
  const urls = useAssetUrls([stills.lineId, stills.threadsId].filter((id): id is string => Boolean(id)));
  const lineSrc = stills.lineId ? urls[stills.lineId] : undefined;
  const threadsSrc = stills.threadsId ? urls[stills.threadsId] : undefined;

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text).catch(() => undefined);
    toast.success(`${label}已複製。Threads／LINE 請在 App 發。連接中心只接 Drive、Canva、Instagram。`);
  }

  return (
    <section className="mt-8" data-testid="share-board">
      <h2 className="text-sm font-medium">Threads 與 LINE</h2>
      <p className="mt-1 text-xs text-muted">
        官方發布走 Instagram。Threads 與 LINE 都是 1:1 配圖，複製到 App；連接中心不接這兩個。
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs tracking-[0.14em] text-muted uppercase">Threads</p>
          {threadsSrc ? (
            <AssetMedia src={threadsSrc} className="mt-3 aspect-square w-full rounded-2xl" testId="threads-still" />
          ) : null}
          <p className="mt-2 whitespace-pre-wrap text-sm" data-testid="threads-copy">
            {threads}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" data-testid="copy-threads" onClick={() => void copy(threads, "Threads")}>
              複製 Threads
            </Button>
            {onSchedule ? (
              <Button size="sm" variant="secondary" onClick={() => onSchedule("threads")}>
                排入 Calendar
              </Button>
            ) : null}
          </div>
        </article>
        <article className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs tracking-[0.14em] text-muted uppercase">LINE</p>
          {lineSrc ? (
            <AssetMedia src={lineSrc} className="mt-3 aspect-square w-full rounded-2xl" testId="line-still" />
          ) : null}
          <p className="mt-2 whitespace-pre-wrap text-sm" data-testid="line-copy">
            {line}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" data-testid="copy-line" onClick={() => void copy(line, "LINE")}>
              複製 LINE
            </Button>
            {onSchedule ? (
              <Button size="sm" variant="secondary" onClick={() => onSchedule("line")}>
                排入 Calendar
              </Button>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
