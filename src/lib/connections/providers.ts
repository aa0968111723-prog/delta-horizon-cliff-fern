import type { ConnectionProvider } from "@/lib/studio/types";

export type ProviderMeta = {
  id: ConnectionProvider;
  label: string;
  short: string;
  blurb: string;
  reads: string[];
  /** 環境變數名稱（只在 server 讀取，永遠不進前端）。 */
  env: { clientId: string; clientSecret: string };
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  pkce: boolean;
  revokeUrl: string | null;
  docsUrl: string;
};

export const PROVIDERS: Record<ConnectionProvider, ProviderMeta> = {
  drive: {
    id: "drive",
    label: "Google Drive",
    short: "Drive",
    blurb: "指定「淡江禪學社主要資料夾」，AI 讀照片、企劃、歷屆文宣，形成知識記憶。",
    reads: ["照片 / 影片", "Google Docs / Sheets", "PDF 企劃", "歷屆文宣與 Logo"],
    env: { clientId: "GOOGLE_CLIENT_ID", clientSecret: "GOOGLE_CLIENT_SECRET" },
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/drive.readonly", "openid", "email"],
    pkce: false,
    revokeUrl: "https://oauth2.googleapis.com/revoke",
    docsUrl: "https://developers.google.com/drive/api/guides/about-sdk",
  },
  canva: {
    id: "canva",
    label: "Canva",
    short: "Canva",
    blurb: "讀取歷屆設計與縮圖，AI 分析配色、排版、品牌元素；AI 產出也能送回 Canva 微調。",
    reads: ["Designs 與縮圖", "最近使用", "活動海報 / IG / Story 版型"],
    env: { clientId: "CANVA_CLIENT_ID", clientSecret: "CANVA_CLIENT_SECRET" },
    authorizeUrl: "https://www.canva.com/api/oauth/authorize",
    tokenUrl: "https://api.canva.com/rest/v1/oauth/token",
    scopes: ["design:meta:read", "design:content:read", "asset:read", "profile:read"],
    pkce: true,
    revokeUrl: "https://api.canva.com/rest/v1/oauth/revoke",
    docsUrl: "https://www.canva.dev/docs/connect/",
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    short: "IG",
    blurb: "用 Meta 官方 API 連接禪學社 IG，讀取過去貼文、Caption 與成效，形成 Instagram Content Memory。",
    reads: ["Profile / Bio", "過去貼文、Carousel、Reels", "Caption 與日期", "互動與 Insights"],
    env: { clientId: "INSTAGRAM_APP_ID", clientSecret: "INSTAGRAM_APP_SECRET" },
    authorizeUrl: "https://www.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    scopes: ["instagram_business_basic", "instagram_business_manage_insights"],
    pkce: false,
    revokeUrl: null,
    docsUrl: "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login",
  },
};

export const PROVIDER_ORDER: ConnectionProvider[] = ["drive", "canva", "instagram"];

export function isProvider(v: unknown): v is ConnectionProvider {
  return v === "drive" || v === "canva" || v === "instagram";
}

/** 跨來源搜尋 / 瀏覽時的統一項目。 */
export type ExternalItem = {
  provider: ConnectionProvider;
  id: string;
  title: string;
  thumbnail: string | null;
  url: string | null;
  kind: string;
  subtitle: string;
  date: string | null;
  /** IG 才有：互動數字。 */
  metrics?: { likes?: number; comments?: number; reach?: number; saves?: number; shares?: number; views?: number } | null;
  caption?: string;
};
