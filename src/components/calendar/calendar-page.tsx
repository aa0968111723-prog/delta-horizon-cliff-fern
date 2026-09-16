import { addDays, format, startOfMonth, startOfWeek } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarThumb } from "@/components/calendar/calendar-thumb";
import { DuePublishBar } from "@/components/calendar/due-publish-bar";
import { PublishButton } from "@/components/create/publish-button";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { calendarCoverIds, calendarFrom, rescheduleCalendarItem } from "@/lib/creative/calendar";
import { createSearchForCalendarItem, displayDay } from "@/lib/creative/schedule";
import { contentKindLabel } from "@/lib/studio/content";
import { STATUS_META } from "@/lib/studio/status";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "@/lib/creative/types";

export function CalendarPage({ focusDay }: { focusDay?: string }) {
  const campaigns = useCreative((s) => s.campaigns);
  const duplicateWave = useCreative((s) => s.duplicateWave);
  const projects = useStudio((s) => s.projects);
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(() => (focusDay ? new Date(`${focusDay}T12:00:00+08:00`) : new Date()));
  const [view, setView] = useState<"month" | "week" | "agenda">("agenda");
  const items = calendarFrom(campaigns, projects);
  const urls = useAssetUrls(calendarCoverIds(items));
  const focusProjectId = focusDay
    ? items.find((item) => item.date === focusDay && item.kind !== "event" && item.projectId)?.projectId
    : undefined;

  useEffect(() => {
    if (!focusDay) return;
    setCursor(new Date(`${focusDay}T12:00:00+08:00`));
  }, [focusDay]);

  useEffect(() => {
    if (!focusDay) return;
    const el = document.getElementById(`cal-day-${focusDay}`);
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    el?.scrollIntoView({ block: mobile ? "start" : "center", behavior: "smooth" });
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
    const result = rescheduleCalendarItem({ campaigns, itemId, dateIso });
    if (!result) return;
    useCreative.setState({ campaigns: result.campaigns });
    if (result.projectId) {
      useStudio.getState().updateProject(result.projectId, { scheduledAt: result.scheduledAt });
    }
  }

  function extend(item: CalendarItem) {
    void navigate({
      to: "/create",
      search: { q: `延續：${item.title}`, go: "1", campaign: item.campaignId },
    });
  }

  function createWave(item: CalendarItem) {
    const name = campaigns.find((campaign) => campaign.id === item.campaignId)?.name;
    const search = createSearchForCalendarItem(item, name);
    if (!search) return false;
    void navigate({ to: "/create", search });
    return true;
  }

  function openItem(item: CalendarItem) {
    if (item.projectId) {
      void navigate({ to: "/ig", search: { item: item.projectId } });
      return;
    }
    if (createWave(item)) return;
    if (item.campaignId) {
      void navigate({ to: "/campaigns/$campaignId", params: { campaignId: item.campaignId } });
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10" data-calendar="">
      <p className="text-xs tracking-[0.18em] text-muted uppercase">排程</p>
      <h1 className="mt-1 font-display text-3xl">什麼時候發</h1>
      <p className="mt-2 text-sm text-muted">只服務創作與發布。沒有審核人。桌面可拖曳改日期。</p>
      {focusDay ? (
        <p className="mt-3 rounded-2xl bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]">
          這次排在 {displayDay(focusDay)}。Agenda 會亮出來，週視圖從這週看。
          {focusProjectId ? (
            <>
              {" "}
              <Link
                to="/ig"
                search={{ item: focusProjectId }}
                className="text-accent underline-offset-2 hover:underline"
              >
                去 IG 看 Grid
              </Link>
            </>
          ) : null}
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
          <Link data-cal-quick="" to="/create" search={{ day: focusDay || format(cursor, "yyyy-MM-dd") }}>
            快速新增
          </Link>
        </Button>
      </div>

      <DuePublishBar />

      {view === "agenda" ? (
        <ul className="mt-6 space-y-2 pb-28 md:pb-0">
          {items.map((item) => (
            <AgendaRow
              key={item.id}
              item={item}
              urls={urls}
              focused={Boolean(focusDay && item.date === focusDay && item.kind !== "event")}
              onExtend={() => extend(item)}
              onCopy={() => item.campaignId && item.waveId && duplicateWave(item.campaignId, item.waveId)}
              onCreate={() => createWave(item)}
              onReschedule={(dateIso) => onDrop(dateIso, item.waveId ?? item.id)}
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
                      <li key={item.id}>
                        <CalChip
                          item={item}
                          urls={urls}
                          focused={Boolean(focusDay && item.date === focusDay && item.kind !== "event")}
                          onOpen={() => openItem(item)}
                        />
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
                      <li key={item.id}>
                        <CalChip
                          item={item}
                          urls={urls}
                          dense
                          focused={Boolean(focusDay && item.date === focusDay && item.kind !== "event")}
                          onOpen={() => openItem(item)}
                        />
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}

      {view === "month" ? (
        <ul className="mt-6 space-y-2 pb-28 md:hidden">
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
                      <MobileTitle item={item} urls={urls} />
                      <ItemActions
                        item={item}
                        onExtend={() => extend(item)}
                        onCreate={() => createWave(item)}
                        onReschedule={(dateIso) => onDrop(dateIso, item.waveId ?? item.id)}
                      />
                    </div>
                  ))}
                </li>
              );
            })}
        </ul>
      ) : null}

      {view === "week" ? (
        <ul className="mt-6 space-y-2 pb-28 md:hidden">
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
                      <MobileTitle item={item} urls={urls} />
                      <ItemActions
                        item={item}
                        onExtend={() => extend(item)}
                        onCopy={
                          item.campaignId && item.waveId
                            ? () => duplicateWave(item.campaignId!, item.waveId!)
                            : undefined
                        }
                        onCreate={() => createWave(item)}
                        onReschedule={(dateIso) => onDrop(dateIso, item.waveId ?? item.id)}
                      />
                    </div>
                  ))
                ) : (
                  <p className="mt-1 text-xs text-subtle">
                    這天還沒排。{" "}
                    <Link to="/create" search={{ day: iso }} className="text-accent underline-offset-2 hover:underline">
                      這天發一篇
                    </Link>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </main>
  );
}

function CalChip({
  item,
  urls,
  focused,
  dense,
  onOpen,
}: {
  item: CalendarItem;
  urls: Record<string, string>;
  focused?: boolean;
  dense?: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
      onClick={onOpen}
      className={cn(
        "flex w-full cursor-grab items-center gap-1 rounded-lg text-left leading-tight",
        dense ? "px-1 py-1 text-sm" : "bg-surface-2 px-1.5 py-1 text-xs",
        focused && "ring-2 ring-primary",
      )}
    >
      <CalendarThumb item={item} urls={urls} size="sm" />
      <span className="min-w-0 truncate">{item.title}</span>
    </button>
  );
}

function MobileTitle({ item, urls }: { item: CalendarItem; urls: Record<string, string> }) {
  return (
    <div className="flex items-center gap-3">
      <CalendarThumb item={item} urls={urls} />
      <p className="min-w-0 flex-1 text-sm">{item.title}</p>
    </div>
  );
}

function AgendaRow({
  item,
  urls,
  focused,
  onExtend,
  onCopy,
  onCreate,
  onReschedule,
}: {
  item: CalendarItem;
  urls: Record<string, string>;
  focused?: boolean;
  onExtend: () => void;
  onCopy: () => void;
  onCreate: () => void;
  onReschedule: (dateIso: string) => void;
}) {
  return (
    <li
      id={focused ? `cal-day-${item.date}` : undefined}
      className={cn(
        "scroll-mt-4 scroll-mb-28 rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]",
        focused && "ring-2 ring-primary",
      )}
    >
      <p className="text-xs text-muted">{format(new Date(`${item.date}T12:00:00+08:00`), "M/d EEE", { locale: zhTW })}</p>
      <div className="mt-1 flex items-start gap-3">
        <CalendarThumb item={item} urls={urls} />
        <div className="min-w-0 flex-1">
          <p className="text-sm">{item.title}</p>
          <p className="text-xs text-subtle">
            {item.kind === "event" ? "活動" : contentKindLabel(item.kind)} · {STATUS_META[item.status].label}
            {item.publishedAt ? ` · 實際發布 ${format(item.publishedAt, "M/d HH:mm", { locale: zhTW })}` : ""}
            {item.kind !== "event" && item.status !== "published" && item.date <= format(new Date(), "yyyy-MM-dd")
              ? " · 該發了"
              : ""}
          </p>
        </div>
      </div>
      <ItemActions item={item} onExtend={onExtend} onCopy={onCopy} onCreate={onCreate} onReschedule={onReschedule} />
    </li>
  );
}

function ItemActions({
  item,
  onExtend,
  onCopy,
  onCreate,
  onReschedule,
}: {
  item: CalendarItem;
  onExtend: () => void;
  onCopy?: () => void;
  onCreate?: () => void;
  onReschedule?: (dateIso: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {!item.projectId && item.kind !== "event" && item.status !== "published" && onCreate ? (
        <Button size="sm" variant="secondary" onClick={onCreate}>
          生成這一波
        </Button>
      ) : null}
      <Button size="sm" variant="ghost" onClick={onExtend}>
        AI 延伸
      </Button>
      {onCopy ? (
        <Button size="sm" variant="ghost" onClick={onCopy}>
          複製
        </Button>
      ) : null}
      {item.kind !== "event" && item.status !== "published" && onReschedule ? (
        <label className="flex min-h-11 items-center gap-2 rounded-full bg-surface-2 px-3 text-xs text-muted">
          改日期
          <input
            type="date"
            value={item.date}
            aria-label={`改 ${item.title} 的日期`}
            className="min-h-11 min-w-[9.5rem] bg-transparent text-sm text-fg"
            onChange={(event) => {
              const next = event.target.value;
              if (next && next !== item.date) onReschedule(next);
            }}
          />
        </label>
      ) : null}
      {item.projectId ? (
        <Button asChild size="sm" variant="ghost">
          <Link to="/studio/$projectId" params={{ projectId: item.projectId }}>
            編輯
          </Link>
        </Button>
      ) : null}
      <IgPreviewLink projectId={item.projectId} />
      {item.status === "published" ? (
        <span className="self-center text-xs text-subtle" data-published-memory="">
          已進 Content Memory
        </span>
      ) : item.kind !== "event" ? (
        <PublishButton
          campaignId={item.campaignId}
          waveId={item.waveId}
          projectId={item.projectId}
          title={item.title}
        />
      ) : null}
    </div>
  );
}

function IgPreviewLink({ projectId }: { projectId?: string }) {
  return (
    <Button asChild size="sm" variant="ghost">
      {projectId ? (
        <Link to="/ig" search={{ item: projectId }}>
          IG Preview
        </Link>
      ) : (
        <Link to="/ig">IG Preview</Link>
      )}
    </Button>
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
  onBeginDrag,
  onEndDrag,
  onPick,
}: {
  item: CellItem;
  selected?: boolean;
  tapMove?: boolean;
  onBeginDrag: (target: MoveTarget, transfer: DataTransfer | null) => void;
  onEndDrag: () => void;
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
        data-testid="calendar-chip-wave"
        draggable={!tapMove}
        onDragStart={(e) => onBeginDrag(target, e.dataTransfer)}
        onDragEnd={onEndDrag}
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
        data-testid="calendar-chip-pack"
        draggable={!tapMove}
        onDragStart={(e) => onBeginDrag(target, e.dataTransfer)}
        onDragEnd={onEndDrag}
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
      data-testid="calendar-chip-content"
      draggable={!tapMove}
      onDragStart={(e) => onBeginDrag(target, e.dataTransfer)}
      onDragEnd={onEndDrag}
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
        <li key={keyOf(item)} className="rounded-2xl surface-card p-3">
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
