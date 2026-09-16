import { format as formatDate } from "date-fns";
import { zhTW } from "date-fns/locale";
import { History, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { FORMATS } from "@/lib/studio/formats";
import type { Project } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio-store";

export function VersionPanel({ project }: { project: Project }) {
  const captureSnapshot = useStudio((s) => s.captureSnapshot);
  const restoreSnapshot = useStudio((s) => s.restoreSnapshot);
  const deleteSnapshot = useStudio((s) => s.deleteSnapshot);
  const snapshots = project.snapshots ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-xs font-medium text-muted">版本</p>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            captureSnapshot(project.id, "手動版本");
            toast.success("已儲存版本");
          }}
        >
          <Save className="size-4" />
          儲存此頁
        </Button>
      </div>
      {snapshots.length === 0 ? (
        <div className="p-3">
          <EmptyState
            icon={History}
            title="還沒有版本"
            description="編輯時會自動備份。也可手動存一版，之後一鍵還原。"
          />
        </div>
      ) : (
        <ul className="space-y-1 px-2 pb-4">
          {snapshots.map((snap) => {
            const format = FORMATS.find((f) => f.id === snap.formatId);
            return (
              <li key={snap.id} className="rounded-md bg-bg px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{snap.name}</p>
                    <p className="text-xs text-muted">
                      {format?.short ?? snap.formatId}
                      {snap.pages?.length ? ` · ${snap.pages.length} 頁` : ` · 第 ${(snap.slideIndex ?? 0) + 1} 頁`}
                      {" · "}
                      {formatDate(snap.createdAt, "M/d HH:mm", { locale: zhTW })}
                      {snap.kind === "auto" ? " · 自動" : snap.kind === "format" ? " · 尺寸" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="還原"
                      onClick={() => {
                        restoreSnapshot(project.id, snap.id);
                        toast.success("已還原版本");
                      }}
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="刪除版本"
                      onClick={() => deleteSnapshot(project.id, snap.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
