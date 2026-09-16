import { addDays, format, startOfMonth, startOfWeek } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { DuePublishBar } from "@/components/calendar/due-publish-bar";
import { PublishButton } from "@/components/create/publish-button";
import { Button } from "@/components/ui/button";
import { contentKindLabel } from "@/lib/studio/content";
import { STATUS_META } from "@/lib/studio/status";
import { calendarFrom, useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "@/lib/creative/types";

export function CalendarPage({ focusDay }: { focusDay?: string }) {
  const campaigns = useCreative((s) => s.campaigns);
  const moveWave = useCreative((s) => s.moveWave);
  const duplicateWave = useCreative((s) => s.duplicateWave);
  const projects = useStudio((s) => s.projects);
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(() => (focusDay ? new Date(`${focusDay}T12:00:00+08:00`) : new Date()));
  const [view, setView] = useState<"month" | "week" | "agenda">("agenda");
  const items = calendarFrom(campaigns, projects);

  useEffect(() => {
    if (!focusDay) return;
    setCursor(new Date(`${focusDay}T12:00:00+08:00`));
  }, [focusDay]);

  useEffect(() => {
    if (!focusDay) return;
    const el = document.getElementById(`cal-day-${focusDay}`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusDay, items.length, view]);

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
      search: { q: `延續：${item.title}`, go: "1", campaign: item.campaignId },
    });
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-xs tracking-[0.18em] text-muted uppercase">排程</p>
      <h1 className="mt-1 font-display text-3xl">什麼時候發</h1>
      <p className="mt-2 text-sm text-muted">只服務創作與發布。沒有審核人。桌面可拖曳改日期。</p>
      {focusDay ? (
        <p className="mt-3 rounded-2xl bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]">
          這次排在 {focusDay.slice(5).replace("-", "/")}。Agenda 會亮出來，週視圖從這週看。
        </p>
      ) : null}
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

      <DuePublishBar />

      {view === "agenda" ? (
        <ul className="mt-6 space-y-2">
          {items.map((item) => (
            <AgendaRow
              key={item.id}
              item={item}
              focused={Boolean(focusDay && item.date === focusDay && item.kind !== "event")}
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
                        className={cn(
                          "cursor-grab rounded-lg bg-surface-2 px-1.5 py-1 text-xs leading-tight",
                          focusDay && item.date === focusDay && item.kind !== "event" && "ring-2 ring-primary",
                        )}
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
                        className={cn(
                          "cursor-grab text-sm",
                          focusDay && item.date === focusDay && item.kind !== "event" && "rounded-lg ring-2 ring-primary",
                        )}
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
                    <div
                      key={item.id}
                      id={item.date === focusDay ? `cal-day-${item.date}` : undefined}
                      className={cn(
                        "mt-2 border-t border-border pt-2",
                        focusDay && item.date === focusDay && item.kind !== "event" && "rounded-xl ring-2 ring-primary",
                      )}
                    >
                      <p className="text-sm">{item.title}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Button size="sm" variant="ghost" onClick={() => extend(item)}>
                          AI 延伸
                        </Button>
                        {item.kind !== "event" && item.status !== "published" ? (
                          <PublishButton
                            campaignId={item.campaignId}
                            waveId={item.waveId}
                            projectId={item.projectId}
                            title={item.title}
                          />
                        ) : null}
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
                    <div
                      key={item.id}
                      id={item.date === focusDay ? `cal-day-${item.date}` : undefined}
                      className={cn(
                        "mt-2 border-t border-border pt-2 first:mt-1 first:border-0 first:pt-0",
                        focusDay && item.date === focusDay && item.kind !== "event" && "rounded-xl ring-2 ring-primary",
                      )}
                    >
                      <p className="text-sm">{item.title}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Button size="sm" variant="ghost" onClick={() => extend(item)}>
                          AI 延伸
                        </Button>
                        {item.campaignId && item.waveId ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => duplicateWave(item.campaignId!, item.waveId!)}
                          >
                            複製
                          </Button>
                        ) : null}
                        {item.kind !== "event" && item.status !== "published" ? (
                          <PublishButton
                            campaignId={item.campaignId}
                            waveId={item.waveId}
                            projectId={item.projectId}
                            title={item.title}
                          />
                        ) : null}
                      </div>
                    </div>
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
  focused,
  onExtend,
  onCopy,
}: {
  item: CalendarItem;
  focused?: boolean;
  onExtend: () => void;
  onCopy: () => void;
}) {
  return (
    <li
      id={focused ? `cal-day-${item.date}` : undefined}
      className={cn("rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]", focused && "ring-2 ring-primary")}
    >
      <p className="text-xs text-muted">{item.date}</p>
      <p className="text-sm">{item.title}</p>
      <p className="text-xs text-subtle">
        {item.kind === "event" ? "活動" : contentKindLabel(item.kind)} · {STATUS_META[item.status].label}
        {item.publishedAt ? ` · 實際發布 ${format(item.publishedAt, "M/d HH:mm", { locale: zhTW })}` : ""}
        {item.kind !== "event" && item.status !== "published" && item.date <= format(new Date(), "yyyy-MM-dd")
          ? " · 該發了"
          : ""}
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
        {item.kind !== "event" && item.status !== "published" ? (
          <PublishButton
            campaignId={item.campaignId}
            waveId={item.waveId}
            projectId={item.projectId}
            title={item.title}
          />
        ) : null}
      </div>
    </li>
  );
}
