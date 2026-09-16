import { addDays, format, startOfMonth, startOfWeek, isSameDay, isSameMonth } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { writeHandoff } from "@/lib/create/handoff";
import { CONTENT_KIND_META, CONTENT_STATUS_META } from "@/lib/studio/status";
import { publishableScheduleRows, scheduleChipLabel } from "@/lib/club/schedule";
import { publishScheduleRow } from "@/lib/club/run-schedule-publish";
import { packAssetIds } from "@/lib/club/last-pack";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { toast } from "sonner";
import type { ContentKind } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useCreative, type ScheduleItem } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

function extendKind(kind: ContentKind) {
  return kind === "story" || kind === "carousel" || kind === "reels" || kind === "ig-post" ? kind : undefined;
}

function ScheduleActions({
  row,
  compact,
  urls,
}: {
  row: ScheduleItem;
  compact?: boolean;
  urls: Record<string, string>;
}) {
  const duplicateSchedule = useCreative((s) => s.duplicateSchedule);
  const setScheduleStatus = useCreative((s) => s.setScheduleStatus);
  const ingestIg = useCreative((s) => s.ingestIg);
  const lastPack = useCreative((s) => s.lastPack);
  const updateProject = useStudio((s) => s.updateProject);
  const size = compact ? "sm" : "sm";

  function markPublished() {
    const next = row.status === "published" ? "scheduled" : "published";
    setScheduleStatus(row.id, next);
    if (row.projectId) {
      updateProject(row.projectId, {
        contentStatus: next,
        publishedAt: next === "published" ? Date.now() : null,
      });
    }
  }

  async function publishToIg() {
    try {
      const result = await publishScheduleRow({ row, lastPack, assetUrls: urls });
      ingestIg([result.post]);
      setScheduleStatus(row.id, "published");
      if (row.projectId) {
        updateProject(row.projectId, { contentStatus: "published", publishedAt: Date.now() });
      }
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "發布失敗");
    }
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="calendar-item-actions">
      <Button size={size} data-testid="calendar-publish" onClick={() => void publishToIg()}>
        發布到 IG
      </Button>
      <Button size={size} variant="secondary" onClick={() => duplicateSchedule(row.id)}>
        複製
      </Button>
      <Button size={size} variant="ghost" onClick={markPublished}>
        {row.status === "published" ? "改回已排程" : "只標記已發布"}
      </Button>
      <Button size={size} variant="ghost" asChild>
        <Link
          to="/create"
          search={{ tab: "campaign" }}
          onClick={() =>
            writeHandoff({
              idea: row.title,
              tab: "campaign",
              convertKind: extendKind(row.contentKind),
              autoRun: true,
              sourceLabel: `排程 / ${row.title}`,
            })
          }
        >
          AI 延伸
        </Link>
      </Button>
      {row.projectId ? (
        <Button size={size} variant="ghost" asChild>
          <Link to="/studio/$projectId" params={{ projectId: row.projectId }}>
            直接編輯
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

export function CalendarPage() {
  const schedule = useCreative((s) => s.schedule);
  const lastPack = useCreative((s) => s.lastPack);
  const moveSchedule = useCreative((s) => s.moveSchedule);
  const upsertSchedule = useCreative((s) => s.upsertSchedule);
  const urls = useAssetUrls(packAssetIds(lastPack));
  const due = useMemo(() => publishableScheduleRows(schedule), [schedule]);
  const [cursor, setCursor] = useState(() => new Date(2026, 8, 16));
  const [view, setView] = useState<"month" | "week" | "agenda">("month");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ContentKind>("ig-post");
  const [selected, setSelected] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    if (!selected) return;
    const next = schedule.find((row) => row.id === selected.id);
    if (next && next !== selected) setSelected(next);
  }, [schedule, selected]);

  useEffect(() => {
    if (window.matchMedia("(max-width: 640px)").matches) setView("agenda");
  }, []);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const week = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const agenda = [...schedule].sort((a, b) => a.plannedAt - b.plannedAt);
  const gridDays = view === "month" ? days : week;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Calendar"
        title="排程"
        description="只服務創作與發布。可以改日期、複製、讓 AI 延伸，沒有審核人。"
        actions={
          <div className="flex gap-2">
            <Button data-testid="cal-view-month" variant={view === "month" ? "default" : "secondary"} size="sm" onClick={() => setView("month")}>月</Button>
            <Button data-testid="cal-view-week" variant={view === "week" ? "default" : "secondary"} size="sm" onClick={() => setView("week")}>週</Button>
            <Button data-testid="cal-view-agenda" variant={view === "agenda" ? "default" : "secondary"} size="sm" onClick={() => setView("agenda")}>手機清單</Button>
          </div>
        }
      />

      <form
        className="mt-6 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          upsertSchedule({
            title: title.trim(),
            plannedAt: new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 19, 0, 0).getTime(),
            contentKind: kind,
            status: "idea",
            sourceLabel: "快速新增",
          });
          setTitle("");
        }}
      >
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="快速新增：例如倒數限動" />
        <select className="h-11 rounded-md border border-border bg-surface px-3 text-sm" value={kind} onChange={(e) => setKind(e.target.value as ContentKind)}>
          {Object.entries(CONTENT_KIND_META).map(([id, meta]) => (
            <option key={id} value={id}>{meta.label}</option>
          ))}
        </select>
        <Button type="submit">加到這天</Button>
      </form>

      {due.length ? (
        <section className="mt-6 rounded-3xl bg-surface p-4 shadow-[var(--shadow-border)]" data-testid="calendar-due">
          <p className="text-xs tracking-[0.16em] text-muted">今天可以發布</p>
          <ul className="mt-3 space-y-3">
            {due.slice(0, 4).map((row) => (
              <li key={row.id}>
                <p className="text-sm font-medium">{row.title}</p>
                <div className="mt-2">
                  <ScheduleActions row={row} compact urls={urls} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {view !== "agenda" ? (
        <div className="mt-6 overflow-x-auto rounded-3xl bg-surface p-3 shadow-[var(--shadow-border)]">
          <div className="mb-3 flex items-center justify-between px-2">
            <Button variant="ghost" onClick={() => setCursor(addDays(cursor, view === "month" ? -30 : -7))}>上一{view === "month" ? "月" : "週"}</Button>
            <p className="font-display text-xl">{format(cursor, "yyyy年M月", { locale: zhTW })}</p>
            <Button variant="ghost" onClick={() => setCursor(addDays(cursor, view === "month" ? 30 : 7))}>下一{view === "month" ? "月" : "週"}</Button>
          </div>
          <div className="grid min-w-[36rem] grid-cols-7 gap-1 text-center text-xs text-muted">
            {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>
          <div className="grid min-w-[36rem] grid-cols-7 gap-1">
            {gridDays.map((day) => {
              const items = schedule.filter((row) => isSameDay(row.plannedAt, day));
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "rounded-2xl bg-bg p-1 text-left",
                    view === "week" ? "min-h-32" : "min-h-24",
                    view === "month" && !isSameMonth(day, cursor) && "opacity-40",
                  )}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/schedule-id");
                    if (!id) return;
                    const hour = new Date(schedule.find((row) => row.id === id)?.plannedAt ?? day).getHours();
                    moveSchedule(id, new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0).getTime());
                  }}
                >
                  <p className="px-1 text-xs">{format(day, "d")}</p>
                  <ul className="mt-1 space-y-1">
                    {items.map((row) => (
                      <li key={row.id}>
                        <button
                          type="button"
                          draggable
                          data-testid="calendar-chip"
                          data-chip={scheduleChipLabel(row)}
                          onDragStart={(e) => e.dataTransfer.setData("text/schedule-id", row.id)}
                          onClick={() => setSelected(row)}
                          className="w-full truncate rounded-lg bg-surface px-1 py-1 text-[10px]"
                          title="點開可複製、標記發布或讓 AI 延伸"
                        >
                          {scheduleChipLabel(row)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {agenda.map((row) => (
            <li key={row.id} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
              <p className="text-xs text-muted">
                {format(row.plannedAt, "M/d（EE）HH:mm", { locale: zhTW })} · {CONTENT_KIND_META[row.contentKind].label} · {CONTENT_STATUS_META[row.status].label}
              </p>
              <p className="mt-1 font-medium">{row.title}</p>
              <div className="mt-2">
                <ScheduleActions row={row} compact urls={urls} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          {selected ? (
            <>
              <SheetTitle>{selected.title}</SheetTitle>
              <SheetDescription>
                {format(selected.plannedAt, "M/d（EE）HH:mm", { locale: zhTW })} · {CONTENT_KIND_META[selected.contentKind].label} · {CONTENT_STATUS_META[selected.status].label}
              </SheetDescription>
              <div className="mt-4">
                <ScheduleActions row={selected} urls={urls} />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </main>
  );
}
