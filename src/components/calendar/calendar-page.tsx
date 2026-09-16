import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { addDays, format, isSameDay, startOfMonth, startOfWeek, endOfMonth, endOfWeek } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { runPublishItem } from "@/lib/connect/publish-item";
import { igMemoryFromSchedule } from "@/lib/zen/memory";
import { formatTaipeiClock } from "@/lib/zen/dates";
import { agendaSorted, firstPublishable, isDue } from "@/lib/zen/schedule";
import { campaignsForCalendar, hasLiveEventCampaign, scheduleForCampaign } from "@/lib/studio/calendar-search";
import { igSearchParams } from "@/lib/studio/ig-search";
import { contentKindLabel, contentStatusLabel } from "@/lib/studio/content";
import { uid } from "@/lib/studio/ids";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";
import { AssetMedia } from "@/components/shared/asset-media";
import { previewMediaId } from "@/lib/ai/reels-asset";
import { ScheduleEditor } from "@/components/calendar/schedule-editor";

type View = "month" | "week" | "agenda";

export function CalendarPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { campaign?: string };
  const hydrated = useStudio((s) => s.hydrated);
  const scheduleAll = useStudio((s) => s.schedule);
  const campaigns = useStudio((s) => s.campaigns);
  const moveSchedule = useStudio((s) => s.moveSchedule);
  const upsertSchedule = useStudio((s) => s.upsertSchedule);
  const publishSchedule = useStudio((s) => s.publishSchedule);
  const setCreateOpen = useUi((s) => s.setCreateOpen);
  const campaignId = search.campaign;
  const focused = campaigns.find((row) => row.id === campaignId);
  const hideSeed = !campaignId && hasLiveEventCampaign(campaigns);
  const schedule = useMemo(
    () => scheduleForCampaign(scheduleAll, campaignId, { hideSeed }),
    [scheduleAll, campaignId, hideSeed],
  );
  const visibleCampaigns = useMemo(() => campaignsForCalendar(campaigns, campaignId), [campaigns, campaignId]);
  const urls = useAssetUrls(
    schedule.flatMap((item) => [item.imageAssetId, item.videoAssetId]).filter((id): id is string => Boolean(id)),
  );
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<View>("agenda");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      setView("agenda");
      return;
    }
    if (window.matchMedia("(min-width: 768px)").matches) setView("month");
  }, [campaignId]);

  useEffect(() => {
    if (!focused?.date) return;
    const next = new Date(`${focused.date}T12:00:00+08:00`);
    if (!Number.isNaN(next.getTime())) setCursor(next);
  }, [focused?.date]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const list: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) list.push(d);
    return list;
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  function itemsOn(day: Date) {
    return schedule.filter((item) => isSameDay(item.scheduledAt, day));
  }

  function dropOn(day: Date, raw: string) {
    const item = schedule.find((row) => row.id === raw);
    if (!item) return;
    const next = new Date(day);
    const prev = new Date(item.scheduledAt);
    next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
    moveSchedule(item.id, next.getTime());
  }

  function shiftDay(id: string, days: number) {
    const item = schedule.find((row) => row.id === id);
    if (!item || item.status === "published") return;
    moveSchedule(item.id, item.scheduledAt + days * 86_400_000);
  }

  function duplicate(id: string) {
    const item = schedule.find((row) => row.id === id);
    if (!item) return;
    upsertSchedule({
      ...item,
      id: uid("sch"),
      title: `${item.title} · 複製`,
      status: "idea",
      scheduledAt: addDays(item.scheduledAt, 1).getTime(),
    });
  }

  async function publishItem(id: string) {
    const item = schedule.find((row) => row.id === id);
    if (!item) return;
    setPublishingId(id);
    try {
      const result = await runPublishItem(item);
      toast.message(result.note);
      if (result.marked) {
        publishSchedule(item.id, result.extra);
        const memory = igMemoryFromSchedule({
          ...item,
          status: "published",
          publishedAt: Date.now(),
          permalink: result.extra?.permalink ?? item.permalink,
          mediaUrl: result.extra?.mediaUrl ?? item.mediaUrl,
          igMediaId: result.extra?.igMediaId ?? item.igMediaId,
        });
        toast.success("已寫進過去 IG");
        void navigate({
          to: "/ig",
          search: igSearchParams({ posted: memory.id, campaign: item.campaignId ?? campaignId }),
        });
      }
    } finally {
      setPublishingId(null);
    }
  }

  const cells = view === "month" ? days : weekDays;
  const agenda = useMemo(() => agendaSorted(schedule), [schedule]);
  const publishTarget = firstPublishable(agenda);

  if (!hydrated) {
    return (
      <main data-testid="calendar-loading" className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-6 md:px-8 md:py-10">
        <PageHeader kicker="排程" title="什麼時候要發？" description="讀取排程…" />
      </main>
    );
  }

  return (
    <main data-testid="calendar-ready" className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-6 pb-nav md:px-8 md:py-10">
      <PageHeader
        kicker="排程"
        title={focused ? `什麼時候發「${focused.name}」？` : "什麼時候要發？"}
        description={
          focused
            ? "只看這一場。沒有負責人、沒有審核。拖曳可改日期。"
            : "只服務創作與發布。沒有負責人、沒有審核。拖曳可改日期。"
        }
        actions={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            快速新增
          </Button>
        }
      />

      {focused ? (
        <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="calendar-campaign">
          <p className="text-sm">只看 {focused.name}</p>
          <Button size="sm" variant="secondary" asChild>
            <Link to="/calendar" search={{}}>
              看全部
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {(["month", "week", "agenda"] as View[]).map((id) => (
          <Button key={id} size="sm" variant={view === id ? "default" : "secondary"} onClick={() => setView(id)}>
            {id === "month" ? "月" : id === "week" ? "週" : "Agenda"}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => setCursor(addDays(cursor, view === "month" ? -30 : -7))}>
          上一段
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setCursor(addDays(cursor, view === "month" ? 30 : 7))}>
          下一段
        </Button>
      </div>

      {view !== "agenda" ? (
        <div className={cn("mt-4 grid gap-1", view === "month" ? "grid-cols-7" : "grid-cols-1 md:grid-cols-7")}>
          {cells.map((day) => {
            const items = itemsOn(day);
            const visible = view === "month" ? items.slice(0, 3) : items;
            const hidden = items.length - visible.length;
            return (
              <div
                key={day.toISOString()}
                className="min-h-24 min-w-0 overflow-y-auto rounded-xl bg-surface p-2 shadow-[var(--shadow-border)]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  dropOn(day, e.dataTransfer.getData("text/plain"));
                }}
              >
                <p className="text-xs text-muted">{format(day, view === "month" ? "d" : "M/d EEE", { locale: zhTW })}</p>
                <ul className="mt-1 space-y-1">
                  {visible.map((item) => (
                    <li key={item.id}>
                      <div
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
                        className="w-full rounded-lg bg-surface-2 px-2 py-1 text-left text-[11px] leading-snug"
                      >
                        <p className="truncate">
                          {contentKindLabel(item.kind)} · {item.title}
                        </p>
                        {view !== "month" && previewMediaId(item) && urls[previewMediaId(item)!] ? (
                          <AssetMedia
                            src={urls[previewMediaId(item)!]}
                            video={Boolean(item.videoAssetId && previewMediaId(item) === item.videoAssetId)}
                            alt=""
                            testId="schedule-thumb"
                            className="mt-1 size-10 rounded-lg object-cover"
                          />
                        ) : null}
                        {view === "month" && previewMediaId(item) && urls[previewMediaId(item)!] ? (
                          <AssetMedia
                            src={urls[previewMediaId(item)!]}
                            video={Boolean(item.videoAssetId && previewMediaId(item) === item.videoAssetId)}
                            alt=""
                            testId="schedule-thumb"
                            className="mt-1 size-6 rounded-md object-cover"
                          />
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-1">
                          <button type="button" className="min-h-8 text-[10px] text-muted" onClick={() => duplicate(item.id)}>
                            複製
                          </button>
                          <button type="button" className="min-h-8 text-[10px] text-muted" onClick={() => setEditingId(item.id)}>
                            編輯
                          </button>
                          {view !== "month" ? (
                            <button
                              type="button"
                              className="min-h-8 text-xs text-muted"
                              disabled={publishingId === item.id}
                              onClick={() => void publishItem(item.id)}
                            >
                              發布
                            </button>
                          ) : null}
                          <Link
                            to="/create"
                            search={{ mode: "idea", idea: item.caption || item.title }}
                            className="inline-flex min-h-8 items-center text-[10px] text-accent"
                          >
                            AI 延伸
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {hidden > 0 ? <p className="mt-1 text-[10px] text-muted">還有 {hidden} 則</p> : null}
              </div>
            );
          })}
        </div>
      ) : (
        <ul data-testid="calendar-agenda" className="mt-4 space-y-2 pb-8">
          {agenda.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex gap-3 rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]",
                  isDue(item) && "ring-1 ring-amber/40",
                )}
              >
                {previewMediaId(item) && urls[previewMediaId(item)!] ? (
                  <AssetMedia
                    src={urls[previewMediaId(item)!]}
                    video={Boolean(item.videoAssetId && previewMediaId(item) === item.videoAssetId)}
                    alt=""
                    testId="schedule-thumb"
                    className="size-14 shrink-0 rounded-xl object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                <p className="text-sm" data-testid="agenda-title">
                  {item.title}
                </p>
                {item.caption ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted" data-testid="schedule-caption">
                    {item.caption}
                  </p>
                ) : null}
                <p className="text-xs text-muted" data-testid="agenda-when">
                  {formatTaipeiClock(item.scheduledAt)} · {contentKindLabel(item.kind)} · {contentStatusLabel(item.status)}
                  {isDue(item) ? (
                    <span
                      data-testid={item.id === agenda.find((row) => isDue(row))?.id ? "calendar-due" : undefined}
                      className="ml-2 inline-flex rounded-full bg-amber/20 px-2 py-0.5 text-[10px] text-warn"
                    >
                      現在可以發
                    </span>
                  ) : null}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => duplicate(item.id)}>
                    複製
                  </Button>
                  {item.status !== "published" ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="min-h-11"
                        data-testid={item.id === agenda.find((row) => row.status === "scheduled")?.id ? "agenda-shift-earlier" : undefined}
                        onClick={() => shiftDay(item.id, -1)}
                      >
                        前一天
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="min-h-11"
                        data-testid={item.id === agenda.find((row) => row.status === "scheduled")?.id ? "agenda-shift-later" : undefined}
                        onClick={() => shiftDay(item.id, 1)}
                      >
                        後一天
                      </Button>
                    </>
                  ) : null}
                  <Button
                    size="sm"
                    variant="secondary"
                    data-testid={item.id === agenda.find((row) => row.status === "scheduled")?.id ? "calendar-edit" : undefined}
                    onClick={() => setEditingId(item.id)}
                  >
                    直接編輯
                  </Button>
                  <Button
                    size="sm"
                    disabled={publishingId === item.id || item.status === "published"}
                    data-testid={
                      item.id === publishTarget?.id
                        ? "calendar-publish"
                        : item.kind === "reels"
                          ? "calendar-reels-publish"
                          : item.kind === "story" || item.kind === "countdown"
                            ? "calendar-story-publish"
                            : undefined
                    }
                    onClick={() => void publishItem(item.id)}
                    className="min-h-11"
                  >
                    發布到 IG
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => publishSchedule(item.id)}
                  >
                    標記已發布
                  </Button>
                  <Button size="sm" variant="secondary" asChild>
                    <Link to="/create" search={{ mode: "idea", idea: item.caption || item.title }}>
                      AI 延伸
                    </Link>
                  </Button>
                </div>
                </div>
              </li>
            ))}
        </ul>
      )}

      {editingId ? (
        <div className="mt-6">
          {(() => {
            const item = schedule.find((row) => row.id === editingId);
            if (!item) return null;
            return (
              <ScheduleEditor
                item={item}
                onSave={(next) => {
                  upsertSchedule(next);
                  setEditingId(null);
                }}
                onClose={() => setEditingId(null)}
              />
            );
          })()}
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="text-sm font-medium">活動</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {visibleCampaigns.map((c) => (
            <li key={c.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="text-xs text-muted">
                {c.date} {c.time}
              </p>
              <p className="mt-1 font-medium">{c.name}</p>
              <p className="mt-1 text-sm text-muted" data-testid="campaign-oneliner">
                {c.oneLiner}
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <Link
                  to="/calendar"
                  search={{ campaign: c.id }}
                  className="text-sm text-accent"
                >
                  只看這場
                </Link>
                <Link
                  to="/create"
                  search={{ mode: "campaign", idea: c.name, campaign: c.id }}
                  className="text-sm text-accent"
                >
                  AI 延伸
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
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
