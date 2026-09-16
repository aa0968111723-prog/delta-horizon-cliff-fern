import { addDays, addWeeks, format, getDaysInMonth, startOfMonth, startOfWeek, addMonths, isSameDay, isSameMonth } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { zhTW } from "date-fns/locale";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PublishIgButton } from "@/components/instagram/publish-button";
import { openScheduledPreview } from "@/components/create/open-preview";
import { DueSlotActions } from "@/components/instagram/due-slot";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useAssetUrls, resolveAssetSrc } from "@/hooks/use-asset-urls";
import { generateCopyPack } from "@/lib/ai/copy";
import { uid } from "@/lib/studio/ids";
import type { ContentKind } from "@/lib/studio/types";
import { copyKindForContent } from "@/lib/zen/convert";
import { igDnaBlock } from "@/lib/zen/insights";
import { CONTENT_KIND_LABEL, type ScheduleItem } from "@/lib/zen/types";
import { isWaveScheduleItem, placeScheduleItems, pickFocusDay, rhythmHint, schedulePreviewAssetId, isDueScheduleItem, shiftScheduleDay } from "@/lib/zen/schedule";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

type Mode = "month" | "week" | "agenda";

const KIND_OPTIONS: ContentKind[] = [
  "ig-post",
  "carousel",
  "story",
  "reels",
  "threads",
  "line",
  "recap",
  "knowledge",
  "member-story",
  "countdown",
  "qa",
  "poll",
];

function toLocalInput(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function dayAtHour(day: Date, hours = 20, minutes = 0) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes).getTime();
}

