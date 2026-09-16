import { Link, useNavigate } from "@tanstack/react-router";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles, Tent } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { campaignDateMs, waveDateMs } from "@/lib/studio/campaign";
import { contentKindLabel } from "@/lib/studio/status";
import type { Campaign, Project } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

type View = "month" | "week" | "agenda";

type DayItem =
  | { type: "content"; project: Project; at: number }
  | { type: "wave"; campaign: Campaign; waveId: string; title: string; stage: string; at: number }
  | { type: "event"; campaign: Campaign; at: number };

export function CalendarPage() {
  const navigate = useNavigate();
  const projects = useStudio((s) => s.projects);
  const campaigns = useStudio((s) => s.campaigns);
  const setSchedule = useStudio((s) => s.setSchedule);
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<View>("month");
  const [dragId, setDragId] = useState<string | null>(null);

  const items = useMemo<DayItem[]>(() => {
    const rows: DayItem[] = [];
    for (const project of projects) {
      const at = project.scheduledAt ?? project.publishedAt;
      if (at) rows.push({ type: "content", project, at });
    }
    for (const campaign of campaigns) {
      const eventAt = campaignDateMs(campaign);
      if (eventAt) rows.push({ type: "event", campaign, at: eventAt });
      for (const wave of campaign.waves) {
        if (wave.contentId) continue;
        const at = waveDateMs(campaign, wave);
        if (at) {
          rows.push({
            type: "wave",
            campaign,
            waveId: wave.id,
            title: wave.title,
            stage: wave.stage,
            at,
          });
        }
      }
    }
    return rows.sort((a, b) => a.at - b.at);
  }, [projects, campaigns]);

  const days = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(cursor, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const out: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
    return out;
  }, [cursor, view]);

  const agenda = useMemo(() => {
    const from = startOfDay(new Date()).getTime();
    return items.filter((item) => item.at >= from).slice(0, 30);
  }, [items]);

  function itemsOn(day: Date) {
    return items.filter((item) => isSameDay(item.at, day));
  }

  function dropOn(day: Date) {
    if (!dragId) return;
    const project = projects.find((p) => p.id === dragId);
    if (!project) return;
    const prev = project.scheduledAt ? new Date(project.scheduledAt) : null;
    const next = new Date(day);
    next.setHours(prev?.getHours() ?? 19, prev?.getMinutes() ?? 0, 0, 0);
    setSchedule(project.id, next.getTime());
    setDragId(null);
    toast.success(`已改到 ${format(next, "M/d HH:mm")}`);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="排程"
        title="內容日曆"
        description="只服務創作與發布：什麼時候發、發什麼型態。沒有負責人，也沒有審核流程。"
        actions={
          <div className="flex items-center gap-1 rounded-full bg-surface p-1 shadow-[var(--shadow-border)]">
            {(
              [
                { id: "month" as const, label: "月" },
                { id: "week" as const, label: "週" },
                { id: "agenda" as const, label: "清單" },
              ]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={cn(
                  "min-h-9 rounded-full px-3 text-xs transition-colors",
                  view === tab.id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
      />

      {view !== "agenda" ? (
        <div className="mt-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="上一個"
              onClick={() => setCursor(view === "week" ? addDays(cursor, -7) : addMonths(cursor, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <p className="min-w-28 text-center text-sm font-medium">
              {format(cursor, view === "week" ? "M月 d日 那週" : "yyyy年 M月", { locale: zhTW })}
            </p>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="下一個"
              onClick={() => setCursor(view === "week" ? addDays(cursor, 7) : addMonths(cursor, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
            今天
          </Button>
        </div>
      ) : null}

      {/* 手機用清單，電腦用格線 */}
      {view === "agenda" ? (
        <AgendaList items={agenda} />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted">
            {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayItems = itemsOn(day);
              const dim = view === "month" && !isSameMonth(day, cursor);
              return (
                <div
                  key={day.toISOString()}
                  onDragOver={(e) => {
                    if (dragId) e.preventDefault();
                  }}
                  onDrop={() => dropOn(day)}
                  className={cn(
                    "min-h-24 rounded-xl bg-surface p-1.5 shadow-[var(--shadow-border)] transition-shadow sm:min-h-28",
                    dim && "opacity-45",
                    isSameDay(day, new Date()) && "ring-2 ring-ring",
                    dragId && "hover:shadow-[var(--shadow-lift)]",
                  )}
                >
                  <p className="px-0.5 text-xs tabular-nums text-muted">{format(day, "d")}</p>
                  <ul className="mt-1 space-y-1">
                    {dayItems.slice(0, 3).map((item) => (
                      <li key={keyOf(item)}>
                        <CalendarChip item={item} onDragStart={setDragId} />
                      </li>
                    ))}
                    {dayItems.length > 3 ? (
                      <li className="px-1 text-[0.65rem] text-subtle">+{dayItems.length - 3}</li>
                    ) : null}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-subtle">
            已排程的內容可以直接拖到別的日期。灰色的是 AI 排好但還沒建立的那幾篇。
          </p>
        </>
      )}

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-surface p-8 text-center shadow-[var(--shadow-border)]">
          <CalendarDays className="mx-auto size-5 text-subtle" />
          <p className="mt-2 text-sm text-muted">日曆上還沒有東西。</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button asChild size="sm">
              <Link to="/campaigns" search={{ new: "1" }}>
                <Tent className="size-4" />
                建立活動
              </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link to="/create" search={{ from: "idea" }}>
                <Sparkles className="size-4" />
                寫一篇
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function keyOf(item: DayItem): string {
  if (item.type === "content") return `c_${item.project.id}`;
  if (item.type === "wave") return `w_${item.waveId}`;
  return `e_${item.campaign.id}`;
}

function CalendarChip({
  item,
  onDragStart,
}: {
  item: DayItem;
  onDragStart: (id: string | null) => void;
}) {
  if (item.type === "event") {
    return (
      <Link
        to="/campaigns/$campaignId"
        params={{ campaignId: item.campaign.id }}
        className="block truncate rounded-lg bg-[color-mix(in_oklab,var(--color-warm)_28%,transparent)] px-1.5 py-1 text-[0.65rem] font-medium"
      >
        {item.campaign.name || "活動"}
      </Link>
    );
  }
  if (item.type === "wave") {
    return (
      <Link
        to="/campaigns/$campaignId"
        params={{ campaignId: item.campaign.id }}
        className="block truncate rounded-lg bg-surface-2 px-1.5 py-1 text-[0.65rem] text-muted"
        title={`${item.stage}·${item.title}（還沒建立）`}
      >
        {item.title || item.stage}
      </Link>
    );
  }
  return (
    <Link
      to="/studio/$projectId"
      params={{ projectId: item.project.id }}
      draggable
      onDragStart={() => onDragStart(item.project.id)}
      onDragEnd={() => onDragStart(null)}
      className="block truncate rounded-lg bg-[color-mix(in_oklab,var(--color-clear)_22%,transparent)] px-1.5 py-1 text-[0.65rem] font-medium"
      title={item.project.name}
    >
      {item.project.name}
    </Link>
  );
}

function AgendaList({ items }: { items: DayItem[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-6 space-y-2">
      {items.map((item) => (
        <li key={keyOf(item)} className="rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
          {item.type === "content" ? (
            <Link
              to="/studio/$projectId"
              params={{ projectId: item.project.id }}
              className="flex items-center gap-3"
            >
              <span className="w-14 shrink-0 text-xs tabular-nums text-muted">
                {format(item.at, "M/d")}
                <span className="block text-subtle">{format(item.at, "HH:mm")}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.project.name}</span>
                <span className="block truncate text-xs text-muted">
                  {contentKindLabel(item.project.contentKind)}
                </span>
              </span>
              <StatusBadge status={item.project.status} />
            </Link>
          ) : item.type === "event" ? (
            <Link
              to="/campaigns/$campaignId"
              params={{ campaignId: item.campaign.id }}
              className="flex items-center gap-3"
            >
              <span className="w-14 shrink-0 text-xs tabular-nums text-muted">{format(item.at, "M/d")}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.campaign.name}</span>
                <span className="block truncate text-xs text-muted">活動當天</span>
              </span>
            </Link>
          ) : (
            <Link
              to="/campaigns/$campaignId"
              params={{ campaignId: item.campaign.id }}
              className="flex items-center gap-3"
            >
              <span className="w-14 shrink-0 text-xs tabular-nums text-subtle">{format(item.at, "M/d")}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{item.title}</span>
                <span className="block truncate text-xs text-subtle">
                  {item.stage}·還沒建立
                </span>
              </span>
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
