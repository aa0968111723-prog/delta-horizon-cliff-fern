import { convertPlan } from "@/lib/ai/convert";
import type { CampaignPlan } from "@/lib/studio/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShareBoard({
  plan,
  onSchedule,
}: {
  plan: CampaignPlan;
  onSchedule?: (kind: "threads" | "line") => void;
}) {
  const threads = convertPlan(plan, "threads").items[0] ?? "";
  const line = convertPlan(plan, "line").items[0] ?? "";

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text).catch(() => undefined);
    toast.success(`${label}已複製。Threads／LINE 請在 App 發。連接中心只接 Drive、Canva、Instagram。`);
  }

  return (
    <section className="mt-8" data-testid="share-board">
      <h2 className="text-sm font-medium">Threads 與 LINE</h2>
      <p className="mt-1 text-xs text-muted">
        官方發布走 Instagram。這兩則複製到 App，或排進月曆到時候貼。
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs tracking-[0.14em] text-muted uppercase">Threads</p>
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
