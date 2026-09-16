import { addDays, format, startOfMonth, startOfWeek } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { contentKindLabel } from "@/lib/studio/content";
import { STATUS_META } from "@/lib/studio/status";
import { calendarFrom, useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "@/lib/creative/types";

export function CalendarPage() {
  const campaigns = useCreative((s) => s.campaigns);
  const moveWave = useCreative((s) => s.moveWave);
  const duplicateWave = useCreative((s) => s.duplicateWave);
  const projects = useStudio((s) => s.projects);
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [view, setView] = useState<"month" | "week" | "agenda">("agenda");
  const items = calendarFrom(campaigns, projects);

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const rows: Date[][] = [];
    for (let week = 0; week < 6; week += 1) {
      const row: Date[] = [];
      for (let day = 0; day < 7; day += 1) {
        row.push(addDays(start, week * 7 + day));
      }
      rows.push(row);
    }
    return rows;
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    const days: Date[] = [];
    for (let i = 0; i < 7; i += 1) days.push(addDays(start, i));
    return days;
  }, [cursor]);

  function onDrop(dateIso: string, itemId: string) {
    for (const campaign of campaigns) {
      if (campaign.waves.some((w) => w.id === itemId)) {
        moveWave(campaign.id, itemId, dateIso);
        return;
      }
    }
  }

  function extend(item: CalendarItem) {
    void navigate({
      to: "/create",
      search: { q: `延續：${item.title}`, auto: "1", campaign: item.campaignId },
    });
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-xs tracking-[0.18em] text-muted uppercase">排程</p>
      <h1 className="mt-1 font-display text-3xl">什麼時候發</h1>
      <p className="mt-2 text-sm text-muted">只服務創作與發布。沒有審核人。桌面可拖曳改日期。</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["agenda", "week", "month"] as const).map((id) => (
          <Button key={id} size="sm" variant={view === id ? "default" : "secondary"} onClick={() => setView(id)}>
            {id === "month" ? "月" : id === "week" ? "週" : "Agenda"}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => setCursor(addDays(cursor, view === "month" ? -30 : -7))}>
          上一檔
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setCursor(addDays(cursor, view === "month" ? 30 : 7))}>
          下一檔
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link to="/create">快速新增</Link>
        </Button>
      </div>

      {view === "agenda" ? (
        <ul className="mt-6 space-y-2">
          {items.map((item) => (
            <AgendaRow
              key={item.id}
              item={item}
              onExtend={() => extend(item)}
              onCopy={() => item.campaignId && item.waveId && duplicateWave(item.campaignId, item.waveId)}
            />
          ))}
        </ul>
      ) : null}

      {view === "month" ? (
        <div className="mt-6 hidden md:block">
          <div className="grid grid-cols-7 gap-1">
            {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
              <p key={d} className="px-1 text-xs text-muted">
                {d}
              </p>
            ))}
            {weeks.flat().map((day) => {
              const iso = format(day, "yyyy-MM-dd");
              const dayItems = items.filter((item) => item.date === iso);
              const inMonth = day.getMonth() === cursor.getMonth();
              return (
                <div
                  key={iso}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain");
                    if (id) onDrop(iso, id);
                  }}
                  className={cn("min-h-24 rounded-xl bg-surface p-1.5 shadow-[var(--shadow-border)]", !inMonth && "opacity-40")}
                >
                  <p className="text-xs text-muted">{format(day, "d", { locale: zhTW })}</p>
                  <ul className="mt-1 space-y-1">
                    {dayItems.map((item) => (
                      <li
                        key={item.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
                        className="cursor-grab rounded-lg bg-surface-2 px-1.5 py-1 text-xs leading-tight"
                      >
                        {item.title}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === "week" ? (
        <div className="mt-6 hidden gap-2 md:grid md:grid-cols-7">
          {weekDays.map((day) => {
            const iso = format(day, "yyyy-MM-dd");
            return (
              <div
                key={iso}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) onDrop(iso, id);
                }}
                className="rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]"
              >
                <p className="text-xs text-muted">{format(day, "EEE d", { locale: zhTW })}</p>
                <ul className="mt-2 space-y-1">
                  {items
                    .filter((item) => item.date === iso)
                    .map((item) => (
                      <li
                        key={item.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
                        className="cursor-grab text-sm"
                      >
                        {item.title}
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}

      {view === "month" ? (
        <ul className="mt-6 space-y-2 md:hidden">
          {weeks
            .flat()
            .filter((day) => day.getMonth() === cursor.getMonth())
            .map((day) => {
              const iso = format(day, "yyyy-MM-dd");
              const dayItems = items.filter((item) => item.date === iso);
              if (!dayItems.length) return null;
              return (
                <li key={iso} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
                  <p className="text-xs text-muted">{format(day, "M/d EEE", { locale: zhTW })}</p>
                  {dayItems.map((item) => (
                    <div key={item.id} className="mt-2 border-t border-border pt-2">
                      <p className="text-sm">{item.title}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Button size="sm" variant="ghost" onClick={() => extend(item)}>
                          AI 延伸
                        </Button>
                      </div>
                    </div>
                  ))}
                </li>
              );
            })}
        </ul>
      ) : null}

      {view === "week" ? (
        <ul className="mt-6 space-y-2 md:hidden">
          {weekDays.map((day) => {
            const iso = format(day, "yyyy-MM-dd");
            const dayItems = items.filter((item) => item.date === iso);
            return (
              <li key={iso} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
                <p className="text-xs text-muted">{format(day, "M/d EEE", { locale: zhTW })}</p>
                {dayItems.length ? (
                  dayItems.map((item) => (
                    <p key={item.id} className="mt-1 text-sm">
                      {item.title}
                    </p>
                  ))
                ) : (
                  <p className="mt-1 text-xs text-subtle">這天還沒排</p>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </main>
  );
}

function AgendaRow({
  item,
  onExtend,
  onCopy,
}: {
  item: CalendarItem;
  onExtend: () => void;
  onCopy: () => void;
}) {
  return (
    <li className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
      <p className="text-xs text-muted">{item.date}</p>
      <p className="text-sm">{item.title}</p>
      <p className="text-xs text-subtle">
        {item.kind === "event" ? "活動" : contentKindLabel(item.kind)} · {STATUS_META[item.status].label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={onExtend}>
          AI 延伸
        </Button>
        <Button size="sm" variant="ghost" onClick={onCopy}>
          複製
        </Button>
        {item.projectId ? (
          <Button asChild size="sm" variant="ghost">
            <Link to="/studio/$projectId" params={{ projectId: item.projectId }}>
              編輯
            </Link>
          </Button>
        ) : null}
      </div>
    </li>
  );
}