function PhoneDayList({
  days,
  schedule,
  testId,
  cursor,
  onMove,
  onEdit,
}: {
  days: Date[];
  schedule: ScheduleItem[];
  testId: string;
  cursor: Date;
  onMove: (id: string, scheduledAt: number) => void;
  onEdit: (id: string) => void;
}) {
  const focusTs = pickFocusDay({ days: days.map((day) => day.getTime()), cursor: cursor.getTime() });
  const focusRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    focusRef.current?.scrollIntoView({ block: "center", inline: "nearest" });
  }, [focusTs, testId]);
  return (
    <ul className="mt-4 space-y-2 md:hidden" data-testid={testId}>
      {days.map((day) => {
        const items = schedule.filter((row) => isSameDay(row.scheduledAt, day));
        const focused = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime() === focusTs;
        return (
          <li
            key={day.toISOString()}
            ref={focused ? focusRef : undefined}
            data-testid={focused ? "cal-day-focus" : undefined}
            className={cn(
              "rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]",
              focused && "ring-2 ring-accent/40",
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/schedule-id");
              if (id) onMove(id, dayAtHour(day));
            }}
          >
            <p className="text-xs text-muted">
              {format(day, "M/d（EE）", { locale: zhTW })}
              {focused && isSameDay(day, new Date()) ? " · 今天" : ""}
            </p>
            {items.length ? (
              <ul className="mt-2 space-y-1">
                {items.map((item) => (
                  <li
                    key={item.id}
                    draggable
                    data-testid={isWaveScheduleItem(item) ? "schedule-wave" : "schedule-suite"}
                    onDragStart={(e) => e.dataTransfer.setData("text/schedule-id", item.id)}
                    onClick={() => onEdit(item.id)}
                    className={cn(
                      "min-h-11 rounded-md px-2 py-2 text-sm",
                      isWaveScheduleItem(item) ? "bg-bg/70 text-muted" : "bg-bg",
                    )}
                  >
                    {item.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted">這天還沒有內容</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function CalendarPage() {
  const navigate = useNavigate();
  const schedule = useCreative((s) => s.schedule);
  const igPosts = useCreative((s) => s.igPosts);
  const campaigns = useCreative((s) => s.campaigns);
  const assets = useStudio((s) => s.assets);
  const moveSchedule = useCreative((s) => s.moveSchedule);
  const upsertSchedule = useCreative((s) => s.upsertSchedule);
  const patchSchedule = useCreative((s) => s.patchSchedule);
  const duplicateSchedule = useCreative((s) => s.duplicateSchedule);
  const markPublished = useCreative((s) => s.markPublished);
  const [cursor, setCursor] = useState(new Date(2026, 8, 16));
  const [mode, setMode] = useState<Mode>("month");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickKind, setQuickKind] = useState<ContentKind>("ig-post");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [extendBusy, setExtendBusy] = useState<string | null>(null);
  const editing = schedule.find((item) => item.id === editingId);
  const previewIds = useMemo(
    () =>
      [
        ...new Set(
          schedule
            .map((item) => schedulePreviewAssetId(item, campaigns))
            .filter((id): id is string => Boolean(id)),
        ),
      ],
    [schedule, campaigns],
  );
  const urls = useAssetUrls(previewIds);

  useEffect(() => {
    if (window.matchMedia("(max-width: 640px)").matches) setMode("agenda");
  }, []);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(cursor);
    return Array.from({ length: getDaysInMonth(cursor) }, (_, i) => addDays(start, i));
  }, [cursor]);

  function moveToDay(id: string, scheduledAt: number) {
    moveSchedule(id, scheduledAt);
    toast.success(`已改到 ${format(scheduledAt, "M/d（EE）", { locale: zhTW })}`);
  }

  async function extendItem(id: string) {
    const item = schedule.find((row) => row.id === id);
    if (!item) return;
    setExtendBusy(id);
    try {
      const result = await generateCopyPack({
        data: {
          idea: `延續「${item.title}」。${item.captionPreview}`,
          kind: copyKindForContent(item.contentKind),
          dnaNotes: igDnaBlock(igPosts),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const [placed] = placeScheduleItems(schedule, [
        {
          id: uid("sch"),
          title: result.pack.hook,
          contentKind: item.contentKind === "ig-post" ? "story" : item.contentKind,
          status: "idea",
          scheduledAt: item.scheduledAt + 2 * 86_400_000,
          publishedAt: null,
          projectId: item.projectId,
          campaignId: item.campaignId,
          captionPreview: result.pack.body,
        },
      ]);
      if (placed) upsertSchedule(placed);
      toast.success("已延伸一則，錯開活動廣告夜");
    } finally {
      setExtendBusy(null);
    }
  }

  return (
    <main className="mx-auto w-full min-w-0 max-w-5xl overflow-x-hidden px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Calendar"
        title="排程"
        description={rhythmHint(schedule)}
        actions={
          <div className="flex gap-2">
            {(["month", "week", "agenda"] as const).map((id) => (
              <Button
                key={id}
                size="sm"
                variant={mode === id ? "default" : "secondary"}
                data-testid={`cal-mode-${id}`}
                onClick={() => setMode(id)}
              >
                {id === "month" ? "月" : id === "week" ? "週" : "Agenda"}
              </Button>
            ))}
          </div>
        }
      />
      <div className="mt-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setCursor(mode === "month" ? addMonths(cursor, -1) : addWeeks(cursor, -1))}
        >
          {mode === "month" ? "上月" : "上週"}
        </Button>
        <p className="font-display text-xl">{format(cursor, "yyyy年M月", { locale: zhTW })}</p>
        <Button variant="ghost" onClick={() => setCursor(mode === "month" ? addMonths(cursor, 1) : addWeeks(cursor, 1))}>
          {mode === "month" ? "下月" : "下週"}
        </Button>
      </div>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const title = quickTitle.trim();
          if (!title) return;
          const [placed] = placeScheduleItems(schedule, [
            {
              id: uid("sch"),
              title,
              contentKind: quickKind,
              status: "idea",
              scheduledAt: new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 20).getTime(),
              publishedAt: null,
              projectId: null,
              campaignId: null,
              captionPreview: title,
            },
          ]);
          if (placed) upsertSchedule(placed);
          setQuickTitle("");
        }}
      >
        <Input value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} placeholder="快速新增：今晚發什麼？" />
        <select
          className="h-11 rounded-md border border-border bg-surface px-3 text-sm"
          value={quickKind}
          onChange={(e) => setQuickKind(e.target.value as ContentKind)}
        >
          {KIND_OPTIONS.map((kind) => (
            <option key={kind} value={kind}>
              {CONTENT_KIND_LABEL[kind]}
            </option>
          ))}
        </select>
        <Button type="submit">加到這天</Button>
      </form>

      {editing ? (
        <form
          className="mt-4 space-y-3 rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-border)]"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const title = String(data.get("title") ?? "").trim();
            const captionPreview = String(data.get("caption") ?? "");
            const contentKind = String(data.get("kind") ?? editing.contentKind) as ContentKind;
            const when = String(data.get("when") ?? "");
            patchSchedule(editing.id, {
              title: title || editing.title,
              captionPreview,
              contentKind,
              scheduledAt: when ? new Date(when).getTime() : editing.scheduledAt,
              status: "creating",
            });
            setEditingId(null);
            toast.success("已更新這則排程");
          }}
        >
          <p className="text-xs text-muted">直接編輯</p>
          <Input name="title" defaultValue={editing.title} />
          <Textarea name="caption" defaultValue={editing.captionPreview} />
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              name="kind"
              defaultValue={editing.contentKind}
              className="h-11 rounded-md border border-border bg-surface px-3 text-sm"
            >
              {KIND_OPTIONS.map((kind) => (
                <option key={kind} value={kind}>
                  {CONTENT_KIND_LABEL[kind]}
                </option>
              ))}
            </select>
            <Input name="when" type="datetime-local" defaultValue={toLocalInput(editing.scheduledAt)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm">
              儲存
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                duplicateSchedule(editing.id);
                toast.success("已複製到隔天");
              }}
            >
              複製
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={extendBusy === editing.id}
              onClick={() => void extendItem(editing.id)}
            >
              {extendBusy === editing.id ? "延伸中…" : "AI 延伸"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
              取消
            </Button>
          </div>
        </form>
      ) : null}

      {mode === "week" ? (
        <PhoneDayList
          days={weekDays}
          schedule={schedule}
          testId="cal-week"
          cursor={cursor}
          onMove={moveToDay}
          onEdit={setEditingId}
        />
      ) : null}

      {mode === "month" ? (
        <PhoneDayList
          days={monthDays}
          schedule={schedule}
          testId="cal-month"
          cursor={cursor}
          onMove={moveToDay}
          onEdit={setEditingId}
        />
      ) : null}

      {mode === "agenda" ? (
        <ul className="mt-6 space-y-2" data-testid="cal-agenda">
          {[...schedule]
            .sort((a, b) => {
              const dueA = isDueScheduleItem(a) ? 0 : 1;
              const dueB = isDueScheduleItem(b) ? 0 : 1;
              if (dueA !== dueB) return dueA - dueB;
              return a.scheduledAt - b.scheduledAt;
            })
            .map((item) => (
              <li
                key={item.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/schedule-id");
                  if (id && id !== item.id) moveToDay(id, item.scheduledAt);
                }}
                data-testid={
                  isDueScheduleItem(item)
                    ? "cal-due"
                    : isWaveScheduleItem(item)
                      ? "schedule-wave"
                      : "schedule-suite"
                }
                className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
              >
                <p className="text-xs text-muted">
                  {format(item.scheduledAt, "M/d（EE）HH:mm", { locale: zhTW })} · {CONTENT_KIND_LABEL[item.contentKind]}
                  {isWaveScheduleItem(item) ? " · 節奏" : ""}
                  {isDueScheduleItem(item) ? " · 現在可以發" : ""}
                </p>
                <p className="text-sm font-medium">{item.title}</p>
                {item.captionPreview ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted" data-testid="schedule-caption">
                    {item.captionPreview}
                  </p>
                ) : null}
                {item.sequence && item.sequence.assetIds.length > 1 ? (
                  <p className="text-xs text-muted">{item.sequence.assetIds.length} 張畫面</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      openScheduledPreview(item);
                      void navigate({ to: "/instagram" });
                    }}
                  >
                    看畫面
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => duplicateSchedule(item.id)}>
                    複製
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={extendBusy === item.id}
                    onClick={() => void extendItem(item.id)}
                  >
                    {extendBusy === item.id ? "延伸中…" : "AI 延伸"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(item.id)}>
                    改這則
                  </Button>
                  {item.status !== "published" ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        data-testid="nudge-earlier"
                        onClick={() => moveToDay(item.id, shiftScheduleDay(item.scheduledAt, -1))}
                      >
                        早一天
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        data-testid="nudge-later"
                        onClick={() => moveToDay(item.id, shiftScheduleDay(item.scheduledAt, 1))}
                      >
                        晚一天
                      </Button>
                    </>
                  ) : null}
                  {item.status !== "published" ? (
                    isDueScheduleItem(item) ? (
                      <DueSlotActions
                        item={item}
                        showPreview={false}
                        imageSrc={resolveAssetSrc(
                          schedulePreviewAssetId(item, campaigns),
                          urls,
                          assets.find((asset) => asset.id === schedulePreviewAssetId(item, campaigns))?.seedSrc,
                        )}
                      />
                    ) : (
                      <>
                        <PublishIgButton
                          caption={item.captionPreview}
                          imageSrc={resolveAssetSrc(
                            schedulePreviewAssetId(item, campaigns),
                            urls,
                            assets.find((asset) => asset.id === schedulePreviewAssetId(item, campaigns))?.seedSrc,
                          )}
                          onPublished={() => {
                            markPublished(item.id);
                            toast.success("已寫進過去 IG，下次生成會參考這則");
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          data-testid="due-remember"
                          onClick={() => {
                            markPublished(item.id);
                            toast.success("已寫進過去 IG，下次生成會參考這則");
                          }}
                        >
                          寫進過去 IG
                        </Button>
                      </>
                    )
                  ) : (
                    <p className="text-xs text-muted">已發布</p>
                  )}
                </div>
              </li>
            ))}
        </ul>
      ) : (
        <div className="mt-4 hidden grid-cols-7 gap-1 md:grid">
          {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
            <p key={d} className="py-2 text-center text-xs text-muted">
              {d}
            </p>
          ))}
          {(mode === "month" ? days : weekDays).map((day) => {
            const items = schedule.filter((s) => isSameDay(s.scheduledAt, day));
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-16 rounded-xl bg-surface p-1.5 shadow-[var(--shadow-border)] md:min-h-24",
                  !isSameMonth(day, cursor) && mode === "month" && "opacity-40",
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("text/schedule-id");
                  if (id) moveSchedule(id, new Date(day.getFullYear(), day.getMonth(), day.getDate(), 20).getTime());
                }}
              >
                <p className="text-xs">{format(day, "d")}</p>
                <ul className="mt-1 space-y-1">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      draggable
                      data-testid={isWaveScheduleItem(item) ? "schedule-wave" : "schedule-suite"}
                      onDragStart={(e) => e.dataTransfer.setData("text/schedule-id", item.id)}
                      onClick={() => setEditingId(item.id)}
                      className={cn(
                        "truncate rounded-md px-1 py-0.5 text-[10px]",
                        isWaveScheduleItem(item) ? "bg-bg/70 text-muted" : "bg-bg",
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
      )}
    </main>
  );
}
