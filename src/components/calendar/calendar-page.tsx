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
import { agendaSorted, firstPublishable, isDue } from "@/lib/zen/schedule";
import { campaignsForCalendar, scheduleForCampaign } from "@/lib/studio/calendar-search";
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
  const schedule = useMemo(() => scheduleForCampaign(scheduleAll, campaignId), [scheduleAll, campaignId]);
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
    <main data-testid="calendar-ready" className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-6 md:px-8 md:py-10">
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
        <ul data-testid="calendar-agenda" className="mt-4 space-y-2">
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
                <p className="text-sm">{item.title}</p>
                {item.caption ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted" data-testid="schedule-caption">
                    {item.caption}
                  </p>
                ) : null}
                <p className="text-xs text-muted">
                  {format(item.scheduledAt, "M/d HH:mm", { locale: zhTW })} · {contentKindLabel(item.kind)} · {contentStatusLabel(item.status)}
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
