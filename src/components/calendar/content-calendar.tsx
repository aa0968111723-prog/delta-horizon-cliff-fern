import { Link } from "@tanstack/react-router";
import { addMonths, addWeeks, format, isSameDay, parseISO, startOfToday } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CreationLoop } from "@/components/shared/creation-loop";
import { OutcomeJournal } from "@/components/learning/outcome-journal";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOpenContentWork } from "@/hooks/use-open-content";
import {
  agendaDays,
  campaignNameOf,
  calendarSurface,
  isoDay,
  monthGrid,
  movePlannedAt,
  readCalendarDrag,
  writeCalendarDrag,
  type CalendarView,
  weekGrid,
} from "@/lib/creative/calendar";
import { contentOpenLabel, contentOpenPlan } from "@/lib/creative/open-content";
import type { ContentItem } from "@/lib/creative/types";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

export function ContentCalendar() {
  const campaigns = useCreative((state) => state.campaigns);
  const contentItems = useCreative((state) => state.contentItems);
  const rescheduleContent = useCreative((state) => state.rescheduleContent);
  const generateRhythm = useCreative((state) => state.generateRhythm);
  const { openWork } = useOpenContentWork();
  const [anchor, setAnchor] = useState(() => startOfToday());
  const [view, setView] = useState<CalendarView>("month");
  const [mobileView, setMobileView] = useState<Extract<CalendarView, "agenda" | "week">>("agenda");
  const [narrow, setNarrow] = useState(false);
  const [campaignId, setCampaignId] = useState(() => {
    const state = useCreative.getState();
    const id = state.activeCampaignId;
    if (id && state.contentItems.some((item) => item.campaignId === id)) return id;
    return "all";
  });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    function apply() {
      setNarrow(media.matches);
      if (media.matches) setView("agenda");
    }
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  const activeView = calendarSurface(narrow, view, mobileView);

  const filtered = useMemo(
    () => contentItems.filter((item) => campaignId === "all" || item.campaignId === campaignId),
    [campaignId, contentItems],
  );
  const days = useMemo(() => {
    if (activeView === "week") return weekGrid(anchor, filtered);
    if (activeView === "agenda") return agendaDays(filtered, anchor);
    return monthGrid(anchor, filtered);
  }, [anchor, filtered, activeView]);

  const dropOnDay = useCallback((day: string, contentId: string) => {
    const item = useCreative.getState().contentItems.find((row) => row.id === contentId);
    if (!item) return;
    rescheduleContent(contentId, movePlannedAt(item.plannedAt, day));
    toast.success("已改期，不會自動發布");
  }, [rescheduleContent]);

  const pointerDrag = useRef<{ id: string; moved: boolean } | null>(null);

  useEffect(() => {
    if (narrow) return;
    function onMove(event: PointerEvent) {
      const drag = pointerDrag.current;
      if (!drag) return;
      if (Math.abs(event.movementX) + Math.abs(event.movementY) > 3) drag.moved = true;
    }
    function onUp(event: PointerEvent) {
      const drag = pointerDrag.current;
      pointerDrag.current = null;
      if (!drag?.moved) return;
      const el = document.elementFromPoint(event.clientX, event.clientY);
      const day = el?.closest("[data-day]")?.getAttribute("data-day");
      if (day) dropOnDay(day, drag.id);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dropOnDay, narrow]);

  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="一人節奏"
        title="排程"
        description="宣傳節奏會出現在這裡。拖到另一天或改日期只改本機排程，不會發到 Instagram。"
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              const id = campaignId === "all" ? campaigns[0]?.id : campaignId;
              if (!id) return;
              generateRhythm(id);
              toast.success("已依活動日期重排節奏，格子可以拖或改期");
            }}
          >
            重排 AI 節奏
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setAnchor((date) => shift(activeView, date, -1))} aria-label="上一段">
            <ChevronLeft className="size-4" />
          </Button>
          <p className="min-w-36 text-center font-display text-xl">
            {format(anchor, activeView === "week" ? "M月d日" : "yyyy年M月", { locale: zhTW })}
          </p>
          <Button variant="ghost" size="icon" onClick={() => setAnchor((date) => shift(activeView, date, 1))} aria-label="下一段">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 md:hidden">
          {(["agenda", "week"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMobileView(item)}
              className={cn(
                "min-h-11 rounded-full px-3 text-sm",
                mobileView === item ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]",
              )}
            >
              {item === "week" ? "本週" : "議程"}
            </button>
          ))}
        </div>
        <div className="hidden flex-wrap gap-2 md:flex">
          {(["month", "week", "agenda"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={cn(
                "min-h-11 rounded-full px-3 text-sm",
                view === item ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]",
              )}
            >
              {item === "month" ? "月" : item === "week" ? "週" : "議程"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <CreationLoop current="schedule" />
      </div>

      <div className="mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1">
        <FilterChip active={campaignId === "all"} onClick={() => setCampaignId("all")}>全部活動</FilterChip>
        {campaigns.map((campaign) => (
          <FilterChip key={campaign.id} active={campaignId === campaign.id} onClick={() => setCampaignId(campaign.id)}>
            {campaign.name}
          </FilterChip>
        ))}
      </div>

      <div className="mt-5 md:hidden">
        {activeView === "week" ? (
          <ol className="space-y-3">
            {days.map((day) => (
              <li
                key={`mw-${day.date}`}
                data-testid="calendar-day"
                data-day={day.date}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const id = readCalendarDrag(event.dataTransfer);
                  if (id) dropOnDay(day.date, id);
                }}
                className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]"
              >
                <p className="text-xs font-medium text-accent">{format(parseISO(day.date), "M月d日 EEEE", { locale: zhTW })}</p>
                {day.items.length ? (
                  <ul className="mt-3 space-y-2">
                    {day.items.map((item) => (
                      <AgendaRow
                        key={item.id}
                        item={item}
                        campaignName={campaignNameOf(campaigns, item.campaignId)}
                        onOpen={(prefer) => openWork(item, prefer)}
                        onMove={(next) => dropOnDay(next, item.id)}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted">這天還沒有節奏。</p>
                )}
              </li>
            ))}
          </ol>
        ) : days.filter((day) => day.items.length).length ? (
          <ol className="space-y-3">
            {days.filter((day) => day.items.length).map((day) => (
              <li key={`m-${day.date}`} data-testid="calendar-day" data-day={day.date} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <p className="text-xs font-medium text-accent">{format(parseISO(day.date), "M月d日 EEEE", { locale: zhTW })}</p>
                <ul className="mt-3 space-y-2">
                  {day.items.map((item) => (
                    <AgendaRow
                      key={item.id}
                      item={item}
                      campaignName={campaignNameOf(campaigns, item.campaignId)}
                      onOpen={(prefer) => openWork(item, prefer)}
                      onMove={(next) => dropOnDay(next, item.id)}
                    />
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-2xl bg-surface px-4 py-10 text-center text-sm text-muted shadow-[var(--shadow-border)]">
            這段時間還沒有內容節奏。到活動頁生成一版，或按上方重排，波次會出現在這裡。
          </p>
        )}
      </div>

      {activeView === "agenda" && !narrow ? (
        <ol className="mt-5 hidden space-y-3 md:block">
          {days.filter((day) => day.items.length).map((day) => (
            <li key={day.date} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="text-xs font-medium text-accent">{format(parseISO(day.date), "M月d日 EEEE", { locale: zhTW })}</p>
              <ul className="mt-3 space-y-2">
                {day.items.map((item) => (
                  <AgendaRow
                    key={item.id}
                    item={item}
                    campaignName={campaignNameOf(campaigns, item.campaignId)}
                    onOpen={(prefer) => openWork(item, prefer)}
                    onMove={(next) => dropOnDay(next, item.id)}
                  />
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-5 hidden overflow-x-auto rounded-3xl bg-surface p-3 shadow-[var(--shadow-border)] md:block md:p-4">
          <div className="grid min-w-[36rem] grid-cols-7 gap-1">
            {WEEKDAYS.map((label) => (
              <p key={label} className="px-1 pb-2 text-center text-xs text-muted">{label}</p>
            ))}
            {days.map((day) => (
              <div
                key={day.date}
                data-testid="calendar-day"
                data-day={day.date}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const id = readCalendarDrag(event.dataTransfer);
                  if (id) dropOnDay(day.date, id);
                }}
                className={cn(
                  "min-h-24 rounded-xl p-1.5 md:min-h-32",
                  day.inMonth ? "bg-bg" : "bg-surface-2/50",
                  isSameDay(parseISO(day.date), startOfToday()) && "ring-1 ring-accent/40",
                )}
              >
                <p className={cn("px-1 text-xs", day.inMonth ? "text-muted" : "text-subtle")}>
                  {format(parseISO(day.date), "d")}
                </p>
                <ul className="mt-1 space-y-1">
                  {day.items.map((item) => (
                    <li key={item.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        draggable
                        data-testid="calendar-item"
                        onPointerDown={() => {
                          pointerDrag.current = { id: item.id, moved: false };
                        }}
                        onDragStart={(event) => writeCalendarDrag(event.dataTransfer, item.id)}
                        onClick={() => {
                          if (pointerDrag.current?.moved) return;
                          openWork(item);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openWork(item);
                          }
                        }}
                        className="w-full cursor-grab rounded-lg bg-accent/10 px-1.5 py-1 text-left active:cursor-grabbing"
                      >
                        <span className="block truncate text-xs font-medium">{item.title}</span>
                        <span className="block truncate text-xs text-muted">{item.type}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 hidden text-xs text-muted md:block">把卡片拖到另一天即可改期。手機請改用議程檢視的日期。只改這台裝置的節奏。</p>
        </div>
      )}

      <div className="mt-6 min-w-0">
        <OutcomeJournal />
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-muted">
        <CalendarDays className="size-4 text-accent" />
        這是創作節奏，不是發文排程器。
      </p>
    </main>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 shrink-0 rounded-full px-3 text-sm",
        active ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]",
      )}
    >
      {children}
    </button>
  );
}

function AgendaRow({
  item,
  campaignName,
  onOpen,
  onMove,
}: {
  item: ContentItem;
  campaignName: string;
  onOpen: (prefer?: "studio" | "copy" | "preview") => void;
  onMove: (day: string) => void;
}) {
  const plan = contentOpenPlan(item);
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl bg-bg p-3 sm:flex-row sm:items-start sm:justify-between">
      <button type="button" className="min-w-0 text-left" data-testid="calendar-open-work" onClick={() => onOpen()}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{item.type}</Badge>
          <span className="text-xs text-muted">{campaignName}</span>
        </div>
        <p className="mt-1 break-words font-medium">{item.title}</p>
        <p className="mt-1 text-xs leading-5 text-muted">{item.angle}</p>
      </button>
      <div className="flex min-w-0 flex-col gap-2 sm:items-end">
        <input
          type="date"
          data-testid="calendar-reschedule"
          aria-label={`${item.title} 改期`}
          value={isoDay(item.plannedAt)}
          onChange={(event) => {
            if (!event.target.value) return;
            onMove(event.target.value);
          }}
          className="h-11 min-h-11 w-full min-w-0 max-w-full rounded-md border border-border bg-surface px-3 text-sm sm:w-40"
        />
        <div className="flex min-w-0 flex-wrap gap-2">
          <Button size="sm" className="min-h-11" data-testid="calendar-open-primary" onClick={() => onOpen()}>
            {contentOpenLabel(plan)}
          </Button>
          {plan.hasWork && plan.kind === "studio" ? (
            <Button size="sm" className="min-h-11" variant="secondary" onClick={() => onOpen("copy")}>
              文案
            </Button>
          ) : null}
          {plan.hasWork ? (
            <Button size="sm" className="min-h-11" variant="secondary" data-testid="calendar-open-preview" onClick={() => onOpen("preview")}>
              IG 預覽
            </Button>
          ) : null}
          {(item.status === "complete" || item.status === "published" || item.status === "scheduled") ? (
            <Button size="sm" className="min-h-11" variant="ghost" asChild>
              <Link to="/instagram" hash="learn">現場筆記</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function shift(view: CalendarView, date: Date, direction: -1 | 1) {
  if (view === "month") return addMonths(date, direction);
  return addWeeks(date, direction);
}
