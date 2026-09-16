import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createFromHit } from "@/components/create/from-hit";
import { ingestOfficialIgPosts } from "@/components/instagram/ingest-live";
import { SearchHitCard } from "@/components/search/hit-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getConnectionCapabilities, syncClubDrive } from "@/lib/ai/drive";
import { disconnectOAuth, searchCanvaWorld, syncInstagramMemory } from "@/lib/ai/oauth";
import { redirectToLoginIfRequired } from "@/lib/app-data/login";
import { ingestBytesToLibrary, ingestUrlToLibrary } from "@/lib/zen/ingest-client";
import { isAllowedIngestUrl } from "@/lib/zen/ingest";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

type Caps = {
  drive: boolean;
  canva: boolean;
  instagram: boolean;
  canvaConnected?: boolean;
  canvaAccount?: string | null;
  instagramConnected?: boolean;
  instagramAccount?: string | null;
};

export function ConnectionCenter() {
  const navigate = useNavigate();
  const connections = useCreative((s) => s.connections);
  const setConnection = useCreative((s) => s.setConnection);
  const addMemory = useCreative((s) => s.addMemory);
  const addAsset = useStudio((s) => s.addAsset);
  const memory = useCreative((s) => s.memory);
  const driveFolderQuery = useCreative((s) => s.driveFolderQuery);
  const setDriveFolderQuery = useCreative((s) => s.setDriveFolderQuery);
  const [caps, setCaps] = useState<Caps | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [hitBusy, setHitBusy] = useState(false);

  useEffect(() => {
    void getConnectionCapabilities()
      .then((next) => {
        setCaps(next);
        if (next.canvaConnected) {
          setConnection("canva", {
            status: "connected",
            accountName: next.canvaAccount ?? "Canva",
            detail: "官方 OAuth 已連上，Token 只在伺服器。",
            lastSyncAt: Date.now(),
          });
        } else if (!next.canva) {
          setConnection("canva", {
            status: "unavailable",
            detail: "尚未設定 Canva 官方應用程式。可用品牌記憶裡的歷屆設計繼續創作。",
          });
        }
        if (next.instagramConnected) {
          setConnection("instagram", {
            status: "connected",
            accountName: next.instagramAccount ?? "Instagram",
            detail: "Meta 官方授權已連上，不會爬蟲或存帳密。",
            lastSyncAt: Date.now(),
          });
        } else if (!next.instagram) {
          setConnection("instagram", {
            status: "unavailable",
            detail: "尚未設定 Meta / Instagram 官方應用程式。歷史內容先用 Creative Memory。",
          });
        }
      })
      .catch(() => setCaps({ drive: true, canva: false, instagram: false }));
  }, [setConnection]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    if (connected === "canva") toast.success("Canva 已連接");
    if (connected === "instagram") toast.success("Instagram 已連接");
    if (error?.includes("unconfigured")) toast.message("還沒有官方應用程式設定，不會請你貼 Token。");
    if (error?.includes("denied") || error?.includes("exchange")) toast.error("授權沒有完成，可以再試一次。");
  }, []);

  async function connect(id: "drive" | "canva" | "instagram") {
    setBusy(id);
    try {
      if (id === "drive") {
        const result = await syncClubDrive({
          data: { query: "茶會 OR 浮游禪光 OR 龜龜", folderHint: driveFolderQuery },
        });
        if (!result.ok) {
          if (result.loginRequired) {
            setConnection("drive", { status: "needs-auth", detail: "需要官方 Google 授權" });
            redirectToLoginIfRequired({
              ok: false,
              data: null,
              loginRequired: true,
              loginUrl: result.loginUrl,
              errorMessage: result.error,
            });
            return;
          }
          toast.error(result.error);
          setConnection("drive", { status: "unavailable", detail: result.error });
          return;
        }
        setConnection("drive", {
          status: "connected",
          lastSyncAt: Date.now(),
          accountName: "Google Drive",
          detail: `已找到 ${result.items.length} 個相關檔案`,
        });
        for (const item of result.items.slice(0, 8)) {
          const assetId = `asset_drive_${item.id}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 60);
          let thumbAssetId: string | undefined;
          if (item.imageB64 && item.imageMime) {
            const ok = await ingestBytesToLibrary({
              id: assetId,
              name: item.name,
              source: "drive",
              b64: item.imageB64,
              mime: item.imageMime,
              tags: ["Drive", item.name],
              addAsset,
            });
            if (ok) thumbAssetId = assetId;
          } else if (item.imageUrl && isAllowedIngestUrl(item.imageUrl)) {
            const ok = await ingestUrlToLibrary({
              id: assetId,
              name: item.name,
              source: "drive",
              url: item.imageUrl,
              tags: ["Drive", item.name],
              addAsset,
            });
            if (ok) thumbAssetId = assetId;
          }
          addMemory({
            id: `drive_${item.id}`,
            source: "drive",
            title: item.name,
            subtitle: item.excerpt ? `Google Drive / ${item.excerpt.slice(0, 48)}` : "Google Drive",
            tags: ["Drive"],
            kind: item.mime ?? "file",
            url: item.url,
            thumbAssetId,
          });
        }
        toast.success("Drive 已同步（官方連接）");
        return;
      }
      if (id === "canva") {
        if (!caps?.canva) {
          setConnection("canva", {
            status: "unavailable",
            detail: "尚未設定 Canva 官方應用程式。可用品牌記憶裡的歷屆設計繼續創作。",
          });
          toast.message("Canva 需官方 OAuth 應用程式，Token 只會存在伺服器。");
          return;
        }
        if (caps.canvaConnected) {
          const found = await searchCanvaWorld({ data: { query: "茶會 浮游禪光 招生 三色光" } });
          setConnection("canva", {
            status: "connected",
            lastSyncAt: Date.now(),
            accountName: caps.canvaAccount ?? "Canva",
            detail: `已找到 ${found.items.length} 個設計`,
          });
          for (const item of found.items.slice(0, 8)) {
            const thumbAssetId = item.thumbUrl
              ? await ingestUrlToLibrary({
                  id: `asset_${item.id}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 60),
                  name: item.title,
                  source: "canva",
                  url: item.thumbUrl,
                  tags: item.tags,
                  addAsset,
                }).then((ok) => (ok ? `asset_${item.id}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 60) : undefined))
              : undefined;
            addMemory({
              id: item.id,
              source: "canva",
              title: item.title,
              subtitle: item.subtitle,
              tags: item.tags,
              kind: "Canva",
              url: item.url,
              thumbAssetId,
            });
          }
          toast.success("Canva 已同步");
          return;
        }
        window.location.assign("/api/oauth/canva/start");
        return;
      }
      if (id === "instagram") {
        if (!caps?.instagram) {
          setConnection("instagram", {
            status: "unavailable",
            detail: "尚未設定 Meta / Instagram 官方應用程式。歷史內容先用 Creative Memory。",
          });
          toast.message("Instagram 只走官方 API，不會模擬登入。");
          return;
        }
        if (caps.instagramConnected) {
          const found = await syncInstagramMemory();
          if (!found.ok) {
            toast.message(found.error);
            setConnection("instagram", {
              status: found.connected ? "connected" : "disconnected",
              detail: found.error,
            });
            return;
          }
          const hint = await ingestOfficialIgPosts(found.posts);
          setConnection("instagram", {
            status: "connected",
            lastSyncAt: Date.now(),
            accountName: caps.instagramAccount ?? "Instagram",
            detail: `已讀取 ${found.posts.length} 則貼文`,
          });
          toast.success(`Instagram 已同步。${hint.line}`);
          return;
        }
        window.location.assign("/api/oauth/instagram/start");
      }
    } finally {
      setBusy(null);
    }
  }

  async function disconnect(id: "drive" | "canva" | "instagram") {
    if (id === "canva" || id === "instagram") {
      await disconnectOAuth({ data: { provider: id } });
    }
    setConnection(id, {
      status: "disconnected",
      lastSyncAt: null,
      accountName: null,
      detail: "已中斷。素材記憶仍保留在本機。",
    });
    toast.message("已中斷連接");
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="連接"
        title="素材從哪裡來"
        description="官方 OAuth。不會請你貼 Token，也不會把秘密放進瀏覽器。"
      />
      <ul className="mt-6 space-y-3">
        {connections.map((item) => (
          <li key={item.id} className="rounded-[1.5rem] bg-surface p-5 shadow-[var(--shadow-border)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="mt-1 text-sm text-muted">
                  {statusLabel(item.status)} · {item.detail}
                </p>
                {item.id === "drive" ? (
                  <label className="mt-3 block">
                    <span className="text-xs text-muted">淡江禪學社主要資料夾</span>
                    <Input
                      className="mt-1"
                      value={driveFolderQuery}
                      onChange={(e) => setDriveFolderQuery(e.target.value)}
                      placeholder="淡江禪學社"
                    />
                  </label>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <Button size="sm" disabled={busy === item.id} onClick={() => void connect(item.id)}>
                  {item.status === "connected" ? "同步" : item.status === "needs-auth" ? "重新授權" : "連接"}
                </Button>
                {item.status === "connected" ? (
                  <Button size="sm" variant="ghost" onClick={() => void disconnect(item.id)}>
                    中斷
                  </Button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {memory.length ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">最近同步，可直接創作</h2>
          <ul className="mt-3 space-y-2">
            {memory.slice(0, 8).map((item) => (
              <SearchHitCard
                key={item.id}
                hit={{
                  id: item.id,
                  source: item.source,
                  title: item.title,
                  subtitle: item.subtitle,
                  tags: item.tags,
                  url: item.url,
                  thumbAssetId: item.thumbAssetId,
                }}
                busy={hitBusy}
                onCreate={async (hit) => {
                  setHitBusy(true);
                  try {
                    const ok = await createFromHit(hit);
                    if (ok) void navigate({ to: "/create" });
                  } finally {
                    setHitBusy(false);
                  }
                }}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

function statusLabel(status: string) {
  if (status === "connected") return "Connected";
  if (status === "needs-auth") return "需要授權";
  if (status === "unavailable") return "尚未設定";
  return "未連接";
}
