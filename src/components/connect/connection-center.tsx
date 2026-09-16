import { useEffect, useRef, useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { BrandSubnav } from "@/components/brand/brand-subnav";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getConnectedProfile, getConnectionStatus } from "@/lib/connect/oauth";
import { syncConnection } from "@/lib/connect/sync";
import { SEED_REMOTE_FILES } from "@/lib/studio/seed";
import { useStudio } from "@/stores/studio-store";

const CARDS: { provider: "drive" | "canva" | "instagram"; title: string; hint: string }[] = [
  { provider: "drive", title: "Google Drive", hint: "讀歷屆照片與企劃。發布時會把主視覺放到「禪光發布」資料夾，需重新授權寫入。" },
  { provider: "canva", title: "Canva", hint: "海報與 IG 設計。可送進去微調，也可匯出 PNG 給官方 IG 發布。" },
  { provider: "instagram", title: "Instagram", hint: "官方 API 讀貼文、Insights，並發布 Feed。主視覺走 Drive 或 Canva 公開網址。" },
];

export function ConnectionCenter() {
  const search = useSearch({ strict: false }) as { ok?: string; error?: string; revoked?: string };
  const connections = useStudio((s) => s.connections);
  const setConnection = useStudio((s) => s.setConnection);
  const upsertRemoteFiles = useStudio((s) => s.upsertRemoteFiles);
  const upsertIgMemory = useStudio((s) => s.upsertIgMemory);
  const [server, setServer] = useState<Awaited<ReturnType<typeof getConnectionStatus>> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const autoSynced = useRef<string | null>(null);

  useEffect(() => {
    getConnectionStatus().then(setServer).catch(() => setServer(null));
  }, [search.ok, search.revoked]);

  async function sync(provider: "drive" | "canva" | "instagram") {
    setBusy(provider);
    try {
      const result = await syncConnection({
        data: {
          provider,
          folderName: provider === "drive" ? connections.find((c) => c.provider === "drive")?.folderName : undefined,
        },
      });
      if (result.files.length) {
        upsertRemoteFiles(result.files);
      } else {
        upsertRemoteFiles(SEED_REMOTE_FILES.filter((file) => file.provider === provider));
      }
      if (result.igPosts.length) upsertIgMemory(result.igPosts);
      setConnection(provider, {
        lastSyncAt: Date.now(),
        status: result.connected ? "connected" : "disconnected",
        ...(result.accountLabel ? { accountLabel: result.accountLabel } : {}),
        ...(result.folderName ? { folderName: result.folderName } : {}),
      });
      toast.message(result.note);
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    for (const provider of ["drive", "canva", "instagram"] as const) {
      getConnectedProfile({ data: { provider } })
        .then((profile) => {
          if (profile.connected) {
            setConnection(provider, {
              status: "connected",
              accountLabel: profile.accountLabel,
              lastSyncAt: Date.now(),
            });
          }
        })
        .catch(() => undefined);
    }
  }, [search.ok, setConnection]);

  useEffect(() => {
    const ok = search.ok;
    if (ok !== "drive" && ok !== "canva" && ok !== "instagram") return;
    if (autoSynced.current === ok) return;
    autoSynced.current = ok;
    void sync(ok);
    // First landing after official OAuth should fill Creative Memory without a second tap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.ok]);

  return (
    <main data-testid="connect-ready" className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="連接"
        title="Drive · Canva · Instagram"
        description="官方 OAuth。Token 只存在伺服器 Cookie，不會進畫面或 GitHub。連接完成後會自動把素材與過去 IG 收進創作記憶。"
        actions={<BrandSubnav current="connect" />}
      />
      {search.error ? <p className="mt-4 text-sm text-danger">連接沒有完成（{search.error}）。可能還沒設定官方應用程式。</p> : null}
      {search.ok ? <p className="mt-4 text-sm text-success">已連接 {search.ok}。</p> : null}
      {search.revoked ? <p className="mt-4 text-sm text-muted">已中斷 {search.revoked}。</p> : null}

      <ul className="mt-8 space-y-3">
        {CARDS.map((card) => {
          const local = connections.find((c) => c.provider === card.provider);
          const configured = server?.[card.provider]?.configured;
          return (
            <li key={card.provider} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{card.title}</p>
                  <p className="mt-1 text-sm text-muted">{card.hint}</p>
                  <p className="mt-2 text-xs text-subtle">
                    {local?.status === "connected" ? `已連接 · ${local.accountLabel}` : configured ? "尚未連接" : "尚未設定官方應用程式"}
                  </p>
                </div>
              </div>
              {card.provider === "drive" ? (
                <div className="mt-3">
                  <Input
                    defaultValue={local?.folderName || "淡江禪學社主要資料夾"}
                    onBlur={(e) => setConnection("drive", { folderName: e.target.value })}
                    placeholder="指定主要資料夾名稱"
                  />
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <a href={`/api/connect/start/${card.provider}`}>連接</a>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <a href={`/api/connect/start/${card.provider}`}>重新授權</a>
                </Button>
                <Button size="sm" variant="secondary" disabled={busy === card.provider} onClick={() => void sync(card.provider)}>
                  {busy === card.provider ? "同步中" : "同步"}
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <a href={`/api/connect/revoke/${card.provider}`}>中斷</a>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-sm text-muted">
        品牌記憶仍在 <Link to="/brand" className="underline">品牌</Link>，素材在{" "}
        <Link to="/assets" className="underline">素材庫</Link>。
      </p>
    </main>
  );
}
