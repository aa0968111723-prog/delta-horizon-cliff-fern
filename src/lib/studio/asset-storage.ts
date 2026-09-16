import {
  deleteAssetBlob,
  getAssetBlob,
  hasAssetBlob,
  putAssetBlob,
} from "./assets-idb";

export type AssetBackend = "local" | "cloud";

export type AssetStorage = {
  backend: AssetBackend;
  /** Human-readable location. Must not claim cloud sync unless backend === "cloud". */
  label: string;
  synced: boolean;
  put: (id: string, blob: Blob) => Promise<void>;
  get: (id: string) => Promise<Blob | undefined>;
  delete: (id: string) => Promise<void>;
  has: (id: string) => Promise<boolean>;
};

export const localAssetStorage: AssetStorage = {
  backend: "local",
  label: "此裝置（尚未連接雲端）",
  synced: false,
  put: putAssetBlob,
  get: getAssetBlob,
  delete: deleteAssetBlob,
  has: hasAssetBlob,
};

/**
 * Replaceable blob backend. Swap the return value when a remote adapter exists.
 * Callers must read `synced` / `label` instead of assuming upload succeeded to a server.
 */
export function getAssetStorage(): AssetStorage {
  return localAssetStorage;
}
