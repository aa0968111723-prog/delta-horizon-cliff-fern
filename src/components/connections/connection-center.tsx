import {
  Cloud,
  ExternalLink,
  FileText,
  Folder,
  RefreshCw,
  Search,
  Unplug,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BrandSubnav } from "@/components/brand/brand-subnav";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redirectToLoginIfRequired } from "@/lib/app-data";
import {
  listDriveFolder,
  readGoogleDriveFile,
  searchGoogleDrive,
} from "@/lib/connections/google-drive";
import type { ConnectorUiState, ExternalMemoryItem } from "@/lib/connections/types";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/stores/connection-store";

type DriveResult = Awaited<ReturnType<typeof listDriveFolder>>;

export function ConnectionCenter() {
  const folderId = useConnectionStore((state) => state.driveFolderId);
  const folderName = useConnectionStore((state) => state.driveFolderName);
  const savedItems = useConnectionStore((state) => state.driveItems);
  const lastSyncAt = useConnectionStore((state) => state.driveLastSyncAt);
  const selectFolder = useConnectionStore((state) => state.selectDriveFolder);
  const syncItems = useConnectionStore((state) => state.syncDriveItems);
  const rememberItems = useConnectionStore((state) => state.rememberDriveItems);
  const updateSnippet = useConnectionStore((state) => state.updateDriveSnippet);
  const disconnectMemory = useConnectionStore((state) => state.disconnectDriveMemory);

  const [status, setStatus] = useState<ConnectorUiState>("idle");
  const [lastResult, setLastResult] = useState<DriveResult | null>(null);
  const [visibleItems, setVisibleItems] = useState<ExternalMemoryItem[]>(savedItems);
  const [query, setQuery] = useState("");
  const [busyFileId, setBusyFileId] = useState<string | null>(null);

  function acceptError(result: Extract<DriveResult, { ok: false }>) {
    setLastResult(result);
    setStatus(result.kind);
  }

  async function loadFolder(nextId = folderId, nextName = folderName, quiet = false) {
    setStatus("checking");
    try {
      const result = await listDriveFolder({ data: { folderId: nextId } });
      setLastResult(result);
      if (!result.ok) {
        acceptError(result);
        return;
      }
      selectFolder(nextId, nextName);
      syncItems(result.data);
      setVisibleItems(result.data);
      setStatus("connected");
      if (!quiet) toast.success(`已同步「${nextName}」`);
    } catch (error) {
      setStatus("error");
      toast.error(error instanceof Error ? error.message : "Google Drive 暫時無法使用");
    }
  }

  useEffect(() => {
    void loadFolder(folderId, folderName, true);
    // Connector availability is checked once when this dedicated page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search() {
    if (!query.trim()) return;
    setStatus("checking");
    try {
      const result = await searchGoogleDrive({ data: { query } });
      setLastResult(result);
      if (!result.ok) {
        acceptError(result);
        return;
      }
      setVisibleItems(result.data);
      rememberItems(result.data);
      setStatus("connected");
      toast.success(`找到 ${result.data.length} 個 Drive 項目，已加入 Creative Brain 索引`);
    } catch (error) {
      setStatus("error");
      toast.error(error instanceof Error ? error.message : "Drive 搜尋失敗");
    }
  }

  async function readFile(item: ExternalMemoryItem) {
    setBusyFileId(item.id);
    try {
      const result = await readGoogleDriveFile({ data: { fileId: item.id } });
      setLastResult(result as DriveResult);
      if (!result.ok) {
        acceptError(result);
        return;
      }
      if (!result.data.text) {
        toast.error("這個檔案沒有可讀文字；圖片仍保留為 Drive 來源參考。");
        return;
      }
      updateSnippet(item.id, result.data.text);
      setVisibleItems((items) =>
        items.map((row) => row.id === item.id ? { ...row, snippet: result.data.text } : row),
      );
      toast.success("內容摘要已加入 Creative Brain");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "無法讀取檔案");
    } finally {
      setBusyFileId(null);
    }
  }

  const connected = status === "connected";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="淡江禪學社 Creative Brain"
        title="連接"
        description="從已授權的 Google Drive 找歷屆企劃、文宣與照片。憑證由 Grok gate 管理，不會進入前端、瀏覽器儲存或 repository。"
        actions={<BrandSubnav current="connections" />}
      />

      <section className="mt-6 overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow-border)]">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-fg">
              <Cloud className="size-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">Google Drive</h2>
                <ConnectionBadge status={status} />
              </div>
              <p className="mt-1 text-xs text-muted">
                {lastSyncAt ? `Creative Brain 最近同步：${new Date(lastSyncAt).toLocaleString("zh-TW")}` : "尚未把 Drive 內容加入 Creative Brain"}
              </p>
            </div>
          </div>
          <Button variant="secondary" disabled={status === "checking"} onClick={() => void loadFolder()}>
            <RefreshCw className={cn("size-4", status === "checking" && "animate-spin")} />
            {status === "checking" ? "檢查中…" : connected ? "同步" : "重新檢查"}
          </Button>
        </div>

        {status === "login" && lastResult && !lastResult.ok ? (
          <ConnectionMessage
            title="需要由 Grok 完成授權"
            detail="這是唯一會出現登入動作的狀態。App 不會要求你貼 Google Token。"
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
        ) : status === "not_connected" ? (
          <ConnectionMessage
            title="Google Drive 尚未連接"
            detail="請先在 Grok 的 Connected Apps 授權 Google Drive，再回來重新檢查。這裡不接受手動 Token。"
          />
        ) : status === "scope_denied" || status === "access_denied" ? (
          <ConnectionMessage
            title="目前授權不包含這項 Drive 操作"
            detail="App 不會繞過授權範圍。請在 Grok 檢查連接權限後重新同步。"
          />
        ) : status === "error" ? (
          <ConnectionMessage title="Google Drive 暫時無法使用" detail="既有 Creative Brain 索引仍保留，可稍後重新檢查。" />
        ) : (
          <div className="p-5 md:p-6">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void search();
                  }}
                  className="h-11 pl-10"
                  placeholder="自然語言搜尋：以前晚上的茶會照片、浮游禪光企劃"
                />
              </div>
              <Button className="min-h-11" disabled={!connected || status === "checking"} onClick={() => void search()}>
                搜尋 Drive
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="flex min-h-10 items-center gap-2 rounded-xl bg-bg px-3 text-sm"
                onClick={() => void loadFolder("root", "我的雲端硬碟")}
              >
                <Folder className="size-4 text-accent" />
                {folderName}
              </button>
              <p className="text-xs text-muted">{visibleItems.length} 個項目</p>
            </div>

            {visibleItems.length ? (
              <ul className="mt-3 grid gap-2 md:grid-cols-2">
                {visibleItems.map((item) => (
                  <li key={item.id} className="rounded-2xl bg-bg p-3">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-accent">
                        {item.isFolder ? <Folder className="size-5" /> : <FileText className="size-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted">{item.mimeType || "Google Drive"}</p>
                        {item.snippet ? <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">{item.snippet}</p> : null}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {item.isFolder ? (
                        <Button size="sm" variant="secondary" onClick={() => void loadFolder(item.id, item.title)}>
                          選為主要資料夾
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" disabled={busyFileId === item.id} onClick={() => void readFile(item)}>
                          {busyFileId === item.id ? "讀取中…" : item.snippet ? "更新內容" : "讀取內容"}
                        </Button>
                      )}
                      {item.webUrl ? (
                        <Button size="sm" variant="ghost" onClick={() => window.open(item.webUrl, "_blank", "noopener,noreferrer")}>
                          在 Drive 開啟
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-2xl bg-bg px-4 py-10 text-center text-sm text-muted">
                {status === "checking" ? "正在讀取 Drive…" : "這個位置目前沒有可顯示的項目。"}
              </p>
            )}
          </div>
        )}
      </section>

      {savedItems.length ? (
        <section className="mt-6 rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-medium">此 App 記住的 Drive 索引</h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                只保存檔名、類型、來源與你主動讀取的文字摘要，不保存 OAuth Token。撤銷 Google 授權需在 Grok Connected Apps 完成。
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                disconnectMemory();
                setVisibleItems([]);
                toast.success("已清除此 App 的 Drive 索引");
              }}
            >
              <Unplug className="size-4" />
              清除本機索引
            </Button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function ConnectionBadge({ status }: { status: ConnectorUiState }) {
  if (status === "connected") return <Badge variant="success">Connected</Badge>;
  if (status === "checking") return <Badge variant="default">Checking</Badge>;
  if (status === "login") return <Badge variant="warn">需要授權</Badge>;
  if (status === "idle") return <Badge variant="default">尚未檢查</Badge>;
  return <Badge variant="danger">未連接</Badge>;
}

function ConnectionMessage({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="p-6 text-center md:p-10">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">{detail}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
