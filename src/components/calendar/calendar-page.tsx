import { addDays, format, startOfMonth, startOfWeek, addMonths, isSameDay, isSameMonth } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uid } from "@/lib/studio/ids";
import type { ContentKind } from "@/lib/studio/types";
import { CONTENT_KIND_LABEL } from "@/lib/zen/types";
import { rhythmHint } from "@/lib/zen/schedule";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";

type Mode = "month" | "week" | "agenda";

export function CalendarPage() {
  const schedule = useCreative((s) => s.schedule);
  const moveSchedule = useCreative((s) => s.moveSchedule);
  const upsertSchedule = useCreative((s) => s.upsertSchedule);
  const [cursor, setCursor] = useState(new Date(2026, 8, 16));
  const [mode, setMode] = useState<Mode>("month");
  const [quickTitle, setQuickTitle] = useState("");

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Calendar"
        title="排程"
        description={rhythmHint(schedule)}
        actions={
          <div className="flex gap-2">
            {(["month", "week", "agenda"] as const).map((id) => (
              <Button key={id} size="sm" variant={mode === id ? "default" : "secondary"} onClick={() => setMode(id)}>
                {id === "month" ? "月" : id === "week" ? "週" : "Agenda"}
              </Button>
            ))}
          </div>
        }
      />
      <div className="mt-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setCursor(addMonths(cursor, -1))}>
          上月
        </Button>
        <p className="font-display text-xl">{format(cursor, "yyyy年M月", { locale: zhTW })}</p>
        <Button variant="ghost" onClick={() => setCursor(addMonths(cursor, 1))}>
          下月
        </Button>
      </div>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const title = quickTitle.trim();
          if (!title) return;
          const kind: ContentKind = "ig-post";
          upsertSchedule({
            id: uid("sch"),
            title,
            contentKind: kind,
            status: "idea",
            scheduledAt: new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 20).getTime(),
            publishedAt: null,
            projectId: null,
            campaignId: null,
            captionPreview: title,
          });
          setQuickTitle("");
        }}
      >
        <Input value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} placeholder="快速新增：今晚發什麼？" />
        <Button type="submit">加到這天</Button>
      </form>

      {mode === "agenda" ? (
        <ul className="mt-6 space-y-2">
          {[...schedule]
            .sort((a, b) => a.scheduledAt - b.scheduledAt)
            .map((item) => (
              <li key={item.id} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
                <p className="text-xs text-muted">
                  {format(item.scheduledAt, "M/d（EE）HH:mm", { locale: zhTW })} · {CONTENT_KIND_LABEL[item.contentKind]}
                </p>
                <p className="text-sm font-medium">{item.title}</p>
              </li>
            ))}
        </ul>
      ) : (
        <div className="mt-4 grid grid-cols-7 gap-1">
          {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
            <p key={d} className="py-2 text-center text-xs text-muted">
              {d}
            </p>
          ))}
          {(mode === "month" ? days : weekDays).map((day) => {
            const items = schedule.filter((s) => isSameDay(s.scheduledAt, day));
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-24 rounded-xl bg-surface p-1.5 shadow-[var(--shadow-border)]",
                  !isSameMonth(day, cursor) && mode === "month" && "opacity-40",
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("text/schedule-id");
                  if (id) moveSchedule(id, new Date(day.getFullYear(), day.getMonth(), day.getDate(), 20).getTime());
                }}
              >
                <p className="text-xs">{format(day, "d")}</p>
                <ul className="mt-1 space-y-1">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/schedule-id", item.id)}
                      className="truncate rounded-md bg-bg px-1 py-0.5 text-[10px]"
                    >
                      {item.title}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
