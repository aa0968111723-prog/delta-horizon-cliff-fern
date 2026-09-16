import { addMonths, addWeeks, format, isSameDay, parseISO, startOfToday } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  agendaDays,
  campaignNameOf,
  calendarSurface,
  isoDay,
  monthGrid,
  movePlannedAt,
  type CalendarView,
  weekGrid,
} from "@/lib/creative/calendar";
import { contentTypeDeliverables } from "@/lib/creative/rhythm";
import type { ContentItem } from "@/lib/creative/types";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";
import { useUi } from "@/stores/ui-store";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

export function ContentCalendar() {
  const campaigns = useCreative((state) => state.campaigns);
  const contentItems = useCreative((state) => state.contentItems);
  const rescheduleContent = useCreative((state) => state.rescheduleContent);
  const generateRhythm = useCreative((state) => state.generateRhythm);
  const startCreative = useUi((state) => state.startCreative);
  const [anchor, setAnchor] = useState(() => startOfToday());
  const [view, setView] = useState<CalendarView>("month");
  const [mobileView, setMobileView] = useState<Extract<CalendarView, "agenda" | "week">>("agenda");
  const [narrow, setNarrow] = useState(false);
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "all");

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

  function dropOnDay(day: string, contentId: string) {
    const item = contentItems.find((row) => row.id === contentId);
    if (!item) return;
    rescheduleContent(contentId, movePlannedAt(item.plannedAt, day));
    toast.success("已改期，不會自動發布");
  }

  function createFrom(item: ContentItem) {
    const campaign = campaigns.find((row) => row.id === item.campaignId);
    if (!campaign) return;
    startCreative({
      eventName: campaign.name,
      product: campaign.oneLiner || campaign.name,
      schedule: `${campaign.eventDate} ${campaign.eventTime}`.trim(),
      location: campaign.location,
      audience: `淡江大學學生；這次優先回應：${campaign.studentPain}`,
      features: [campaign.oneLiner, campaign.description].filter(Boolean).join("；"),
      notes: `這一波內容：${item.title}。角度：${item.angle}`,
      deliverables: contentTypeDeliverables(item.type),
    }, item.id);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="一人節奏，沒有負責人"
        title="排程"
        description="用月曆或週覽看內容節奏。拖到另一天只改本機排程，不會發到 Instagram。"
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              const id = campaignId === "all" ? campaigns[0]?.id : campaignId;
              if (!id) return;
              generateRhythm(id);
              toast.success("已依活動日期重排節奏");
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
                "min-h-10 rounded-full px-3 text-sm",
                view === item ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]",
              )}
            >
              {item === "month" ? "月" : item === "week" ? "週" : "議程"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
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
              <li key={`mw-${day.date}`} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <p className="text-xs font-medium text-accent">{format(parseISO(day.date), "M月d日 EEEE", { locale: zhTW })}</p>
                {day.items.length ? (
                  <ul className="mt-3 space-y-2">
                    {day.items.map((item) => (
                      <AgendaRow
                        key={item.id}
                        item={item}
                        campaignName={campaignNameOf(campaigns, item.campaignId)}
                        onCreate={() => createFrom(item)}
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
              <li key={`m-${day.date}`} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <p className="text-xs font-medium text-accent">{format(parseISO(day.date), "M月d日 EEEE", { locale: zhTW })}</p>
                <ul className="mt-3 space-y-2">
                  {day.items.map((item) => (
                    <AgendaRow
                      key={item.id}
                      item={item}
                      campaignName={campaignNameOf(campaigns, item.campaignId)}
                      onCreate={() => createFrom(item)}
                      onMove={(next) => dropOnDay(next, item.id)}
                    />
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-2xl bg-surface px-4 py-10 text-center text-sm text-muted shadow-[var(--shadow-border)]">
            這段時間還沒有內容節奏。到 Campaign 依活動生成一版，或用日期改期。
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
                    onCreate={() => createFrom(item)}
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
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const id = event.dataTransfer.getData("text/zen-content");
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
                      <button
                        type="button"
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData("text/zen-content", item.id)}
                        onClick={() => createFrom(item)}
                        className="w-full rounded-lg bg-accent/10 px-1.5 py-1 text-left"
                      >
                        <span className="block truncate text-xs font-medium">{item.title}</span>
                        <span className="block truncate text-xs text-muted">{item.type}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 hidden text-xs text-muted md:block">把卡片拖到另一天即可改期。手機請改用議程檢視的日期。沒有指派對象。</p>
        </div>
      )}

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
        "min-h-10 shrink-0 rounded-full px-3 text-sm",
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
  onCreate,
  onMove,
}: {
  item: ContentItem;
  campaignName: string;
  onCreate: () => void;
  onMove: (day: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-bg p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{item.type}</Badge>
          <span className="text-xs text-muted">{campaignName}</span>
        </div>
        <p className="mt-1 font-medium">{item.title}</p>
        <p className="mt-1 text-xs text-muted">{item.angle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={isoDay(item.plannedAt)}
          onChange={(event) => onMove(event.target.value)}
          className="h-11 rounded-md border border-border bg-surface px-3 text-sm"
        />
        <Button size="sm" onClick={onCreate}>
          <Sparkles className="size-4" />
          AI 創作
        </Button>
      </div>
    </div>
  );
}

function shift(view: CalendarView, date: Date, direction: -1 | 1) {
  if (view === "month") return addMonths(date, direction);
  return addWeeks(date, direction);
}
