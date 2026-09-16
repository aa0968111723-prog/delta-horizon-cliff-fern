import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { duePublishTargets, dueTodayTargets } from "@/lib/creative/due-publish";
import { flushDueOnce } from "@/components/create/run-publish";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export function DuePublishBar({ compact = false }: { compact?: boolean }) {
  const campaigns = useCreative((s) => s.campaigns);
  const projects = useStudio((s) => s.projects);
  const [busy, setBusy] = useState(false);
  const due = duePublishTargets({ campaigns, projects });
  const today = dueTodayTargets({ campaigns, projects });
  const count = due.length || today.length;
  if (!count) return null;

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <p className="text-xs tracking-[0.16em] text-muted uppercase">到點發布</p>
      <p className="mt-2 font-display text-xl">
        {due.length ? `${due.length} 則已經到點` : `今天還有 ${today.length} 則排程`}
      </p>
      {compact ? null : (
        <p className="mt-1 text-sm text-muted">沒有審核人。打開工作室會自動發到期內容；有連 IG 且圖片是公開網址就走官方發布。</p>
      )}
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
