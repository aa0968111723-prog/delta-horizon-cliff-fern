import { Link } from "@tanstack/react-router";
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
import { PostPackBar } from "@/components/create/post-pack";
import { DownloadPackButton } from "@/components/export/download-pack";
import { PackFlowBar } from "@/components/shared/pack-flow";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { groupSameNightPacks } from "@/lib/studio/calendar-groups";
import { campaignDateMs, waveDateMs } from "@/lib/studio/campaign";
import { suggestSchedule, offsetDaysFromEventDate } from "@/lib/studio/schedule";
import { CONTENT_KIND_ORDER, contentKindLabel } from "@/lib/studio/status";
import { unscheduledDonePacks } from "@/lib/studio/today-post";
import type { Campaign, ContentKind, Project } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

type View = "month" | "week" | "agenda";

type DayItem =
  | { type: "content"; project: Project; at: number }
  | { type: "wave"; campaign: Campaign; waveId: string; title: string; stage: string; at: number }
  | { type: "event"; campaign: Campaign; at: number };

type PackDayItem = { type: "pack"; rootId: string; members: Project[]; at: number };
type CellItem = DayItem | PackDayItem;

type MoveTarget =
  | { kind: "content"; id: string }
  | { kind: "pack"; ids: string[] }
  | { kind: "wave"; campaignId: string; waveId: string };

function packChipLabel(members: Array<Pick<Project, "contentKind">>): string {
  const kinds = [...new Set(members.map((item) => item.contentKind))].sort(
    (a, b) => kindOrder(a) - kindOrder(b),
  );
  return `全套 · ${kinds.map((kind) => contentKindLabel(kind)).join(" · ")}`;
}

function kindOrder(kind: ContentKind): number {
  const index = CONTENT_KIND_ORDER.indexOf(kind);
  return index < 0 ? 99 : index;
}

function initialView(): View {
  if (typeof window === "undefined") return "month";
  return window.innerWidth < 640 ? "agenda" : "month";
}

