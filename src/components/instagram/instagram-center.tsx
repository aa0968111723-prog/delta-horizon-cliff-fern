import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BrandSubnav } from "@/components/brand/brand-subnav";
import { IgPreview } from "@/components/instagram/ig-preview";
import { ReelsStudio } from "@/components/instagram/reels-studio";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInstagramInsightsStatus, getInstagramStatus, listInstagramMedia } from "@/lib/connections/instagram";
import type { ConnectorUiState } from "@/lib/connections/types";
import { useConnectionStore } from "@/stores/connection-store";
import { useStudio } from "@/stores/studio-store";

export function InstagramCenter() {
  const items = useConnectionStore((state) => state.instagramItems);
  const syncItems = useConnectionStore((state) => state.syncInstagramItems);
  const username = useConnectionStore((state) => state.instagramUsername);
  const lastProjectId = useStudio((state) => state.lastProjectId);
  const [status, setStatus] = useState<ConnectorUiState>("idle");
  const [insightsNote, setInsightsNote] = useState("官方 Insights 尚未授權。這裡不會顯示模擬數據。");
  const [tab, setTab] = useState("memory");

  useEffect(() => {
    void (async () => {
      const availability = await getInstagramStatus();
      if (!availability.available) {
        setStatus("unavailable");
        return;
      }
      if (!availability.connected) {
        setStatus("not_connected");
        return;
      }
      const result = await listInstagramMedia({ data: {} });
      if (!result.ok) {
        setStatus(result.kind);
        return;
      }
      syncItems(result.data);
      setStatus("connected");
      const insights = await getInstagramInsightsStatus();
      if (!insights.ok) setInsightsNote(insights.detail || insights.message);
    })();
  }, [syncItems]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ig") === "connected") {
      toast.success("Instagram 已連接");
      params.delete("ig");
      window.history.replaceState({}, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
    }
    if (params.get("tab")) setTab(params.get("tab") || "memory");
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker={username ? `@${username}` : "IG 內容記憶"}
        title="Instagram"
        description="回看已授權的貼文、預覽 Studio 畫面、整理 Reels 腳本。沒有連接時不會假裝有貼文。"
        actions={<BrandSubnav current="connections" />}
      />

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="memory">內容記憶</TabsTrigger>
          <TabsTrigger value="preview">IG 預覽</TabsTrigger>
          <TabsTrigger value="reels">Reels</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="memory" className="mt-5">
          {status === "unavailable" ? (
            <EmptyNote
              title="Instagram 尚未在此環境提供"
              detail="沒有官方 OAuth 憑證或 MCP catalog。請到連接頁查看狀態，不會顯示模擬貼文。"
            />
          ) : status === "not_connected" || status === "login" ? (
            <EmptyNote
              title="尚未連接 Instagram"
              detail="連接後才會出現過去貼文格。這裡不接受貼 Token。"
              action={<Button asChild><Link to="/connections">去連接</Link></Button>}
            />
          ) : items.length ? (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {items.map((item) => (
                <li key={item.id} className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
                  <div className="flex aspect-square items-center justify-center bg-bg">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt={item.title} className="size-full object-cover" />
                    ) : (
                      <span className="px-3 text-center text-xs text-muted">{item.mimeType}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                    <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted">{item.snippet || "沒有 Caption"}</p>
                    {item.webUrl ? (
                      <a href={item.webUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-accent">
                        在 Instagram 開啟
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote title="還沒有 IG 內容記憶" detail={status === "checking" || status === "idle" ? "正在檢查授權…" : "已連接，但目前沒有可顯示的貼文。"} />
          )}
        </TabsContent>

        <TabsContent value="preview" className="mt-5">
          <IgPreview projectId={lastProjectId ?? undefined} />
        </TabsContent>

        <TabsContent value="reels" className="mt-5">
          <ReelsStudio projectId={lastProjectId ?? undefined} />
        </TabsContent>

        <TabsContent value="insights" className="mt-5">
          <div className="rounded-3xl bg-surface p-6 shadow-[var(--shadow-border)] md:p-10">
            <Badge variant="default">未來狀態</Badge>
            <h2 className="mt-3 font-display text-2xl">不會顯示模擬成效</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{insightsNote}</p>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

function EmptyNote({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-surface px-6 py-12 text-center shadow-[var(--shadow-border)]">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">{detail}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
