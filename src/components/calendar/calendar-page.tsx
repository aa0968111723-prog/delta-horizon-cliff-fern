import { Link, useNavigate } from "@tanstack/react-router";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format as formatDate,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Copy, Plus, Sparkles, Tent, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ContentStatusBadge } from "@/components/content/content-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rhythmOf, RHYTHM_LABEL, rhythmWarnings, suggestScheduleForCampaign } from "@/lib/studio/schedule";
import type { Campaign, ContentItem } from "@/lib/studio/types";
import { todayIso } from "@/lib/zen/context";
import { contentTypeShort, WAVE_ROLES } from "@/lib/zen/labels";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

type View = "month" | "week" | "agenda";
const DRAG_MIME = "application/x-zen-content";

export function CalendarPage() {
  const navigate = useNavigate();
  const hydrated = useStudio((s) => s.hydrated);
  const contents = useStudio((s) => s.contents);
  const campaigns = useStudio((s) => s.campaigns);
  const scheduleContent = useStudio((s) => s.scheduleContent);
  const createContent = useStudio((s) => s.createContent);
  const duplicateContent = useStudio((s) => s.duplicateContent);
  const updateCampaign = useStudio((s) => s.updateCampaign);

  const [view, setView] = useState<View>(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "agenda" : "month"));
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<Date>(() => new Date());
  const [dragOver, setDragOver] = useState<string | null>(null);

  const scheduled = useMemo(() => contents.filter((c) => c.scheduledAt || c.publishedAt), [contents]);
  const warnings = useMemo(() => rhythmWarnings(contents, campaigns), [contents, campaigns]);

  const days = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(cursor, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end: addDays(start, 6) });
    }
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor, view]);

  function itemsOn(day: Date) {
    return scheduled
      .filter((c) => isSameDay(new Date(c.publishedAt ?? c.scheduledAt!), day))
      .sort((a, b) => (a.publishedAt ?? a.scheduledAt!) - (b.publishedAt ?? b.scheduledAt!));
  }
  function campaignsOn(day: Date) {
    const iso = todayIso(day);
    return campaigns.filter((c) => c.date === iso);
  }

  function moveTo(contentId: string, day: Date) {
    const c = contents.find((x) => x.id === contentId);
    if (!c) return;
    const prev = c.scheduledAt ? new Date(c.scheduledAt) : new Date();
    const next = new Date(day);
    next.setHours(prev.getHours() || 20, prev.getMinutes(), 0, 0);
    scheduleContent(contentId, next.getTime());
    toast.success(`已移到 ${formatDate(next, "M/d (EEEEE) HH:mm", { locale: zhTW })}`);
  }

  function quickAdd(day: Date) {
    const at = new Date(day);
    at.setHours(20, 0, 0, 0);
    const created = createContent({
      type: "ig-post",
      status: "idea",
      title: `${formatDate(day, "M/d")} 的內容`,
      scheduledAt: at.getTime(),
      campaignId: null,
    });
    void navigate({ to: "/create", search: { contentId: created.id, mode: "post" } });
  }

  function autoSchedule(campaign: Campaign) {
    const plan = suggestScheduleForCampaign(campaign, contents);
    if (!plan.length) {
      toast.message(campaign.strategy ? "這個活動的每一波都已經排好了。" : "先到活動頁按「AI 生成完整宣傳」，才有節奏可以排。");
      return;
    }
    const waves = campaign.strategy!.waves.map((w) => {
      const hit = plan.find((p) => p.wave.id === w.id);
      if (!hit) return w;
      const content = createContent({
        campaignId: campaign.id,
        type: w.contentType,
        status: "idea",
        title: `${campaign.name} · ${w.title}`,
        copy: { hook: w.hook, body: "", cta: campaign.cta, hashtags: [], tone: "normal" },
        visualDirection: w.angle,
        scheduledAt: hit.at,
        sources: [{ kind: "ai", label: `AI 自動排程 / ${WAVE_ROLES[w.role].label}` }],
      });
      return { ...w, contentId: content.id };
    });
    updateCampaign(campaign.id, { strategy: { ...campaign.strategy!, waves } });
    toast.success(`AI 已排入 ${plan.length} 波，避開了已有內容的日子。`);
  }

  if (!hydrated) return null;

  const upcomingCampaign = campaigns.filter((c) => c.date >= todayIso()).sort((a, b) => a.date.localeCompare(b.date))[0];
  const title = view === "week" ? `${formatDate(days[0], "M/d")} – ${formatDate(days[6], "M/d")}` : formatDate(cursor, "yyyy 年 M 月", { locale: zhTW });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="排程"
        title="什麼時候發"
        description="只服務創作與發布：拖曳改日期、點日子快速新增、AI 依活動節奏自動排。"
        actions={
          upcomingCampaign ? (
            <Button variant="secondary" className="rounded-full" onClick={() => autoSchedule(upcomingCampaign)}>
              <Wand2 className="size-4" />
              AI 排「{upcomingCampaign.name}」
            </Button>
          ) : (
            <Button variant="secondary" className="rounded-full" asChild>
              <Link to="/campaigns" search={{ new: 1 }}>
                <Tent className="size-4" /> 先建一個活動
              </Link>
            </Button>
          )
        }
      />

      {warnings.length ? (
        <div className="mt-5 space-y-2">
          {warnings.map((w) => (
            <div key={w.afterContentId} className="flex flex-wrap items-center gap-2 rounded-2xl bg-glow-card px-4 py-3 text-sm">
              <Sparkles className="size-4 text-accent" />
              <span className="flex-1">{w.message}</span>
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => {
                  const created = createContent({
                    type: w.suggestType,
                    status: "idea",
                    title: "節奏調整 · 生活 / 互動",
                    copy: { hook: w.suggestHook, body: "", cta: "", hashtags: [], tone: "life" },
                    scheduledAt: new Date(`${w.dateIso}T20:00:00`).getTime(),
                    sources: [{ kind: "ai", label: "AI 節奏建議" }],
                  });
                  void navigate({ to: "/create", search: { contentId: created.id } });
                }}
              >
                插一篇 {contentTypeShort(w.suggestType)}
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" aria-label="上一個" onClick={() => setCursor((d) => (view === "week" ? addWeeks(d, -1) : addMonths(d, -1)))}>
            <ChevronLeft className="size-4" />
          </Button>
          <p className="min-w-[8rem] text-center font-display text-lg">{title}</p>
          <Button variant="ghost" size="sm" aria-label="下一個" onClick={() => setCursor((d) => (view === "week" ? addWeeks(d, 1) : addMonths(d, 1)))}>
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCursor(new Date());
              setSelected(new Date());
            }}
          >
            今天
          </Button>
        </div>
        <div className="flex gap-1 rounded-full bg-surface-2 p-1">
          {(["month", "week", "agenda"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn("rounded-full px-3 py-1.5 text-xs", view === v ? "bg-surface text-fg shadow-[var(--shadow-border)]" : "text-muted")}
            >
              {v === "month" ? "月" : v === "week" ? "週" : "Agenda"}
            </button>
          ))}
        </div>
      </div>

      {view === "agenda" ? (
        <Agenda contents={scheduled} campaigns={campaigns} onMove={moveTo} onDuplicate={(id) => duplicateContent(id)} onQuickAdd={quickAdd} />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
            {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className={cn("mt-1 grid grid-cols-7 gap-1", view === "week" ? "auto-rows-[minmax(11rem,auto)]" : "auto-rows-[minmax(5.5rem,auto)] md:auto-rows-[minmax(7rem,auto)]")}>
            {days.map((day) => {
              const iso = todayIso(day);
              const items = itemsOn(day);
              const camps = campaignsOn(day);
              const outside = view === "month" && !isSameMonth(day, cursor);
              return (
                <div
                  key={iso}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(day)}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(day)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(iso);
                  }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(null);
                    const id = e.dataTransfer.getData(DRAG_MIME);
                    if (id) moveTo(id, day);
                  }}
                  className={cn(
                    "group flex flex-col rounded-xl bg-surface p-1.5 text-left shadow-[var(--shadow-border)] transition-shadow md:rounded-2xl md:p-2",
                    outside && "opacity-45",
                    isSameDay(day, selected) && "ring-2 ring-accent",
                    dragOver === iso && "bg-glow-card",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs tabular-nums", isToday(day) && "rounded-full bg-fg px-1.5 text-bg")}>{formatDate(day, "d")}</span>
                    <button
                      type="button"
                      aria-label="快速新增"
                      className="hidden size-5 items-center justify-center rounded-full text-muted hover:bg-surface-2 group-hover:flex"
                      onClick={(e) => {
                        e.stopPropagation();
                        quickAdd(day);
                      }}
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                  <div className="mt-1 flex flex-1 flex-col gap-1">
                    {camps.map((c) => (
                      <Link
                        key={c.id}
                        to="/campaigns/$campaignId"
                        params={{ campaignId: c.id }}
                        className="truncate rounded-md bg-night px-1.5 py-0.5 text-[10px] text-night-fg md:text-[11px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ◆ {c.name}
                      </Link>
                    ))}
                    {items.slice(0, view === "week" ? 8 : 3).map((c) => (
                      <CalendarChip key={c.id} content={c} campaigns={campaigns} />
                    ))}
                    {items.length > 3 && view === "month" ? <span className="text-[10px] text-muted">+{items.length - 3}</span> : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected day */}
          <DayPanel
            day={selected}
            items={itemsOn(selected)}
            campaigns={campaigns}
            onMove={moveTo}
            onDuplicate={(id) => {
              const dup = duplicateContent(id);
              if (dup) toast.success("已複製一份（未排程）");
            }}
            onQuickAdd={() => quickAdd(selected)}
          />
        </>
      )}
    </main>
  );
}

function CalendarChip({ content, campaigns }: { content: ContentItem; campaigns: Campaign[] }) {
  const kind = rhythmOf(content, campaigns);
  const tone = {
    promo: "bg-accent/15 text-accent",
    life: "bg-glow-amber/30 text-fg",
    interactive: "bg-glow-lavender/40 text-fg",
    knowledge: "bg-glow-teal/30 text-fg",
    story: "bg-surface-2 text-fg",
    countdown: "bg-danger/10 text-danger",
    recap: "bg-success/10 text-success",
  }[kind];
  return (
    <Link
      to="/create"
      search={{ contentId: content.id }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_MIME, content.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={(e) => e.stopPropagation()}
      className={cn("truncate rounded-md px-1.5 py-0.5 text-[10px] leading-tight md:text-[11px]", tone, content.status === "published" && "opacity-60 line-through")}
      title={content.copy.hook || content.title}
    >
      {contentTypeShort(content.type)} · {content.copy.hook || content.title}
    </Link>
  );
}

function DayPanel({
  day,
  items,
  campaigns,
  onMove,
  onDuplicate,
  onQuickAdd,
}: {
  day: Date;
  items: ContentItem[];
  campaigns: Campaign[];
  onMove: (id: string, day: Date) => void;
  onDuplicate: (id: string) => void;
  onQuickAdd: () => void;
}) {
  return (
    <section className="mt-6 rounded-[24px] bg-surface p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">{formatDate(day, "M/d EEEE", { locale: zhTW })}</h2>
        <Button size="sm" className="rounded-full" onClick={onQuickAdd}>
          <Plus className="size-3.5" /> 這天新增
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">這天還沒有內容。點「這天新增」或把上面的內容拖過來。</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((c) => (
            <AgendaRow key={c.id} content={c} campaigns={campaigns} onMove={onMove} onDuplicate={onDuplicate} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Agenda({
  contents,
  campaigns,
  onMove,
  onDuplicate,
  onQuickAdd,
}: {
  contents: ContentItem[];
  campaigns: Campaign[];
  onMove: (id: string, day: Date) => void;
  onDuplicate: (id: string) => void;
  onQuickAdd: (day: Date) => void;
}) {
  const upcoming = [...contents]
    .filter((c) => c.status !== "published")
    .sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0));
  const byDay = new Map<string, ContentItem[]>();
  for (const c of upcoming) {
    const key = todayIso(new Date(c.scheduledAt!));
    byDay.set(key, [...(byDay.get(key) ?? []), c]);
  }
  const campDays = new Map(campaigns.filter((c) => c.date >= todayIso()).map((c) => [c.date, c]));
  const keys = [...new Set([...byDay.keys(), ...campDays.keys()])].sort();

  if (!keys.length) {
    return (
      <div className="mt-6 rounded-2xl bg-surface px-4 py-10 text-center text-sm text-muted shadow-[var(--shadow-border)]">
        <CalendarDays className="mx-auto size-6" />
        <p className="mt-3">還沒有排程。到活動頁按「全部排入 Calendar」，或</p>
        <Button size="sm" className="mt-3 rounded-full" onClick={() => onQuickAdd(new Date())}>
          <Plus className="size-3.5" /> 今天新增一篇
        </Button>
      </div>
    );
  }

  return (
    <ol className="mt-6 space-y-4">
      {keys.map((iso) => {
        const day = new Date(`${iso}T00:00:00`);
        const camp = campDays.get(iso);
        return (
          <li key={iso}>
            <div className="flex items-baseline gap-2">
              <span className={cn("font-display text-lg tabular-nums", isToday(day) && "text-accent")}>{formatDate(day, "M/d")}</span>
              <span className="text-xs text-muted">{formatDate(day, "EEEE", { locale: zhTW })}</span>
              <button type="button" className="ml-auto text-xs text-accent" onClick={() => onQuickAdd(day)}>
                + 新增
              </button>
            </div>
            <ul className="mt-2 space-y-2">
              {camp ? (
                <li>
                  <Link to="/campaigns/$campaignId" params={{ campaignId: camp.id }} className="flex items-center gap-2 rounded-2xl bg-night px-3 py-2 text-sm text-night-fg">
                    <Tent className="size-4" /> 活動日 · {camp.name} {camp.time}
                  </Link>
                </li>
              ) : null}
              {(byDay.get(iso) ?? []).map((c) => (
                <AgendaRow key={c.id} content={c} campaigns={campaigns} onMove={onMove} onDuplicate={onDuplicate} />
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

function AgendaRow({
  content,
  campaigns,
  onMove,
  onDuplicate,
}: {
  content: ContentItem;
  campaigns: Campaign[];
  onMove: (id: string, day: Date) => void;
  onDuplicate: (id: string) => void;
}) {
  const when = content.publishedAt ?? content.scheduledAt!;
  const kind = rhythmOf(content, campaigns);
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
      <span className="w-12 text-xs text-muted tabular-nums">{formatDate(when, "HH:mm")}</span>
      <Link to="/create" search={{ contentId: content.id }} className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{content.copy.hook || content.title}</span>
        <span className="block text-xs text-muted">
          {contentTypeShort(content.type)} · {RHYTHM_LABEL[kind]}
          {content.title !== content.copy.hook ? ` · ${content.title}` : ""}
        </span>
      </Link>
      <ContentStatusBadge status={content.status} />
      <Input
        type="date"
        aria-label="改日期"
        className="h-8 w-[8.5rem] rounded-full px-2 text-xs"
        value={todayIso(new Date(when))}
        onChange={(e) => e.target.value && onMove(content.id, new Date(`${e.target.value}T00:00:00`))}
      />
      <Button size="sm" variant="ghost" aria-label="複製" onClick={() => onDuplicate(content.id)}>
        <Copy className="size-3.5" />
      </Button>
      <Button size="sm" variant="ghost" asChild>
        <Link to="/create" search={{ contentId: content.id }}>
          <Sparkles className="size-3.5" /> AI 延伸
        </Link>
      </Button>
    </li>
  );
}
