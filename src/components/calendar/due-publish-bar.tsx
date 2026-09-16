import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CalendarThumb } from "@/components/calendar/calendar-thumb";
import { duePublishTargets, dueTodayTargets } from "@/lib/creative/due-publish";
import { flushDueOnce } from "@/components/create/run-publish";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export function DuePublishBar({ compact = false }: { compact?: boolean }) {
  const campaigns = useCreative((s) => s.campaigns);
  const projects = useStudio((s) => s.projects);
  const [busy, setBusy] = useState(false);
  const due = duePublishTargets({ campaigns, projects });
  const today = dueTodayTargets({ campaigns, projects });
  const shown = due.length ? due : today;
  const urls = useAssetUrls(shown.flatMap((item) => item.assetIds ?? []));
  const count = shown.length;
  if (!count) return null;

  return (
    <section className="mt-6 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <p className="text-xs tracking-[0.16em] text-muted uppercase">到點發布</p>
      <p className="mt-2 font-display text-xl">
        {due.length ? `${due.length} 則已經到點` : `今天還有 ${today.length} 則排程`}
      </p>
      {compact ? null : (
        <p className="mt-1 text-sm text-muted">沒有審核人。打開工作室會自動發到期內容；有連 IG 且圖片是公開網址就走官方發布。</p>
      )}
      <ul className="mt-4 space-y-2">
        {shown.slice(0, 4).map((item) => {
          const project = item.projectId ? projects.find((entry) => entry.id === item.projectId) : undefined;
          return (
            <li key={`${item.projectId ?? item.waveId}-${item.scheduledAt}`} className="flex items-center gap-3">
              <CalendarThumb
                item={{
                  coverAssetId: item.assetIds?.[0],
                  coverUrl: item.imageUrl,
                  coverFromCanva: Boolean(project?.sourceRefs.some((ref) => ref.source === "canva")),
                }}
                urls={urls}
              />
              <p className="min-w-0 flex-1 truncate text-sm">{item.title}</p>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          className="min-h-11 rounded-full"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void flushDueOnce({ includeToday: true }).finally(() => setBusy(false));
          }}
        >
          {busy ? "發布中…" : "現在發到期內容"}
        </Button>
        <Button asChild variant="secondary" className="min-h-11 rounded-full">
          <Link to="/calendar">看月曆</Link>
        </Button>
      </div>
    </section>
  );
}

export function useDuePublishFlush() {
  const creativeHydrated = useCreative((s) => s.hydrated);
  const studioHydrated = useStudio((s) => s.hydrated);
  useEffect(() => {
    if (!creativeHydrated || !studioHydrated) return;
    void flushDueOnce();
    const timer = window.setInterval(() => {
      void flushDueOnce({ silent: true });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [creativeHydrated, studioHydrated]);
}