function prefersTapMove(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function CalendarPage() {
  const projects = useStudio((s) => s.projects);
  const campaigns = useStudio((s) => s.campaigns);
  const setSchedule = useStudio((s) => s.setSchedule);
  const applySchedule = useStudio((s) => s.applySchedule);
  const updateWave = useStudio((s) => s.updateWave);
  const waiting = useMemo(() => unscheduledDonePacks(projects), [projects]);
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<View>(initialView);
  const [drag, setDrag] = useState<MoveTarget | null>(null);
  const [pick, setPick] = useState<MoveTarget | null>(null);
  const [tapMove] = useState(prefersTapMove);

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
    const upcoming = items.filter((item) => item.at >= from);
    const contents = upcoming.filter((item): item is Extract<DayItem, { type: "content" }> => item.type === "content");
    const others = upcoming.filter((item) => item.type !== "content");
    return [...groupSameNightPacks(contents), ...others].sort((a, b) => a.at - b.at).slice(0, 30);
  }, [items]);

  function itemsOn(day: Date) {
    return items.filter((item) => isSameDay(item.at, day));
  }

  function cellsOn(day: Date): CellItem[] {
    const raw = itemsOn(day);
    const contents = raw.filter((item): item is Extract<DayItem, { type: "content" }> => item.type === "content");
    const others = raw.filter((item) => item.type !== "content");
    return [...groupSameNightPacks(contents), ...others].sort((a, b) => a.at - b.at);
  }

  function stampOnDay(project: Project, day: Date): number {
    const prev = project.scheduledAt ? new Date(project.scheduledAt) : project.publishedAt ? new Date(project.publishedAt) : null;
    const next = new Date(day);
    next.setHours(prev?.getHours() ?? 19, prev?.getMinutes() ?? 0, 0, 0);
    return next.getTime();
  }

  function moveProject(projectId: string, day: Date) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const at = stampOnDay(project, day);
    setSchedule(project.id, at);
    setDrag(null);
    setPick(null);
    toast.success(`已改到 ${format(at, "M/d HH:mm")}`);
  }

  function movePack(ids: string[], day: Date) {
    const entries = ids.flatMap((id) => {
      const project = projects.find((item) => item.id === id);
      if (!project || project.status === "published") return [];
      return [{ projectId: id, at: stampOnDay(project, day) }];
    });
    if (!entries.length) {
      toast.info("這套已經發出去了，改期不會動它。");
      return;
    }
    applySchedule(entries);
    setDrag(null);
    setPick(null);
    toast.success(`全套改到 ${format(day, "M/d")}，同一晚一起發。`);
  }

  function moveWave(campaignId: string, waveId: string, day: Date) {
    const campaign = campaigns.find((item) => item.id === campaignId);
    if (!campaign) return;
    const offset = offsetDaysFromEventDate(campaign.date, day.getTime());
    if (offset == null) {
      toast.info("這場活動還沒定日期，節奏沒辦法改期。");
      return;
    }
    updateWave(campaignId, waveId, { offsetDays: offset });
    setDrag(null);
    setPick(null);
    toast.success(`節奏改到 ${format(day, "M/d")}`);
  }

  function dropOn(day: Date) {
    const target = drag ?? pick;
    if (!target) return;
    if (target.kind === "content") moveProject(target.id, day);
    else if (target.kind === "pack") movePack(target.ids, day);
    else moveWave(target.campaignId, target.waveId, day);
  }

  function runAutoSchedule() {
    const suggestions = suggestSchedule(projects, campaigns);
    if (!suggestions.length) {
      toast.info("沒有可以排的內容。先把活動節奏或完成的稿準備好。");
      return;
    }
    const count = applySchedule(suggestions);
    toast.success(`已依宣傳節奏排了 ${count} 則，同一套會排在同一晚。`);
  }

  const pickedLabel = (() => {
    if (!pick) return null;
    if (pick.kind === "content") return projects.find((p) => p.id === pick.id)?.name ?? null;
    if (pick.kind === "pack") {
      const first = projects.find((item) => item.id === pick.ids[0]);
      return first ? packChipLabel(pick.ids.flatMap((id) => projects.filter((item) => item.id === id))) : "全套";
    }
    const campaign = campaigns.find((item) => item.id === pick.campaignId);
    return campaign?.waves.find((wave) => wave.id === pick.waveId)?.title ?? campaign?.name ?? null;
  })();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="排程"
        title="內容日曆"
        description="只服務創作與發布：什麼時候發、發什麼型態。沒有負責人，也沒有審核流程。"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={runAutoSchedule}>
              <Sparkles className="size-4" />
              依宣傳節奏排程
            </Button>
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
          </div>
        }
      />

      {pickedLabel ? (
        <p className="mt-4 rounded-xl bg-surface px-3 py-2 text-xs text-muted shadow-[var(--shadow-border)]">
          已選「{pickedLabel}」。點一個日期改過去。
          <button type="button" className="ml-2 underline" onClick={() => setPick(null)}>
            取消
          </button>
        </p>
      ) : null}

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

      {view === "agenda" ? (
        <AgendaList
          items={agenda}
          onRescheduleContent={(projectId, day) => moveProject(projectId, day)}
          onReschedulePack={(ids, day) => movePack(ids, day)}
          onRescheduleWave={(campaignId, waveId, day) => moveWave(campaignId, waveId, day)}
        />
      ) : (
        <>
          <div className={cn(view === "week" && "overflow-x-auto")}>
            <div className={cn(view === "week" && "min-w-xl sm:min-w-0")}>
              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted">
                {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div
                data-testid={view === "week" ? "calendar-week" : "calendar-month"}
                className="mt-1 grid grid-cols-7 gap-1"
              >
            {days.map((day) => {
              const dayCells = cellsOn(day);
              const dim = view === "month" && !isSameMonth(day, cursor);
              const cap = view === "week" ? 8 : 3;
              return (
                <div
                  key={day.toISOString()}
                  onDragOver={(e) => {
                    if (drag) e.preventDefault();
                  }}
                  onDrop={() => dropOn(day)}
                  onClick={(e) => {
                    if (!pick) return;
                    if ((e.target as HTMLElement).closest("a")) return;
                    dropOn(day);
                  }}
                  className={cn(
                    "rounded-xl p-1.5 shadow-[var(--shadow-border)] transition-shadow",
                    view === "week" ? "glass min-h-40 sm:min-h-52" : "min-h-24 bg-surface sm:min-h-28",
                    dim && "opacity-45",
                    isSameDay(day, new Date()) && "ring-2 ring-ring",
                    (drag || pick) && "hover:shadow-[var(--shadow-lift)]",
                  )}
                >
                  <p className="px-0.5 text-xs tabular-nums text-muted">
                    {view === "week" ? format(day, "M/d", { locale: zhTW }) : format(day, "d")}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {dayCells.slice(0, cap).map((item) => (
                      <li key={keyOf(item)}>
                        <CalendarChip
                          item={item}
                          selected={isCellSelected(item, pick)}
                          tapMove={tapMove}
                          onDragStart={setDrag}
                          onPick={setPick}
                        />
                      </li>
                    ))}
                    {dayCells.length > cap ? (
                      <li className="px-1 text-xs text-subtle">+{dayCells.length - cap}</li>
                    ) : null}
                  </ul>
                </div>
              );
            })}
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-subtle">
            {tapMove
              ? "點一則內容、全套或灰色節奏再點日期就能改期。"
              : view === "week"
                ? "這一週七欄。已排程的內容可以拖到別天，同一套拖過去就整晚一起改。"
                : "已排程的內容和還沒建立的節奏都可以拖到別的日期。同一套會併成一格，拖過去就整晚一起改。手機點再點日期也能改。"}
          </p>
        </>
      )}

      {waiting.length ? (
        <section className="mt-6">
          <SectionHeader title="完成了、還沒排" hint="同一則做成的全套會併成一列。排這套、或複製文案下載圖就能發。" />
          <ul className="grid gap-3 lg:grid-cols-2">
            {waiting.map((row) => (
              <li key={row.rootId} className="min-w-0 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to="/studio/$projectId"
                    params={{ projectId: row.primary.id }}
                    className="min-w-0"
                  >
                    <span className="block truncate text-sm font-medium">{row.primary.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {row.pack.length > 1
                        ? row.pack.map((item) => contentKindLabel(item.contentKind)).join("、")
                        : contentKindLabel(row.primary.contentKind)}
                    </span>
                  </Link>
                  <StatusBadge status={row.primary.status} />
                </div>
                {row.pack.length > 1 ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <PackFlowBar projectId={row.primary.id} />
                    <DownloadPackButton projectId={row.primary.id} size="sm" variant="secondary" />
                  </div>
                ) : null}
                <PostPackBar
                  copy={row.primary.copy}
                  kind={row.primary.contentKind}
                  projectId={row.primary.id}
                  variant="compact"
                  className="mt-3 pt-2"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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

function keyOf(item: CellItem): string {
  if (item.type === "content") return `c_${item.project.id}`;
  if (item.type === "pack") return `p_${item.rootId}_${item.at}`;
  if (item.type === "wave") return `w_${item.waveId}`;
  return `e_${item.campaign.id}`;
}

function isCellSelected(item: CellItem, pick: MoveTarget | null): boolean {
  if (!pick) return false;
  if (item.type === "pack" && pick.kind === "pack") {
    return pick.ids.some((id) => item.members.some((member) => member.id === id));
  }
  if (item.type === "content" && pick.kind === "content") return pick.id === item.project.id;
  if (item.type === "wave" && pick.kind === "wave") return pick.waveId === item.waveId;
  return false;
}

function CalendarChip({
  item,
  selected,
  tapMove,
  onDragStart,
  onPick,
}: {
  item: CellItem;
  selected?: boolean;
  tapMove?: boolean;
  onDragStart: (target: MoveTarget | null) => void;
  onPick: (target: MoveTarget) => void;
}) {
  if (item.type === "event") {
    return (
      <Link
        to="/campaigns/$campaignId"
        params={{ campaignId: item.campaign.id }}
        className="block truncate rounded-lg bg-[color-mix(in_oklab,var(--color-warm)_28%,transparent)] px-1.5 py-1 text-xs font-medium"
      >
        {item.campaign.name || "活動"}
      </Link>
    );
  }
  if (item.type === "wave") {
    const target: MoveTarget = { kind: "wave", campaignId: item.campaign.id, waveId: item.waveId };
    return (
      <Link
        to="/campaigns/$campaignId"
        params={{ campaignId: item.campaign.id }}
        draggable={!tapMove}
        onDragStart={() => onDragStart(target)}
        onDragEnd={() => onDragStart(null)}
        onClick={(e) => {
          e.stopPropagation();
          if (!tapMove && !e.metaKey && !e.ctrlKey) return;
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          onPick(target);
        }}
        className={cn(
          "block truncate rounded-lg px-1.5 py-1 text-xs text-muted",
          selected && "bg-accent text-accent-fg",
        )}
        title={tapMove ? "點選後再點日期改期" : `${item.stage}·${item.title}（還沒建立，可拖去改期）`}
      >
        {item.title || item.stage}
      </Link>
    );
  }
  if (item.type === "pack") {
    const primary = item.members.find((member) => member.id === item.rootId) ?? item.members[0]!;
    const target: MoveTarget = { kind: "pack", ids: item.members.map((member) => member.id) };
    const label = packChipLabel(item.members);
    return (
      <Link
        to="/studio/$projectId"
        params={{ projectId: primary.id }}
        draggable={!tapMove}
        onDragStart={() => onDragStart(target)}
        onDragEnd={() => onDragStart(null)}
        onClick={(e) => {
          e.stopPropagation();
          if (!tapMove && !e.metaKey && !e.ctrlKey) return;
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          onPick(target);
        }}
        className={cn(
          "block truncate rounded-lg px-1.5 py-1 text-xs font-medium",
          selected
            ? "bg-accent text-accent-fg"
            : "bg-[color-mix(in_oklab,var(--color-clear)_22%,transparent)]",
        )}
        title={tapMove ? "點選後再點日期，全套一起改期" : `${primary.name} · ${label}`}
      >
        {label}
      </Link>
    );
  }
  const target: MoveTarget = { kind: "content", id: item.project.id };
  return (
    <Link
      to="/studio/$projectId"
      params={{ projectId: item.project.id }}
      draggable={!tapMove}
      onDragStart={() => onDragStart(target)}
      onDragEnd={() => onDragStart(null)}
      onClick={(e) => {
        e.stopPropagation();
        if (!tapMove && !e.metaKey && !e.ctrlKey) return;
        if (e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        onPick(target);
      }}
      className={cn(
        "block truncate rounded-lg px-1.5 py-1 text-xs font-medium",
        selected
          ? "bg-accent text-accent-fg"
          : "bg-[color-mix(in_oklab,var(--color-clear)_22%,transparent)]",
      )}
      title={tapMove ? "點選後再點日期改期" : item.project.name}
    >
      {contentKindLabel(item.project.contentKind)}
    </Link>
  );
}

function AgendaPackCard({
  item,
  onReschedulePack,
}: {
  item: PackDayItem;
  onReschedulePack: (ids: string[], day: Date) => void;
}) {
  const primary = item.members.find((member) => member.id === item.rootId) ?? item.members[0]!;
  const ids = item.members.map((member) => member.id);
  const kinds = [...new Set(item.members.map((member) => member.contentKind))].sort(
    (a, b) => kindOrder(a) - kindOrder(b),
  );
  return (
    <>
      <div className="flex items-center gap-3">
        <label className="w-16 shrink-0 text-xs tabular-nums text-muted">
          <span className="block">{format(item.at, "M/d")}</span>
          <span className="block text-subtle">{format(item.at, "HH:mm")}</span>
          <input
            type="date"
            aria-label={`改期 ${packChipLabel(item.members)}`}
            value={format(item.at, "yyyy-MM-dd")}
            onChange={(e) => {
              if (!e.target.value) return;
              onReschedulePack(ids, new Date(`${e.target.value}T00:00:00`));
            }}
            className="mt-1 w-full min-h-8 rounded-lg bg-surface-2 px-1 text-xs text-fg"
          />
        </label>
        <Link to="/studio/$projectId" params={{ projectId: primary.id }} className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{primary.name}</span>
          <span className="block truncate text-xs text-muted">{packChipLabel(item.members)}</span>
        </Link>
        <StatusBadge status={primary.status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {kinds.map((kind) => {
          const member = item.members.find((entry) => entry.contentKind === kind) ?? primary;
          return (
            <Link
              key={member.id}
              to="/studio/$projectId"
              params={{ projectId: member.id }}
              className="inline-flex min-h-9 items-center rounded-full bg-surface-2 px-3 text-xs text-muted"
            >
              {contentKindLabel(kind)}
            </Link>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PackFlowBar projectId={primary.id} />
        <DownloadPackButton projectId={primary.id} size="sm" variant="secondary" />
      </div>
      <PostPackBar
        copy={primary.copy}
        kind={primary.contentKind}
        projectId={primary.id}
        variant="compact"
        className="mt-3 pt-2"
      />
    </>
  );
}

function AgendaList({
  items,
  onRescheduleContent,
  onReschedulePack,
  onRescheduleWave,
}: {
  items: CellItem[];
  onRescheduleContent: (projectId: string, day: Date) => void;
  onReschedulePack: (ids: string[], day: Date) => void;
  onRescheduleWave: (campaignId: string, waveId: string, day: Date) => void;
}) {
  if (!items.length) return null;
  return (
    <ul className="mt-6 space-y-2">
      {items.map((item) => (
        <li key={keyOf(item)} className="rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
          {item.type === "pack" ? (
            <AgendaPackCard item={item} onReschedulePack={onReschedulePack} />
          ) : item.type === "content" ? (
            <>
            <div className="flex items-center gap-3">
              <label className="w-16 shrink-0 text-xs tabular-nums text-muted">
                <span className="block">{format(item.at, "M/d")}</span>
                <span className="block text-subtle">{format(item.at, "HH:mm")}</span>
                <input
                  type="date"
                  aria-label={`改期 ${item.project.name}`}
                  value={format(item.at, "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    onRescheduleContent(item.project.id, new Date(`${e.target.value}T00:00:00`));
                  }}
                  className="mt-1 w-full min-h-8 rounded-lg bg-surface-2 px-1 text-xs text-fg"
                />
              </label>
              <Link
                to="/studio/$projectId"
                params={{ projectId: item.project.id }}
                className="min-w-0 flex-1"
              >
                <span className="block truncate text-sm font-medium">{item.project.name}</span>
                <span className="block truncate text-xs text-muted">
                  {contentKindLabel(item.project.contentKind)}
                </span>
              </Link>
              <StatusBadge status={item.project.status} />
            </div>
            {item.project.status === "scheduled" || item.project.status === "done" ? (
              <PostPackBar
                copy={item.project.copy}
                kind={item.project.contentKind}
                projectId={item.project.id}
                variant="compact"
                className="mt-3"
              />
            ) : null}
            </>
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
            <div className="flex items-center gap-3">
              <label className="w-16 shrink-0 text-xs tabular-nums text-subtle">
                <span className="block">{format(item.at, "M/d")}</span>
                <span className="block">節奏</span>
                <input
                  type="date"
                  aria-label={`改期 ${item.title || item.stage}`}
                  value={format(item.at, "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    onRescheduleWave(item.campaign.id, item.waveId, new Date(`${e.target.value}T00:00:00`));
                  }}
                  className="mt-1 w-full min-h-8 rounded-lg bg-surface-2 px-1 text-xs text-fg"
                />
              </label>
              <Link
                to="/campaigns/$campaignId"
                params={{ campaignId: item.campaign.id }}
                className="min-w-0 flex-1"
              >
                <span className="block truncate text-sm">{item.title}</span>
                <span className="block truncate text-xs text-subtle">{item.stage}·還沒建立</span>
              </Link>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
