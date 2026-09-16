import { addDays, format, startOfMonth, startOfWeek, isSameDay, isSameMonth } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CONTENT_KIND_META, CONTENT_STATUS_META } from "@/lib/studio/status";
import type { ContentKind } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";

export function CalendarPage() {
  const schedule = useCreative((s) => s.schedule);
  const moveSchedule = useCreative((s) => s.moveSchedule);
  const duplicateSchedule = useCreative((s) => s.duplicateSchedule);
  const upsertSchedule = useCreative((s) => s.upsertSchedule);
  const [cursor, setCursor] = useState(() => new Date(2026, 8, 16));
  const [view, setView] = useState<"month" | "week" | "agenda">("month");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ContentKind>("ig-post");

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const week = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const agenda = [...schedule].sort((a, b) => a.plannedAt - b.plannedAt);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Calendar"
        title="排程"
        description="只服務創作與發布。可以改日期、複製、讓 AI 延伸，沒有審核人。"
        actions={
          <div className="flex gap-2">
            <Button variant={view === "month" ? "default" : "secondary"} size="sm" onClick={() => setView("month")}>月</Button>
            <Button variant={view === "week" ? "default" : "secondary"} size="sm" onClick={() => setView("week")}>週</Button>
            <Button variant={view === "agenda" ? "default" : "secondary"} size="sm" onClick={() => setView("agenda")}>手機清單</Button>
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
            {(view === "month" ? days : week).map((day) => {
              const items = schedule.filter((row) => isSameDay(row.plannedAt, day));
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-24 rounded-2xl bg-bg p-1 text-left",
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
                          onDragStart={(e) => e.dataTransfer.setData("text/schedule-id", row.id)}
                          className="w-full truncate rounded-lg bg-surface px-1 py-1 text-[10px]"
                          title="拖曳改日期"
                        >
                          {CONTENT_KIND_META[row.contentKind].label} {row.title}
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
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => duplicateSchedule(row.id)}>複製</Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/create" search={{ tab: "copy" }}>AI 延伸</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
