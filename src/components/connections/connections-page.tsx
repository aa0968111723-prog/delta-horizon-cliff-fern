import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format as formatDate } from "date-fns";
import { Check, FolderOpen, Link2, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { disconnectConnection, getConnections, listDriveFolders, setDriveRoot, syncConnection } from "@/lib/connections/api";
import { PROVIDER_ORDER, PROVIDERS } from "@/lib/connections/providers";
import type { ConnectionInfo, ConnectionProvider } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

const ERROR_TEXT: Record<string, string> = {
  unconfigured: "這個服務還沒設定授權金鑰，暫時無法連接。",
  denied: "你在授權頁取消了，沒有連接。",
  state: "授權逾時或被中斷，請再試一次。",
  exchange: "跟服務交換授權時失敗，請再試一次。",
};

export function useConnections() {
  return useQuery({ queryKey: ["connections"], queryFn: () => getConnections(), staleTime: 30_000 });
}

export function ConnectionsPage({ search }: { search: { connected?: string; error?: string } }) {
  const qc = useQueryClient();
  const { data, isLoading } = useConnections();

  useEffect(() => {
    if (search.connected) toast.success(`${PROVIDERS[search.connected as ConnectionProvider]?.label ?? search.connected} 已連接`);
    if (search.error) toast.error(ERROR_TEXT[search.error] ?? "連接失敗");
  }, [search.connected, search.error]);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="連接"
        title="把素材接進來"
        description="連接後 AI 才知道以前做過什麼。三個服務都用官方授權，金鑰存在伺服器端加密，隨時可以中斷。"
      />
      <ul className="mt-6 space-y-3">
        {PROVIDER_ORDER.map((p) => (
          <li key={p}>
            <ConnectionCard info={data?.find((c) => c.provider === p)} loading={isLoading} onChanged={() => void qc.invalidateQueries({ queryKey: ["connections"] })} provider={p} />
          </li>
        ))}
      </ul>
      <p className="mt-6 flex items-start gap-2 text-xs text-muted">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
        不會爬蟲、不存帳密。Token 只在伺服器端加密保存，可以 refresh，也能隨時撤銷；前端和素材庫都不會出現任何金鑰。
      </p>
    </main>
  );
}

function ConnectionCard({
  provider,
  info,
  loading,
  onChanged,
}: {
  provider: ConnectionProvider;
  info?: ConnectionInfo;
  loading: boolean;
  onChanged: () => void;
}) {
  const meta = PROVIDERS[provider];
  const [busy, setBusy] = useState<"sync" | "disconnect" | null>(null);
  const status = info?.status ?? "disconnected";
  const connected = status === "connected";

  async function sync() {
    setBusy("sync");
    try {
      const res = await syncConnection({ data: { provider } });
      if (res.ok) toast.success(`${meta.label} 同步完成，${res.itemCount} 個項目`);
      else toast.error(res.error);
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    setBusy("disconnect");
    try {
      await disconnectConnection({ data: { provider } });
      toast.success(`已中斷 ${meta.label}`);
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-[24px] bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <ProviderMark provider={provider} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{meta.label}</p>
            <StatusPill status={status} loading={loading} />
            {info?.accountLabel ? <span className="text-xs text-muted">{info.accountLabel}</span> : null}
          </div>
          <p className="mt-1 text-sm text-muted">{meta.blurb}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {meta.reads.map((r) => (
              <li key={r} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
                {r}
              </li>
            ))}
          </ul>
          {connected && info ? (
            <p className="mt-2 text-xs text-subtle">
              {info.itemCount ? `${info.itemCount} 個項目` : "尚未同步"}
              {info.lastSyncAt ? ` · 上次同步 ${formatDate(info.lastSyncAt, "M/d HH:mm")}` : ""}
            </p>
          ) : null}
        </div>
      </div>

      {connected && provider === "drive" ? <DriveRoot rootLabel={info?.rootLabel ?? null} onChanged={onChanged} /> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {connected ? (
          <>
            <Button size="sm" variant="secondary" className="rounded-full" onClick={() => void sync()} disabled={busy !== null}>
              {busy === "sync" ? <RefreshCw className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              同步
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full" asChild>
              <a href={`/api/connections/${provider}/start`}>重新授權</a>
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full text-danger" onClick={() => void disconnect()} disabled={busy !== null}>
              <Unplug className="size-3.5" />
              中斷
            </Button>
          </>
        ) : status === "unconfigured" ? (
          <p className="text-xs text-muted">尚未設定這個服務的授權金鑰（由部署環境提供），設定後這裡會出現「連接」。</p>
        ) : (
          <Button size="sm" className="rounded-full" asChild>
            <a href={`/api/connections/${provider}/start`}>
              <Link2 className="size-3.5" />
              {status === "expired" ? "重新授權" : `連接 ${meta.label}`}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function DriveRoot({ rootLabel, onChanged }: { rootLabel: string | null; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const folders = useQuery({ queryKey: ["drive-folders"], queryFn: () => listDriveFolders(), enabled: open });
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-glow-card px-3 py-2 text-sm">
      <FolderOpen className="size-4 text-accent" />
      <span className="text-xs text-muted">主要資料夾：</span>
      {open ? (
        <Select
          onValueChange={async (v) => {
            const f = folders.data && folders.data.ok ? folders.data.folders.find((x) => x.id === v) : null;
            if (!f) return;
            await setDriveRoot({ data: { folderId: f.id, label: f.name } });
            toast.success(`已指定「${f.name}」為淡江禪學社主要資料夾`);
            setOpen(false);
            onChanged();
          }}
        >
          <SelectTrigger className="h-9 w-56 rounded-xl">
            <SelectValue placeholder={folders.isLoading ? "讀取資料夾…" : "選一個資料夾"} />
          </SelectTrigger>
          <SelectContent>
            {folders.data && folders.data.ok
              ? folders.data.folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))
              : null}
          </SelectContent>
        </Select>
      ) : (
        <>
          <span className="font-medium">{rootLabel ?? "整個雲端硬碟"}</span>
          <button type="button" className="ml-auto text-xs text-accent" onClick={() => setOpen(true)}>
            {rootLabel ? "更換" : "指定淡江禪學社主要資料夾"}
          </button>
        </>
      )}
    </div>
  );
}

export function StatusPill({ status, loading }: { status: ConnectionInfo["status"]; loading?: boolean }) {
  if (loading) return <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">確認中…</span>;
  const map = {
    connected: { label: "Connected", cls: "bg-success/10 text-success" },
    expired: { label: "需要重新授權", cls: "bg-warn/10 text-warn" },
    disconnected: { label: "未連接", cls: "bg-surface-2 text-muted" },
    unconfigured: { label: "尚未設定", cls: "bg-surface-2 text-subtle" },
  } as const;
  const m = map[status];
  return (
    <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", m.cls)}>
      {status === "connected" ? <Check className="size-3" /> : null}
      {m.label}
    </span>
  );
}

export function ProviderMark({ provider, className }: { provider: ConnectionProvider; className?: string }) {
  const cls = {
    drive: "bg-[linear-gradient(135deg,#fbbc04,#34a853_50%,#4285f4)]",
    canva: "bg-[linear-gradient(135deg,#00c4cc,#7d2ae8)]",
    instagram: "bg-[linear-gradient(135deg,#f9ce34,#ee2a7b_50%,#6228d7)]",
  }[provider];
  return (
    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-[var(--shadow-border)]", cls, className)}>
      {PROVIDERS[provider].short.slice(0, 2)}
    </span>
  );
}
