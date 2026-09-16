import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BrandSubnav } from "@/components/brand/brand-subnav";
import { Button } from "@/components/ui/button";
import { getConnectionCapabilities, startConnection, syncConnectionMemory } from "@/lib/connect/oauth";
import { oauthPath } from "@/lib/connect/providers";
import type { ConnectionId } from "@/lib/creative/types";
import { uid } from "@/lib/studio/ids";
import { useCreative } from "@/stores/creative-store";

const COPY: Record<ConnectionId, { title: string; hint: string }> = {
  "google-drive": { title: "Google Drive", hint: "指定禪學社資料夾後，照片、企劃、PDF 會進 Creative Memory。" },
  canva: { title: "Canva", hint: "讀取設計縮圖，作為風格參考或送回 Canva 微調。" },
  instagram: { title: "Instagram", hint: "用官方 API 讀 Profile、貼文與 Insights，形成 IG Content Memory。" },
};

export function ConnectCenter({
  notice,
  connected,
}: {
  notice?: string;
  connected?: string;
}) {
  const connections = useCreative((s) => s.connections);
  const setConnection = useCreative((s) => s.setConnection);
  const addMemory = useCreative((s) => s.addMemory);
  const [caps, setCaps] = useState<Record<string, { oauthReady: boolean; connected?: boolean }> | null>(null);

  useEffect(() => {
    getConnectionCapabilities()
      .then((next) => {
        setCaps(next);
        (Object.keys(next) as ConnectionId[]).forEach((id) => {
          if (next[id]?.connected) {
            setConnection(id, { status: "connected" });
          }
        });
      })
      .catch(() => setCaps(null));
  }, [setConnection]);

  useEffect(() => {
    if (connected === "google-drive" || connected === "canva" || connected === "instagram") {
      setConnection(connected, { status: "connected", lastSyncAt: Date.now() });
      toast.success("已連接，Token 只存在伺服器");
    }
    if (notice === "memory") toast.message("官方授權尚未開啟，先用社團記憶創作");
    if (notice === "denied") toast.error("授權沒有完成");
    if (notice === "revoked") toast.message("已中斷連接");
  }, [notice, connected, setConnection]);

  async function connect(id: ConnectionId) {
    const result = await startConnection({ data: { provider: id } });
    if (result.ok) {
      window.location.href = result.url;
      return;
    }
    setConnection(id, {
      status: "memory",
      lastSyncAt: Date.now(),
      folderHint: result.message,
    });
    toast.message("先用社團記憶創作", { description: result.message });
  }

  function disconnect(id: ConnectionId) {
    window.location.href = `${oauthPath(id)}/revoke`;
  }

  async function sync(id: ConnectionId) {
    const result = await syncConnectionMemory({ data: { provider: id } });
    if (!result.ok) {
      setConnection(id, { lastSyncAt: Date.now(), status: "memory" });
      toast.message(result.message);
      return;
    }
    for (const item of result.items) {
      addMemory({ ...item, id: item.id || uid("mem") });
    }
    setConnection(id, {
      lastSyncAt: Date.now(),
      status: "connected",
      accountLabel: result.account ?? COPY[id].title,
    });
    toast.success(`已同步 ${result.items.length} 筆進 Creative Memory`);
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6 md:px-8 md:py-10">
      <p className="text-xs tracking-[0.18em] text-muted uppercase">連接</p>
      <div className="mt-3">
        <BrandSubnav current="connect" />
      </div>
      <h1 className="mt-4 font-display text-3xl">Drive · Canva · IG</h1>
      <p className="mt-2 text-sm text-muted">官方 OAuth。Token 只在伺服器。不會請你貼金鑰。</p>
      <ul className="mt-8 space-y-3">
        {connections.map((c) => (
          <li key={c.id} className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{COPY[c.id].title}</p>
                <p className="mt-1 text-sm text-muted">{COPY[c.id].hint}</p>
                <p className="mt-2 text-xs text-subtle">
                  {c.status === "connected" ? "Connected" : c.status === "memory" ? "Creative Memory" : "未連接"}
                  {c.accountLabel ? ` · ${c.accountLabel}` : ""}
                </p>
                {caps?.[c.id]?.oauthReady ? (
                  <p className="mt-1 text-xs text-success">官方授權可用</p>
                ) : (
                  <p className="mt-1 text-xs text-muted">官方授權尚未開啟，先用社團記憶。</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void connect(c.id)}>
                {c.status === "disconnected" ? "連接" : "重新授權"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => void sync(c.id)}>
                同步
              </Button>
              <Button size="sm" variant="ghost" onClick={() => disconnect(c.id)}>
                中斷
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
