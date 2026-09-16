import { Link } from "@tanstack/react-router";
import { Check, Images, Instagram, Link2, Loader2, Palette, RefreshCw, Unlink } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { disconnectProvider, getConnections } from "@/lib/connections/status";
import type { ConnectionStatus, ProviderId } from "@/lib/connections/providers";
import { cn } from "@/lib/utils";
import { CLUB_NAME } from "@/lib/zen/club";

const ICON: Record<ProviderId, typeof Images> = {
  drive: Images,
  canva: Palette,
  instagram: Instagram,
};

/**
 * 連接中心。刻意不是工程師的 API 設定頁：沒有 token 欄位、沒有要貼的字串，
 * 每個連接只有連接／重新授權／同步／中斷。
 */
export function ConnectionCenter({ focus }: { focus?: string }) {
  const [list, setList] = useState<ConnectionStatus[] | null>(null);
  const [busy, setBusy] = useState<ProviderId | null>(null);

  async function refresh() {
    try {
      setList(await getConnections());
    } catch {
      toast.error("讀取連接狀態時出錯了。");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function disconnect(id: ProviderId) {
    setBusy(id);
    try {
      await disconnectProvider({ data: { id } });
      await refresh();
      toast.success("已中斷連接");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="連接"
        title="素材與帳號"
        description={`把 ${CLUB_NAME} 的雲端硬碟、Canva 與 Instagram 接進來，AI 就不用每次從零開始。全部走官方授權，token 只留在伺服器端。`}
      />

      {list === null ? (
        <p className="mt-8 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" />
          正在讀取連接狀態…
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {list.map((item) => {
            const Icon = ICON[item.id];
            const highlight = focus === item.id;
            return (
              <li
                key={item.id}
                className={cn(
                  "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]",
                  highlight && "ring-2 ring-ring",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {item.name}
                        <StateBadge state={item.state} />
                      </p>
                      <p className="mt-1 text-xs text-muted">{item.purpose}</p>
                      {item.accountLabel ? (
                        <p className="mt-1 text-xs text-subtle">帳號：{item.accountLabel}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {item.state === "connected" ? (
                      <>
                        <Button size="sm" variant="secondary" asChild>
                          <a href={`/api/connections/${item.id}/sync`}>
                            <RefreshCw className="size-4" />
                            同步
                          </a>
                        </Button>
                        <Button size="sm" variant="ghost" asChild>
                          <a href={`/api/connections/${item.id}/start`}>重新授權</a>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void disconnect(item.id)}
                          disabled={busy === item.id}
                        >
                          <Unlink className="size-4" />
                          中斷
                        </Button>
                      </>
                    ) : item.state === "needs-auth" ? (
                      <Button size="sm" asChild>
                        <a href={`/api/connections/${item.id}/start`}>
                          <Link2 className="size-4" />
                          連接
                        </a>
                      </Button>
                    ) : (
                      <Button size="sm" disabled>
                        <Link2 className="size-4" />
                        尚未開放
                      </Button>
                    )}
                  </div>
                </div>

                <p className="mt-3 rounded-xl bg-surface-2/60 px-3 py-2 text-xs text-muted">{item.detail}</p>

                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {item.reads.map((read) => (
                    <li key={read} className="rounded-full bg-surface-2 px-2 py-0.5 text-[0.68rem] text-muted">
                      {read}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      <section className="mt-8 rounded-2xl bg-surface p-4 text-xs text-muted shadow-[var(--shadow-border)]">
        <p className="text-sm font-medium text-fg">關於安全</p>
        <ul className="mt-2 space-y-1">
          <li>· 三個連接都用各平台的官方 OAuth，不會爬網站、不模擬登入、也不會存你的帳號密碼。</li>
          <li>· 授權後的 token 加密後只留在伺服器端，前端 JS 讀不到，也不會寫進瀏覽器儲存空間。</li>
          <li>· 隨時可以按「中斷」撤銷；重新授權會換一組新的 token。</li>
          <li>· 應用程式憑證由平台以環境變數注入，不會出現在這個專案的程式碼裡。</li>
        </ul>
      </section>

      <p className="mt-6 text-xs text-subtle">
        還沒連接也可以創作：
        <Link to="/assets" className="underline">
          素材庫
        </Link>
        裡的圖片、
        <Link to="/brand" className="underline">
          品牌記憶
        </Link>
        與現有內容都會被 AI 讀進去。
      </p>
    </main>
  );
}

function StateBadge({ state }: { state: ConnectionStatus["state"] }) {
  if (state === "connected") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--color-success)_14%,transparent)] px-2 py-0.5 text-[0.68rem] text-[var(--color-success)]">
        <Check className="size-3" />
        已連接
      </span>
    );
  }
  if (state === "needs-auth") {
    return (
      <span className="rounded-full bg-[color-mix(in_oklab,var(--color-warm)_22%,transparent)] px-2 py-0.5 text-[0.68rem]">
        待授權
      </span>
    );
  }
  return (
    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[0.68rem] text-muted">尚未設定</span>
  );
}
