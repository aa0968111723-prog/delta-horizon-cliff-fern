import { createServerFn } from "@tanstack/react-start";
import { describeAdapter } from "@/lib/ai/campaign";
import { describeImageAdapter } from "@/lib/ai/image-status";

export type IntegrationProbe = {
  xai: { present: boolean; live: boolean; detail: string };
  canva: { present: boolean; connected: boolean; detail: string };
  instagram: { present: boolean; connected: boolean; detail: string };
  drive: {
    kind: string;
    loginRequired: boolean;
    hasLoginUrl: boolean;
    loginUrl?: string;
    detail: string;
  };
};

function studentDriveDetail(drive: {
  ok: boolean;
  data?: unknown[];
  loginRequired?: boolean;
  loginUrl?: string;
  detail?: string;
  message?: string;
}): string {
  if (drive.ok) return `已讀到 ${drive.data?.length ?? 0} 個 Drive 項目。`;
  if (drive.loginRequired && drive.loginUrl) {
    return "Drive 需要由 Grok 完成授權。只有這時才會出現 Continue with Grok。";
  }
  const raw = `${drive.detail ?? ""} ${drive.message ?? ""}`;
  if (drive.loginRequired || /access-token|inbound request|connector/i.test(raw)) {
    return "需要授權，但這個環境沒有登入連結。不會顯示 Continue with Grok，也不會放模擬檔案。";
  }
  return drive.detail || drive.message || "Google Drive 尚未在此環境提供。";
}

export const getStudioIntegrationFlags = createServerFn({ method: "GET" }).handler(async () => {
  const { canvaCatalogId, canvaOAuthCredentials, instagramCatalogId, instagramOAuthCredentials } =
    await import("./provider-env.server.ts");
  const xai = Boolean(process.env.XAI_API_KEY?.trim());
  return {
    xai,
    canvaOAuth: Boolean(canvaOAuthCredentials()),
    canvaCatalog: Boolean(canvaCatalogId()),
    instagramOAuth: Boolean(instagramOAuthCredentials()),
    instagramCatalog: Boolean(instagramCatalogId()),
    campaign: describeAdapter(xai),
    image: describeImageAdapter(xai),
  };
});

export const probeStudioIntegrations = createServerFn({ method: "POST" }).handler(async (): Promise<IntegrationProbe> => {
  const { canvaCatalogId, canvaOAuthCredentials, instagramCatalogId, instagramOAuthCredentials } =
    await import("./provider-env.server.ts");
  const xaiPresent = Boolean(process.env.XAI_API_KEY?.trim());
  let xaiLive = false;
  let xaiDetail = describeAdapter(false).detail;
  if (xaiPresent) {
    try {
      const response = await fetch("https://api.x.ai/v1/models", {
        headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}` },
      });
      xaiLive = response.ok;
      xaiDetail = response.ok
        ? "已確認 xAI 可連線。真正寫企劃、文案或生圖仍要你按下按鈕，且有用量上限。"
        : `金鑰在，但 xAI 回 ${response.status}。不會假裝已連線。`;
    } catch {
      xaiDetail = "金鑰在，但此刻無法連到 xAI。不會假裝已連線。";
    }
  }

  const { currentCanvaStatus } = await import("./canva-oauth.server.ts");
  const canva = await currentCanvaStatus();
  const { currentInstagramStatus } = await import("./instagram-oauth.server.ts");
  const instagram = await currentInstagramStatus();
  const { listDriveFolder } = await import("./google-drive.ts");
  const drive = await listDriveFolder({ data: { folderId: "root" } });

  return {
    xai: { present: xaiPresent, live: xaiLive, detail: xaiDetail },
    canva: {
      present: Boolean(canvaCatalogId() || canvaOAuthCredentials()),
      connected: canva.connected,
      detail: canva.reason,
    },
    instagram: {
      present: Boolean(instagramCatalogId() || instagramOAuthCredentials()),
      connected: instagram.connected,
      detail: instagram.reason,
    },
    drive: drive.ok
      ? {
          kind: "connected",
          loginRequired: false,
          hasLoginUrl: false,
          detail: studentDriveDetail(drive),
        }
      : {
          kind: drive.kind,
          loginRequired: Boolean(drive.loginRequired),
          hasLoginUrl: Boolean(drive.loginUrl),
          loginUrl: drive.loginUrl,
          detail: studentDriveDetail(drive),
        },
  };
});
