import { useEffect, useState } from "react";
import { toast } from "sonner";
import { redirectToLoginIfRequired } from "@/lib/app-data";
import {
  getStudioIntegrationFlags,
  probeStudioIntegrations,
  type IntegrationProbe,
} from "@/lib/connections/integrations";
import { Button } from "@/components/ui/button";

type Flags = Awaited<ReturnType<typeof getStudioIntegrationFlags>>;

export function EnvironmentCard() {
  const [flags, setFlags] = useState<Flags | null>(null);
  const [probe, setProbe] = useState<IntegrationProbe | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getStudioIntegrationFlags()
      .then(setFlags)
      .catch(() => setFlags(null));
  }, []);

  async function runProbe() {
    setBusy(true);
    try {
      const next = await probeStudioIntegrations();
      setProbe(next);
      if (next.drive.loginRequired && next.drive.hasLoginUrl) {
        toast.message("Drive 需要由 Grok 完成授權，才會出現 Continue with Grok。");
      } else if (!next.xai.present && !next.canva.present && !next.instagram.present) {
        toast.message("這個環境沒有 xAI／Canva／Instagram 憑證，保持不可用，不會假裝已連線。");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "檢查失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)] md:p-6" data-testid="environment-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold">這個環境實際提供什麼</h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            只顯示有沒有官方金鑰或授權，不會把 secret 送到瀏覽器。沒有的服務保持不可用，不會用模擬檔案或假 Grok 文字頂替。
          </p>
        </div>
        <Button className="min-h-11 w-full shrink-0 sm:w-auto" variant="secondary" disabled={busy} onClick={() => void runProbe()}>
          {busy ? "檢查中…" : "檢查這個環境"}
        </Button>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3">
        <EnvRow
          label="Grok 企劃／文案／生圖"
          value={probe ? (probe.xai.present ? (probe.xai.live ? "已確認可連線" : "金鑰在，此刻無法呼叫") : "本機草案") : flags ? (flags.xai ? "金鑰在，按檢查才會呼叫" : "本機草案") : "確認中"}
          detail={probe?.xai.detail ?? flags?.campaign.detail}
        />
        <EnvRow
          label="Canva"
          value={probe ? (probe.canva.present ? (probe.canva.connected ? "已連接" : "可授權，尚未連接") : "尚未提供") : flags ? (flags.canvaOAuth || flags.canvaCatalog ? "此環境有官方通道" : "尚未提供") : "確認中"}
          detail={probe?.canva.detail}
        />
        <EnvRow
          label="Instagram"
          value={probe ? (probe.instagram.present ? (probe.instagram.connected ? "已連接" : "可授權，尚未連接") : "尚未提供") : flags ? (flags.instagramOAuth || flags.instagramCatalog ? "此環境有官方通道" : "尚未提供") : "確認中"}
          detail={probe?.instagram.detail}
        />
        <EnvRow
          label="Google Drive"
          value={
            probe
              ? probe.drive.loginRequired
                ? probe.drive.hasLoginUrl
                  ? "需要 Continue with Grok"
                  : "需要授權，但沒有登入連結"
                : probe.drive.kind === "connected"
                  ? "已讀到資料"
                  : probe.drive.kind === "unavailable"
                    ? "尚未提供"
                    : probe.drive.kind
              : "打開此頁時會檢查"
          }
          detail={probe?.drive.detail}
        />
      </ul>
      {probe?.drive.loginRequired && probe.drive.loginUrl ? (
        <Button
          className="mt-4 min-h-11"
          onClick={() =>
            redirectToLoginIfRequired({
              ok: false,
              data: null,
              loginRequired: true,
              loginUrl: probe.drive.loginUrl,
            })
          }
        >
          Continue with Grok
        </Button>
      ) : null}
    </section>
  );
}

function EnvRow({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <li className="rounded-2xl bg-bg p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
      {detail ? <p className="mt-1 break-words text-xs leading-5 text-muted">{detail}</p> : null}
    </li>
  );
}
