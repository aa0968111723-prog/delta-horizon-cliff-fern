import { ExternalLink, Instagram, RefreshCw, Unplug } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConnectionBadge, ConnectionMessage, openExternalUrl } from "@/components/connections/connection-status";
import { Button } from "@/components/ui/button";
import { redirectToLoginIfRequired } from "@/lib/app-data";
import { disconnectInstagram, getInstagramStatus, listInstagramMedia, startInstagramConnect } from "@/lib/connections/instagram";
import type { ConnectorUiState, OfficialProviderStatus } from "@/lib/connections/types";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/stores/connection-store";

type ListResult = Awaited<ReturnType<typeof listInstagramMedia>>;

export function InstagramCard() {
  const savedItems = useConnectionStore((state) => state.instagramItems);
  const lastSyncAt = useConnectionStore((state) => state.instagramLastSyncAt);
  const username = useConnectionStore((state) => state.instagramUsername);
  const syncItems = useConnectionStore((state) => state.syncInstagramItems);
  const disconnectMemory = useConnectionStore((state) => state.disconnectInstagramMemory);
  const setUsername = useConnectionStore((state) => state.setInstagramUsername);

  const [status, setStatus] = useState<ConnectorUiState>("idle");
  const [provider, setProvider] = useState<OfficialProviderStatus | null>(null);
  const [lastResult, setLastResult] = useState<ListResult | null>(null);
  const [busy, setBusy] = useState(false);

  function acceptError(result: Extract<ListResult, { ok: false }>) {
    setLastResult(result);
    setStatus(result.kind);
  }

  async function refreshStatus() {
    const next = await getInstagramStatus();
    setProvider(next);
    if (next.username) setUsername(next.username);
    if (!next.available) setStatus("unavailable");
    else if (next.connected) setStatus("connected");
    else setStatus("not_connected");
    return next;
  }

  async function sync(quiet = false) {
    setStatus("checking");
    try {
      const availability = await refreshStatus();
      if (!availability.available) return;
      const result = await listInstagramMedia({ data: {} });
      setLastResult(result);
      if (!result.ok) {
        acceptError(result);
        return;
      }
      syncItems(result.data);
      setStatus("connected");
      if (!quiet) toast.success(`已同步 ${result.data.length} 則 IG 內容記憶`);
    } catch (error) {
      setStatus("error");
      toast.error(error instanceof Error ? error.message : "Instagram 暫時無法使用");
    }
  }

  useEffect(() => {
    void (async () => {
      const availability = await refreshStatus();
      if (availability.connected) await sync(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connect() {
    setBusy(true);
    try {
      const result = await startInstagramConnect();
      if (!result.ok) {
        acceptError(result);
        if (result.loginRequired && result.loginUrl) {
          redirectToLoginIfRequired({
            ok: false,
            data: null,
            loginRequired: true,
            loginUrl: result.loginUrl,
          });
        }
        return;
      }
      openExternalUrl(result.data.url);
    } finally {
      setBusy(false);
    }
  }

  const unavailable = status === "unavailable" || provider?.available === false;

  return (
    <section className="mt-6 overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow-border)]">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-fg">
            <Instagram className="size-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">Instagram</h2>
              <ConnectionBadge status={status} />
            </div>
            <p className="mt-1 text-xs text-muted">
              {username ? `@${username}　` : ""}
              {lastSyncAt ? `最近同步：${new Date(lastSyncAt).toLocaleString("zh-TW")}` : "尚未把 IG 貼文加入內容記憶"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {unavailable ? null : status === "connected" || provider?.mode === "mcp" ? (
            <Button variant="secondary" disabled={status === "checking"} onClick={() => void sync()}>
              <RefreshCw className={cn("size-4", status === "checking" && "animate-spin")} />
              {status === "checking" ? "檢查中…" : "同步"}
            </Button>
          ) : (
            <Button disabled={busy} onClick={() => void connect()}>
              {busy ? "準備連接…" : "連接 Instagram"}
            </Button>
          )}
        </div>
      </div>

      {status === "login" && lastResult && !lastResult.ok ? (
        <ConnectionMessage
          title="需要由 Grok 完成授權"
          detail="這是唯一會出現登入動作的狀態。App 不會要求你貼 Instagram Token。"
          action={lastResult.loginUrl ? (
            <Button
              onClick={() => redirectToLoginIfRequired({
                ok: false,
                data: null,
                loginRequired: true,
                loginUrl: lastResult.loginUrl,
              })}
            >
              Continue with Grok
              <ExternalLink className="size-4" />
            </Button>
          ) : undefined}
        />
      ) : unavailable ? (
        <ConnectionMessage
          title="Instagram 尚未在此環境提供"
          detail="沒有官方 Instagram OAuth 憑證，也沒有 MCP catalog。不會顯示模擬貼文或假數據。"
        />
      ) : status === "not_connected" ? (
        <ConnectionMessage
          title="Instagram 尚未連接"
          detail="連接後才能讀取過去貼文、Caption 與內容記憶。不接受手動 Token。"
          action={<Button onClick={() => void connect()}>連接 Instagram</Button>}
        />
      ) : status === "connected" ? (
        <div className="p-5 md:p-6">
          <p className="text-sm leading-6 text-muted">
            已同步 {savedItems.length} 則貼文到 IG 內容記憶。到 IG 中心看格狀預覽、文案與 Reels 工作流。
          </p>
          {savedItems.length ? (
            <ul className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
              {savedItems.slice(0, 6).map((item) => (
                <li key={item.id} className="overflow-hidden rounded-2xl bg-bg">
                  <div className="flex aspect-square items-center justify-center">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt={item.title} className="size-full object-cover" />
                    ) : (
                      <span className="px-3 text-center text-xs text-muted">{item.mimeType}</span>
                    )}
                  </div>
                  <p className="line-clamp-2 px-2 py-2 text-xs">{item.title}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">已連接，但目前沒有可顯示的真實貼文。</p>
          )}
        </div>
      ) : status === "error" ? (
        <ConnectionMessage title="Instagram 暫時無法使用" detail="既有內容記憶仍保留。" />
      ) : (
        <ConnectionMessage title="正在檢查 Instagram" detail="只會讀取官方 API 回傳的真實內容。" />
      )}

      {(savedItems.length || status === "connected") && !unavailable ? (
        <div className="border-t border-border p-5 md:px-6">
          <Button
            variant="outline"
            onClick={async () => {
              await disconnectInstagram();
              disconnectMemory();
              setStatus("not_connected");
              toast.success("已中斷 Instagram 並清除本機索引");
            }}
          >
            <Unplug className="size-4" />
            中斷連接
          </Button>
        </div>
      ) : null}
    </section>
  );
}
