import { Link } from "@tanstack/react-router";
import { addDays, format, isSameDay, startOfMonth, startOfWeek, endOfMonth, endOfWeek } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { contentKindLabel } from "@/lib/studio/content";
import { uid } from "@/lib/studio/ids";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";
import { ScheduleEditor } from "@/components/calendar/schedule-editor";

type View = "month" | "week" | "agenda";

export function CalendarPage() {
  const schedule = useStudio((s) => s.schedule);
  const campaigns = useStudio((s) => s.campaigns);
  const moveSchedule = useStudio((s) => s.moveSchedule);
  const upsertSchedule = useStudio((s) => s.upsertSchedule);
  const setCreateOpen = useUi((s) => s.setCreateOpen);
  const [cursor, setCursor] = useState(new Date("2026-09-16T00:00:00+08:00"));
  const [view, setView] = useState<View>("month");
  const [editingId, setEditingId] = useState<string | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const list: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) list.push(d);
    return list;
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  function itemsOn(day: Date) {
    return schedule.filter((item) => isSameDay(item.scheduledAt, day));
  }

  function dropOn(day: Date, raw: string) {
    const item = schedule.find((row) => row.id === raw);
    if (!item) return;
    const next = new Date(day);
    const prev = new Date(item.scheduledAt);
    next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
    moveSchedule(item.id, next.getTime());
  }

  function duplicate(id: string) {
    const item = schedule.find((row) => row.id === id);
    if (!item) return;
    upsertSchedule({
      ...item,
      id: uid("sch"),
      title: `${item.title} · 複製`,
      status: "idea",
      scheduledAt: addDays(item.scheduledAt, 1).getTime(),
    });
  }

  const cells = view === "month" ? days : weekDays;

  return (
    <main className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="排程"
        title="什麼時候要發？"
        description="只服務創作與發布。沒有負責人、沒有審核。拖曳可改日期。"
        actions={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            快速新增
          </Button>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {(["month", "week", "agenda"] as View[]).map((id) => (
          <Button key={id} size="sm" variant={view === id ? "default" : "secondary"} onClick={() => setView(id)}>
            {id === "month" ? "月" : id === "week" ? "週" : "Agenda"}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => setCursor(addDays(cursor, view === "month" ? -30 : -7))}>
          上一段
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setCursor(addDays(cursor, view === "month" ? 30 : 7))}>
          下一段
        </Button>
      </div>

      {view !== "agenda" ? (
        <div className={cn("mt-4 grid gap-1", view === "month" ? "grid-cols-7" : "grid-cols-1 md:grid-cols-7")}>
          {cells.map((day) => {
            const items = itemsOn(day);
            return (
              <div
                key={day.toISOString()}
                className="min-h-24 min-w-0 overflow-hidden rounded-xl bg-surface p-2 shadow-[var(--shadow-border)]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  dropOn(day, e.dataTransfer.getData("text/plain"));
                }}
              >
                <p className="text-xs text-muted">{format(day, view === "month" ? "d" : "M/d EEE", { locale: zhTW })}</p>
                <ul className="mt-1 space-y-1">
                  {items.map((item) => (
                    <li key={item.id}>
                      <div
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
                        className="w-full rounded-lg bg-surface-2 px-2 py-1 text-left text-[11px] leading-snug"
                      >
                        <p className="truncate">
                          {contentKindLabel(item.kind)} · {item.title}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <button type="button" className="text-[10px] text-muted" onClick={() => duplicate(item.id)}>
                            複製
                          </button>
                          <button type="button" className="text-[10px] text-muted" onClick={() => setEditingId(item.id)}>
                            編輯
                          </button>
                          <Link
                            to="/create"
                            search={{ mode: "idea", idea: item.title }}
                            className="text-[10px] text-accent"
                          >
                            AI 延伸
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {schedule
            .slice()
            .sort((a, b) => a.scheduledAt - b.scheduledAt)
            .map((item) => (
              <li key={item.id} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
                <p className="text-sm">{item.title}</p>
                <p className="text-xs text-muted">
                  {format(item.scheduledAt, "M/d HH:mm", { locale: zhTW })} · {contentKindLabel(item.kind)} · {item.status}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => duplicate(item.id)}>
                    複製
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(item.id)}>
                    直接編輯
                  </Button>
                  <Button size="sm" variant="secondary" asChild>
                    <Link to="/create" search={{ mode: "idea", idea: item.title }}>
                      AI 延伸
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      )}

      {editingId ? (
        <div className="mt-6">
          {(() => {
            const item = schedule.find((row) => row.id === editingId);
            if (!item) return null;
            return (
              <ScheduleEditor
                item={item}
                onSave={(next) => {
                  upsertSchedule(next);
                  setEditingId(null);
                }}
                onClose={() => setEditingId(null)}
              />
            );
          })()}
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="text-sm font-medium">活動</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {campaigns.map((c) => (
            <li key={c.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="text-xs text-muted">
                {c.date} {c.time}
              </p>
              <p className="mt-1 font-medium">{c.name}</p>
              <p className="mt-1 text-sm text-muted">{c.oneLiner}</p>
              <Link to="/create" search={{ mode: "campaign", idea: c.name }} className="mt-2 inline-block text-sm text-accent">
                AI 延伸
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
