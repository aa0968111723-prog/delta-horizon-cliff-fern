import { addDays, format, startOfMonth, startOfWeek, addMonths, isSameDay, isSameMonth } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { generateCopyPack } from "@/lib/ai/copy";
import { uid } from "@/lib/studio/ids";
import type { ContentKind } from "@/lib/studio/types";
import { copyKindForContent } from "@/lib/zen/convert";
import { igDnaBlock } from "@/lib/zen/insights";
import { CONTENT_KIND_LABEL } from "@/lib/zen/types";
import { rhythmHint } from "@/lib/zen/schedule";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";

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
];

function toLocalInput(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CalendarPage() {
  const schedule = useCreative((s) => s.schedule);
  const igPosts = useCreative((s) => s.igPosts);
  const moveSchedule = useCreative((s) => s.moveSchedule);
  const upsertSchedule = useCreative((s) => s.upsertSchedule);
  const patchSchedule = useCreative((s) => s.patchSchedule);
  const duplicateSchedule = useCreative((s) => s.duplicateSchedule);
  const [cursor, setCursor] = useState(new Date(2026, 8, 16));
  const [mode, setMode] = useState<Mode>("month");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickKind, setQuickKind] = useState<ContentKind>("ig-post");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [extendBusy, setExtendBusy] = useState<string | null>(null);
  const editing = schedule.find((item) => item.id === editingId);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

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
      upsertSchedule({
        id: uid("sch"),
        title: result.pack.hook,
        contentKind: item.contentKind === "ig-post" ? "story" : item.contentKind,
        status: "idea",
        scheduledAt: item.scheduledAt + 2 * 86_400_000,
        publishedAt: null,
        projectId: item.projectId,
        campaignId: item.campaignId,
        captionPreview: result.pack.body,
      });
      toast.success("已延伸一則，錯開兩天");
    } finally {
      setExtendBusy(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Calendar"
        title="排程"
        description={rhythmHint(schedule)}
        actions={
          <div className="flex gap-2">
            {(["month", "week", "agenda"] as const).map((id) => (
              <Button key={id} size="sm" variant={mode === id ? "default" : "secondary"} onClick={() => setMode(id)}>
                {id === "month" ? "月" : id === "week" ? "週" : "Agenda"}
              </Button>
            ))}
          </div>
        }
      />
      <div className="mt-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setCursor(addMonths(cursor, -1))}>
          上月
        </Button>
        <p className="font-display text-xl">{format(cursor, "yyyy年M月", { locale: zhTW })}</p>
        <Button variant="ghost" onClick={() => setCursor(addMonths(cursor, 1))}>
          下月
        </Button>
      </div>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const title = quickTitle.trim();
          if (!title) return;
          upsertSchedule({
            id: uid("sch"),
            title,
            contentKind: quickKind,
            status: "idea",
            scheduledAt: new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 20).getTime(),
            publishedAt: null,
            projectId: null,
            campaignId: null,
            captionPreview: title,
          });
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

      {mode === "agenda" ? (
        <ul className="mt-6 space-y-2">
          {[...schedule]
            .sort((a, b) => a.scheduledAt - b.scheduledAt)
            .map((item) => (
              <li key={item.id} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
                <p className="text-xs text-muted">
                  {format(item.scheduledAt, "M/d（EE）HH:mm", { locale: zhTW })} · {CONTENT_KIND_LABEL[item.contentKind]}
                </p>
                <p className="text-sm font-medium">{item.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
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
                    編輯
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      ) : (
        <div className="mt-4 grid grid-cols-7 gap-1">
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
                  "min-h-24 rounded-xl bg-surface p-1.5 shadow-[var(--shadow-border)]",
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
                      onDragStart={(e) => e.dataTransfer.setData("text/schedule-id", item.id)}
                      onClick={() => setEditingId(item.id)}
                      className="truncate rounded-md bg-bg px-1 py-0.5 text-[10px]"
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
