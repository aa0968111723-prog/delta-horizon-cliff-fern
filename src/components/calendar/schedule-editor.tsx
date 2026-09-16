import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTENT_KINDS, CONTENT_STATUS } from "@/lib/studio/content";
import type { ContentKind, ContentStatus, ScheduleItem } from "@/lib/studio/types";

export function ScheduleEditor({
  item,
  onSave,
  onClose,
}: {
  item: ScheduleItem;
  onSave: (next: ScheduleItem) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [when, setWhen] = useState(format(item.scheduledAt, "yyyy-MM-dd'T'HH:mm"));
  const [kind, setKind] = useState<ContentKind>(item.kind);
  const [status, setStatus] = useState<ContentStatus>(item.status);

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="text-sm font-medium">直接編輯這則排程</p>
      <div className="mt-3 space-y-3">
        <div>
          <Label>標題</Label>
          <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>預計發布</Label>
          <Input className="mt-1" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>類型</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as ContentKind)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_KINDS.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>狀態</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_STATUS.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            const scheduledAt = new Date(when).getTime();
            onSave({
              ...item,
              title: title.trim() || item.title,
              kind,
              status,
              scheduledAt: Number.isNaN(scheduledAt) ? item.scheduledAt : scheduledAt,
              publishedAt: status === "published" ? item.publishedAt ?? Date.now() : item.publishedAt,
            });
          }}
        >
          儲存
        </Button>
        <Button variant="secondary" onClick={onClose}>
          取消
        </Button>
      </div>
    </div>
  );
}
