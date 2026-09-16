import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getConnectionCapabilities, searchClubDrive } from "@/lib/ai/drive";
import { redirectToLoginIfRequired } from "@/lib/app-data/login";
import { useCreative } from "@/stores/creative-store";
import { useEffect } from "react";

export function ConnectionCenter() {
  const connections = useCreative((s) => s.connections);
  const setConnection = useCreative((s) => s.setConnection);
  const addMemory = useCreative((s) => s.addMemory);
  const [caps, setCaps] = useState<{ drive: boolean; canva: boolean; instagram: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void getConnectionCapabilities()
      .then(setCaps)
      .catch(() => setCaps({ drive: true, canva: false, instagram: false }));
  }, []);

  async function connect(id: "drive" | "canva" | "instagram") {
    setBusy(id);
    try {
      if (id === "drive") {
        const result = await searchClubDrive({ data: { query: "茶會 OR 浮游禪光 OR 龜龜" } });
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
          addMemory({
            id: `drive_${item.id}`,
            source: "drive",
            title: item.name,
            subtitle: "Google Drive",
            tags: ["Drive"],
            kind: item.mime ?? "file",
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
        toast.message("Canva 會走官方 OAuth，不會請你貼 Token。");
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
        toast.message("Instagram 會走 Meta 官方授權，不會爬蟲或存帳密。");
        return;
      }
    } finally {
      setBusy(null);
    }
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
                <p className="mt-1 text-sm text-muted">{statusLabel(item.status)} · {item.detail}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <Button size="sm" disabled={busy === item.id} onClick={() => void connect(item.id)}>
                  {item.status === "connected" ? "同步" : item.status === "needs-auth" ? "重新授權" : "連接"}
                </Button>
                {item.status === "connected" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setConnection(item.id, {
                        status: "disconnected",
                        lastSyncAt: null,
                        accountName: null,
                        detail: "已中斷。素材記憶仍保留在本機。",
                      })
                    }
                  >
                    中斷
                  </Button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

function statusLabel(status: string) {
  if (status === "connected") return "Connected";
  if (status === "needs-auth") return "需要授權";
  if (status === "unavailable") return "尚未設定";
  return "未連接";
}
