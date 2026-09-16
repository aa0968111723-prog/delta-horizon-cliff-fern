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
};

export type ConnectorUiState = "idle" | "checking" | "connected" | "login" | "not_connected" | "scope_denied" | "access_denied" | "error";
