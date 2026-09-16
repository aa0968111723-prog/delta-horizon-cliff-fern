import { ExternalLink, Palette, RefreshCw, Search, Unplug } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConnectionBadge, ConnectionMessage, openExternalUrl } from "@/components/connections/connection-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redirectToLoginIfRequired } from "@/lib/app-data";
import { canvaProvenanceLabel, type ConnectorUiState, type ExternalMemoryItem, type OfficialProviderStatus } from "@/lib/connections/types";
import { copyCanvaBrief, disconnectCanva, getCanvaStatus, listCanvaDesigns, searchCanvaDesigns, startCanvaConnect } from "@/lib/connections/canva";
import { canvaDesignOpenUrl } from "@/lib/connections/canva-normalize";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/stores/connection-store";
import { useCreative } from "@/stores/creative-store";
import { useUi } from "@/stores/ui-store";

type ListResult = Awaited<ReturnType<typeof listCanvaDesigns>>;

export function CanvaCard() {
  const savedItems = useConnectionStore((state) => state.canvaItems);
  const lastSyncAt = useConnectionStore((state) => state.canvaLastSyncAt);
  const syncItems = useConnectionStore((state) => state.syncCanvaItems);
  const rememberItems = useConnectionStore((state) => state.rememberCanvaItems);
  const disconnectMemory = useConnectionStore((state) => state.disconnectCanvaMemory);
  const addStyleReference = useConnectionStore((state) => state.addStyleReference);
  const setStylePrompt = useUi((state) => state.setStylePrompt);
  const campaign = useCreative((state) => state.campaigns[0]);

  const [status, setStatus] = useState<ConnectorUiState>("idle");
  const [provider, setProvider] = useState<OfficialProviderStatus | null>(null);
  const [lastResult, setLastResult] = useState<ListResult | null>(null);
  const [visibleItems, setVisibleItems] = useState<ExternalMemoryItem[]>(savedItems);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  function acceptError(result: Extract<ListResult, { ok: false }>) {
    setLastResult(result);
    setStatus(result.kind);
  }

  async function refreshStatus() {
    const next = await getCanvaStatus();
    setProvider(next);
    if (!next.available) setStatus("unavailable");
    else if (next.connected) setStatus("connected");
    else setStatus("not_connected");
    return next;
  }

  async function sync(quiet = false, nextQuery = "") {
    setStatus("checking");
    try {
      const availability = await refreshStatus();
      if (!availability.available) return;
      const result = nextQuery
        ? await searchCanvaDesigns({ data: { query: nextQuery } })
        : await listCanvaDesigns({ data: {} });
      setLastResult(result);
      if (!result.ok) {
        acceptError(result);
        return;
      }
      if (nextQuery) rememberItems(result.data);
      else syncItems(result.data);
      setVisibleItems(result.data);
      setStatus("connected");
      if (!quiet) toast.success(nextQuery ? `找到 ${result.data.length} 個 Canva 設計` : "已同步最近的 Canva 設計");
    } catch (error) {
      setStatus("error");
      toast.error(error instanceof Error ? error.message : "Canva 暫時無法使用");
    }
  }

  useEffect(() => {
    void (async () => {
      const availability = await refreshStatus();
      const params = new URLSearchParams(window.location.search);
      if (params.get("canva") === "connected") {
        toast.success("Canva 已連接");
        await sync(true);
        params.delete("canva");
        window.history.replaceState({}, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
        return;
      }
      if (availability.connected) await sync(true);
    })();
    // Availability is checked when the Connection Center opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connect() {
    setBusy(true);
    try {
      const result = await startCanvaConnect();
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "無法開始 Canva 連接");
    } finally {
      setBusy(false);
    }
  }

  async function copyBrief(item?: ExternalMemoryItem) {
    const result = await copyCanvaBrief({
      data: {
        campaignName: campaign?.name || item?.title || "浮游禪光",
        hook: campaign?.oneLiner,
        concept: campaign?.description,
        schedule: campaign ? `${campaign.eventDate} ${campaign.eventTime}` : "",
        location: campaign?.location,
        cta: campaign?.cta,
        collection: item?.collection || "浮游禪光",
      },
    });
    await navigator.clipboard.writeText(result.text);
    toast.success(result.note);
  }

  function addReference(item: ExternalMemoryItem) {
    const collection = item.collection || "浮游禪光";
    addStyleReference(item, `${canvaProvenanceLabel(collection)}｜${item.snippet || item.title}`);
    setStylePrompt({
      title: item.title,
      collection,
      notes: item.snippet || item.title,
      provider: canvaProvenanceLabel(collection),
    });
    toast.success(`已加入風格參考：${canvaProvenanceLabel(collection)}`);
  }

  const connected = status === "connected";
  const unavailable = status === "unavailable" || provider?.available === false;

  return (
    <section className="mt-6 overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow-border)]">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-fg">
            <Palette className="size-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">Canva</h2>
              <ConnectionBadge status={status} />
              {provider?.mode === "oauth" ? <Badge variant="default">Connect API</Badge> : null}
              {provider?.mode === "mcp" ? <Badge variant="default">MCP</Badge> : null}
            </div>
            <p className="mt-1 text-xs text-muted">
              {lastSyncAt ? `Creative Brain 最近同步：${new Date(lastSyncAt).toLocaleString("zh-TW")}` : "尚未把 Canva 設計加入 Creative Brain"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {unavailable ? null : connected || provider?.mode === "mcp" ? (
            <Button variant="secondary" disabled={status === "checking"} onClick={() => void sync()}>
              <RefreshCw className={cn("size-4", status === "checking" && "animate-spin")} />
              {status === "checking" ? "檢查中…" : connected ? "同步" : "重新檢查"}
            </Button>
          ) : (
            <Button disabled={busy} onClick={() => void connect()}>
              {busy ? "準備連接…" : provider?.connected ? "重新授權" : "連接 Canva"}
            </Button>
          )}
        </div>
      </div>

      {status === "login" && lastResult && !lastResult.ok ? (
        <ConnectionMessage
          title="需要由 Grok 完成授權"
          detail="這是唯一會出現登入動作的狀態。App 不會要求你貼 Canva Token。"
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
          title="Canva 尚未在此環境提供"
          detail="沒有 Grok Canva MCP catalog，也沒有平台注入的 Canva OAuth 憑證。這裡不會假裝已連接，也不會用模擬設計充當真實 Canva 資料。"
        />
      ) : status === "not_connected" ? (
        <ConnectionMessage
          title="Canva 尚未連接"
          detail={provider?.mode === "oauth"
            ? "用官方 Canva Connect 授權後，才能搜尋以前的茶會設計。不接受手動 Token。"
            : "請先在 Grok Connected Apps 授權 Canva，再回來同步。"}
          action={provider?.mode === "oauth" ? (
            <Button onClick={() => void connect()}>連接 Canva</Button>
          ) : (
            <Button variant="secondary" onClick={() => void sync()}>重新檢查</Button>
          )}
        />
      ) : status === "scope_denied" || status === "access_denied" ? (
        <ConnectionMessage title="目前授權不包含讀取設計" detail="App 不會繞過授權範圍。請重新授權後再同步。" />
      ) : status === "error" ? (
        <ConnectionMessage title="Canva 暫時無法使用" detail="既有 Creative Brain 索引仍保留，可稍後重新檢查。" />
      ) : (
        <div className="p-5 md:p-6">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void sync(false, query);
                }}
                className="h-11 pl-10"
                placeholder="找以前茶會 Canva、浮游禪光主視覺"
              />
            </div>
            <Button className="min-h-11" disabled={!connected && status !== "checking"} onClick={() => void sync(false, query)}>
              搜尋 Canva
            </Button>
          </div>

          <p className="mt-4 text-xs leading-5 text-muted">
            可以開啟 Canva、加入 AI 風格參考，或複製 brief 去貼。Design Autofill 需要 Canva Enterprise，目前未開通，不會假裝一鍵套版。
          </p>

          {visibleItems.length ? (
            <ul className="mt-3 grid gap-2 md:grid-cols-2">
              {visibleItems.map((item) => (
                <li key={item.id} className="rounded-2xl bg-bg p-3">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{canvaProvenanceLabel(item.collection)}</p>
                  {item.snippet ? <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">{item.snippet}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => addReference(item)}>加入風格參考</Button>
                    <Button size="sm" variant="ghost" onClick={() => window.open(canvaDesignOpenUrl(item), "_blank", "noopener,noreferrer")}>
                      在 Canva 開啟
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void copyBrief(item)}>複製 brief</Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl bg-bg px-4 py-10 text-center text-sm text-muted">
              {status === "checking" ? "正在讀取 Canva…" : "目前沒有可顯示的真實 Canva 設計。"}
            </p>
          )}
        </div>
      )}

      {savedItems.length ? (
        <div className="border-t border-border p-5 md:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-muted">只保存設計名稱、縮圖來源與連結，不保存 OAuth Token。</p>
            <Button
              variant="outline"
              onClick={async () => {
                await disconnectCanva();
                disconnectMemory();
                setVisibleItems([]);
                setStatus("not_connected");
                toast.success("已中斷 Canva 並清除本機索引");
              }}
            >
              <Unplug className="size-4" />
              中斷連接
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
