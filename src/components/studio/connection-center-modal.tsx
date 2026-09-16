import { useState } from "react";
import { FolderOpen, Image, Instagram, RefreshCw, ShieldCheck, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { searchClubDrive } from "@/lib/ai/drive";
import { useCampaignStore } from "@/lib/studio/campaign-store";
import { toast } from "sonner";

export function ConnectionCenterModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const connections = useCampaignStore((s) => s.connections);
  const syncConnection = useCampaignStore((s) => s.syncConnection);
  const addCreativeSource = useCampaignStore((s) => s.addCreativeSource);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [driveNote, setDriveNote] = useState<string | null>(null);

  async function handleSync(id: "google-drive" | "canva" | "instagram") {
    setSyncingId(id);
    try {
      if (id === "google-drive") {
        const result = await searchClubDrive({ data: { query: "淡江禪學社 茶會" } });
        setDriveNote(result.detail);
        for (const item of result.items.slice(0, 4)) {
          addCreativeSource({
            source: "google-drive",
            title: item.title,
            subtitle: item.subtitle,
            thumbnailUrl: item.thumbnailUrl,
            category: item.category,
            tags: item.tags,
            date: item.date || new Date().toISOString().slice(0, 10),
          });
        }
        toast.success(result.mode === "live" ? "已讀取 Drive 檔案" : "已更新示範資料夾");
      } else {
        await syncConnection(id);
        toast.success("已重新整理示範記憶（不是真實 OAuth）");
      }
      await syncConnection(id);
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl bg-surface p-4 text-fg sm:p-6">
        <DialogHeader className="border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Link2 className="size-4" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">連接中心</DialogTitle>
              <DialogDescription className="text-xs text-muted">
                Drive 走官方閘道（有憑證才讀檔）。Canva / IG 在此預覽是示範記憶，前端不存放 token。
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {connections.map((conn) => {
            const isSyncing = syncingId === conn.id || conn.status === "syncing";
            const icon =
              conn.id === "google-drive" ? (
                <FolderOpen className="size-5 text-accent" />
              ) : conn.id === "canva" ? (
                <Image className="size-5 text-accent" />
              ) : (
                <Instagram className="size-5 text-accent" />
              );
            const statusLabel =
              conn.status === "demo" ? "示範記憶" : conn.status === "connected" ? "已連線" : conn.status === "syncing" ? "同步中" : "未連接";

            return (
              <div
                key={conn.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-surface-2/40 p-3.5 sm:flex-row sm:items-center sm:p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 rounded-xl border border-border bg-surface p-2.5">{icon}</div>
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="text-sm font-bold">{conn.name}</h4>
                      <Badge variant={conn.status === "demo" ? "warn" : "success"}>{statusLabel}</Badge>
                    </div>
                    <p className="text-xs font-medium">{conn.accountName}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{conn.accountDetail}</p>
                    <span className="mt-1 block text-[10px] text-subtle">
                      {conn.itemCount} 項 · {new Date(conn.lastSyncedAt).toLocaleTimeString("zh-TW")}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0 gap-1.5 text-xs"
                  onClick={() => void handleSync(conn.id)}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin text-accent" : ""}`} />
                  {isSyncing ? "整理中…" : conn.id === "google-drive" ? "讀取資料夾" : "整理示範"}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-surface-2 p-3 text-xs text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
          <div>
            <span className="mb-0.5 block font-semibold text-fg">誠實連接</span>
            <p className="text-[11px]">
              {driveNote ??
                "不會在瀏覽器或程式碼放密鑰。Canva 與 Instagram 官方授權無法在此沙盒完成，所以用社團種子記憶讓一人創作仍能對齊語氣與素材。"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
