export type ExternalMemoryProvider = "google-drive" | "canva" | "instagram";

export type ExternalMemoryItem = {
  id: string;
  provider: ExternalMemoryProvider;
  title: string;
  mimeType: string;
  isFolder: boolean;
  modifiedAt: string;
  webUrl: string;
  thumbnailUrl: string;
  parentId: string;
  snippet: string;
  syncedAt: number;
  collection?: string;
  sourceDate?: string;
};

export type ConnectorUiState =
  | "idle"
  | "checking"
  | "connected"
  | "login"
  | "not_connected"
  | "scope_denied"
  | "access_denied"
  | "unavailable"
  | "error";

export type OfficialProviderMode = "mcp" | "oauth" | "none";

export type ConnectorCapabilities = {
  list: boolean;
  search: boolean;
  export: boolean;
  create: boolean;
  autofill: boolean;
  insights: boolean;
};

export type OfficialProviderStatus = {
  provider: "canva" | "instagram";
  available: boolean;
  mode: OfficialProviderMode;
  connected: boolean;
  reason: string;
  username?: string;
  scopes: string[];
  capabilities: ConnectorCapabilities;
};

export type SafeConnectorError = {
  ok: false;
  kind: ConnectorUiState;
  message: string;
  detail?: string;
  loginRequired?: boolean;
  loginUrl?: string;
};

export type SafeConnectorSuccess<T> = { ok: true; data: T };

export type ConnectorResult<T> = SafeConnectorSuccess<T> | SafeConnectorError;

export const EMPTY_CAPABILITIES: ConnectorCapabilities = {
  list: false,
  search: false,
  export: false,
  create: false,
  autofill: false,
  insights: false,
};

export function providerLabel(provider: ExternalMemoryProvider) {
  if (provider === "google-drive") return "Google Drive";
  if (provider === "canva") return "Canva";
  return "Instagram";
}

export function canvaProvenanceLabel(collection = "浮游禪光") {
  return `Canva / ${collection}`;
}

export type InstagramInsightRow = {
  metric: string;
  label: string;
  value: number;
  period: string;
};

export type InstagramInsightsSnapshot = {
  period: string;
  rows: InstagramInsightRow[];
  fetchedAt: number;
};

export type CanvaStyleAnalysis = {
  summary: string;
  colors: string[];
  composition: string;
  studentFit: string;
  recommendations: string[];
  suggestedTags: string[];
};
