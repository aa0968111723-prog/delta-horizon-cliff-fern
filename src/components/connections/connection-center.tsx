import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { BrandSubnav } from "@/components/brand/brand-subnav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { maybeConnectorLogin } from "@/lib/app-data/login";
import { searchCreative } from "@/lib/search/creative";
import { disconnectOAuth, getConnectionStatus, listConnectedMedia, startOAuth } from "@/lib/connections/oauth";
import { useCreative } from "@/stores/creative-store";

type Status = Awaited<ReturnType<typeof getConnectionStatus>>;

export function ConnectionCenter() {
  const [status, setStatus] = useState<Status | null>(null);
  const [live, setLive] = useState<Awaited<ReturnType<typeof listConnectedMedia>> | null>(null);
  const folder = useCreative((s) => s.folder);
  const setFolder = useCreative((s) => s.setFolder);

  async function refresh() {
    const next = await getConnectionStatus();
    setStatus(next);
    const media = await listConnectedMedia();
    setLive(media);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function connectDrive() {
    if (status?.drive.loginUrl) {
      maybeConnectorLogin({ loginRequired: true, loginUrl: status.drive.loginUrl });
      return;
    }
    const result = await searchCreative({ data: { query: folder.driveFolder || "淡江禪學社" } });
    if (result.loginRequired) {
      maybeConnectorLogin(result);
      return;
    }
    toast.message(result.driveDetail);
    void refresh();
  }

  async function connect(provider: "canva" | "instagram") {
    const result = await startOAuth({ data: { provider } });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    window.location.assign(result.url);
  }

  async function disconnect(provider: "canva" | "instagram") {
    await disconnectOAuth({ data: { provider } });
    toast.success("已中斷");
    void refresh();
  }

  const cards = status
    ? [status.drive, status.canva, status.instagram]
    : [];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="連接"
        title="把素材接進來"
        description="Google Drive、Canva、Instagram 都用官方 OAuth。沒有貼 Token 的欄位。"
        actions={<BrandSubnav current="connections" />}
      />
      <div className="mt-8 space-y-4">
        {cards.map((card) => (
          <article key={card.id} className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{card.label}</p>
                <p className="mt-1 text-sm text-muted">{card.connected ? "Connected" : card.configured ? "未連接" : "尚未設定官方應用"}</p>
                <p className="mt-2 text-xs text-subtle">{card.detail}</p>
                {card.account ? <p className="mt-1 text-xs">{card.account}</p> : null}
              </div>
              <div className="flex flex-col gap-2">
                {card.id === "drive" ? (
                  <Button onClick={() => void connectDrive()}>{card.connected ? "重新授權" : "連接"}</Button>
                ) : (
                  <Button disabled={!card.configured} onClick={() => void connect(card.id)}>
                    {card.connected ? "重新授權" : "連接"}
                  </Button>
                )}
                {card.id !== "drive" && card.connected ? (
                  <Button variant="ghost" onClick={() => void disconnect(card.id)}>中斷</Button>
                ) : null}
                <Button variant="secondary" onClick={() => void (card.id === "drive" ? connectDrive() : refresh())}>
                  同步
                </Button>
              </div>
            </div>
            {card.id === "drive" ? (
              <label className="mt-4 block text-sm">
                淡江禪學社主要資料夾
                <Input className="mt-1" value={folder.driveFolder} onChange={(e) => setFolder({ driveFolder: e.target.value })} />
              </label>
            ) : null}
          </article>
        ))}
      </div>
      {live && (live.canva.length || live.instagram.length) ? (
        <section className="mt-8 space-y-4">
          {live.canva.length ? (
            <div>
              <h2 className="text-sm font-medium">Canva 最近設計</h2>
              <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {live.canva.slice(0, 8).map((item) => (
                  <li key={item.id} className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
                    <img src={item.thumb} alt="" className="aspect-square w-full object-cover" />
                    <p className="truncate px-2 py-1 text-[10px]">{item.title}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {live.instagram.length ? (
            <div>
              <h2 className="text-sm font-medium">Instagram 最近貼文</h2>
              <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {live.instagram.slice(0, 8).map((item) => (
                  <li key={item.id} className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
                    <img src={item.thumb} alt="" className="aspect-square w-full object-cover" />
                    <p className="truncate px-2 py-1 text-[10px]">{item.title}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
      <Button asChild variant="ghost" className="mt-6">
        <Link to="/">回首頁</Link>
      </Button>
    </main>
  );
}
