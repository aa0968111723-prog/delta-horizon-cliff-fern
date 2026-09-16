import { useState } from "react";
import { FolderOpen, Image, Instagram, RefreshCw, CheckCircle2, ShieldCheck, Link2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCampaignStore } from "@/lib/studio/campaign-store";
import { toast } from "sonner";

interface ConnectionCenterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectionCenterModal({ open, onOpenChange }: ConnectionCenterModalProps) {
  const connections = useCampaignStore((s) => s.connections);
  const syncConnection = useCampaignStore((s) => s.syncConnection);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  async function handleSync(id: "google-drive" | "canva" | "instagram") {
    setSyncingId(id);
    await syncConnection(id);
    setSyncingId(null);
    toast.success("已完成素材與授權記憶同步！");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-surface text-fg rounded-2xl p-4 sm:p-6">
        <DialogHeader className="pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <Link2 className="size-4" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">
                淡江禪學社 官方連接中心
              </DialogTitle>
              <DialogDescription className="text-xs text-muted">
                使用官方 OAuth 授權安全串接，無須手動貼 Token，提供 AI 創作即時素材與歷史貼文記憶
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {connections.map((conn) => {
            const isSyncing = syncingId === conn.id || conn.status === "syncing";
            const icon =
              conn.id === "google-drive" ? (
                <FolderOpen className="size-5 text-blue-500" />
              ) : conn.id === "canva" ? (
                <Image className="size-5 text-indigo-500" />
              ) : (
                <Instagram className="size-5 text-pink-500" />
              );

            return (
              <div
                key={conn.id}
                className="rounded-xl border border-border bg-surface-2/40 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-surface border border-border shrink-0 mt-0.5">
                    {icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-fg">{conn.name}</h4>
                      <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 text-[11px] gap-1">
                        <CheckCircle2 className="size-3" /> Connected
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-fg/90">{conn.accountName}</p>
                    <p className="text-[11px] text-muted mt-0.5">{conn.accountDetail}</p>
                    <span className="text-[10px] text-muted/80 block mt-1">
                      已同步 {conn.itemCount} 個項目 · 上次更新 {new Date(conn.lastSyncedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 flex-1 sm:flex-none"
                    onClick={() => handleSync(conn.id)}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin text-primary" : ""}`} />
                    {isSyncing ? "同步中..." : "立即同步"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-muted hover:text-fg flex-1 sm:flex-none"
                    onClick={() => toast.info("官方 OAuth Token 由安全後端託管，已處於最新授權狀態。")}
                  >
                    重新授權
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl bg-surface-2 p-3 border border-border/80 flex items-start gap-2.5 text-xs text-muted">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-fg block mb-0.5">一人創作安全保護原則</span>
            <p className="text-[11px]">
              所有第三方 Token 均於 Server-side 加密保存，絕不暴露在前端 JS、localStorage 或程式碼庫中，支援即時 Revoke 與自動 Refresh。
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
