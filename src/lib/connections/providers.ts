/**
 * 第三方連接。三個都走官方 OAuth，token 只留在伺服器端。
 *
 * 這個檔案是唯一定義「一個連接需要哪些環境變數」的地方。憑證由平台注入，
 * 不寫進 repository、不放 localStorage、不經過前端 JS。
 */

export type ProviderId = "drive" | "canva" | "instagram";

export type ProviderSpec = {
  id: ProviderId;
  name: string;
  /** 連上之後 AI 可以讀什麼 */
  reads: string[];
  /** 使用者看得懂的一句話 */
  purpose: string;
  scopes: string[];
  /** 需要哪些伺服器端環境變數才能啟用 OAuth */
  envKeys: { clientId: string; clientSecret: string };
  authorizeUrl: string;
  tokenUrl: string;
  docsLabel: string;
};

export const PROVIDERS: Record<ProviderId, ProviderSpec> = {
  drive: {
    id: "drive",
    name: "Google Drive",
    purpose: "讀社團雲端硬碟裡的歷屆照片、企劃、社課資料，變成 AI 可以搜尋的素材庫。",
    reads: ["活動照片", "影片", "Google Docs 企劃", "Google Sheets", "PDF 文宣", "Logo 與社員照片"],
    scopes: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
    ],
    envKeys: { clientId: "GOOGLE_CLIENT_ID", clientSecret: "GOOGLE_CLIENT_SECRET" },
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    docsLabel: "Google OAuth 2.0 + Drive API",
  },
  canva: {
    id: "canva",
    name: "Canva",
    purpose: "讀過去的 Canva 設計與縮圖，讓 AI 延續社團自己的版面與品牌感。",
    reads: ["設計清單", "縮圖", "最近使用", "資料夾", "品牌樣板"],
    scopes: ["design:meta:read", "design:content:read", "folder:read", "asset:read"],
    envKeys: { clientId: "CANVA_CLIENT_ID", clientSecret: "CANVA_CLIENT_SECRET" },
    authorizeUrl: "https://www.canva.com/api/oauth/authorize",
    tokenUrl: "https://api.canva.com/rest/v1/oauth/token",
    docsLabel: "Canva Connect API",
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    purpose: "讀禪學社 IG 的過去貼文與成效，形成 Instagram Content Memory。",
    reads: ["Profile", "過去貼文", "輪播", "Reels", "Caption", "互動數據", "Insights"],
    scopes: [
      "instagram_basic",
      "instagram_manage_insights",
      "pages_show_list",
      "pages_read_engagement",
    ],
    envKeys: { clientId: "INSTAGRAM_APP_ID", clientSecret: "INSTAGRAM_APP_SECRET" },
    authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    docsLabel: "Meta / Instagram Graph API（官方）",
  },
};

export const PROVIDER_ORDER: ProviderId[] = ["drive", "canva", "instagram"];

export type ConnectionState = "connected" | "needs-auth" | "unconfigured";

export type ConnectionStatus = {
  id: ProviderId;
  name: string;
  purpose: string;
  reads: string[];
  state: ConnectionState;
  /** 使用者看得懂的狀態說明 */
  detail: string;
  accountLabel: string | null;
  lastSyncedAt: number | null;
  docsLabel: string;
};
