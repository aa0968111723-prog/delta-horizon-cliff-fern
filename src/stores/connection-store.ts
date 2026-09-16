import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExternalMemoryItem, ExternalMemoryProvider } from "@/lib/connections/types";

export type StyleReference = {
  id: string;
  provider: ExternalMemoryProvider;
  title: string;
  collection: string;
  notes: string;
  webUrl: string;
  addedAt: number;
};

type ConnectionState = {
  driveFolderId: string;
  driveFolderName: string;
  driveItems: ExternalMemoryItem[];
  driveLastSyncAt: number | null;
  canvaItems: ExternalMemoryItem[];
  canvaLastSyncAt: number | null;
  instagramItems: ExternalMemoryItem[];
  instagramLastSyncAt: number | null;
  instagramUsername: string;
  styleReferences: StyleReference[];
  selectDriveFolder: (id: string, name: string) => void;
  syncDriveItems: (items: ExternalMemoryItem[]) => void;
  rememberDriveItems: (items: ExternalMemoryItem[]) => void;
  updateDriveSnippet: (id: string, snippet: string) => void;
  disconnectDriveMemory: () => void;
  syncCanvaItems: (items: ExternalMemoryItem[]) => void;
  rememberCanvaItems: (items: ExternalMemoryItem[]) => void;
  updateCanvaSnippet: (id: string, snippet: string) => void;
  disconnectCanvaMemory: () => void;
  syncInstagramItems: (items: ExternalMemoryItem[]) => void;
  disconnectInstagramMemory: () => void;
  setInstagramUsername: (username: string) => void;
  addStyleReference: (item: ExternalMemoryItem, notes?: string) => StyleReference;
  removeStyleReference: (id: string) => void;
};

function mergeItems(previous: ExternalMemoryItem[], incoming: ExternalMemoryItem[]) {
  const map = new Map(previous.map((item) => [item.id, item]));
  return incoming.map((item) => ({
    ...map.get(item.id),
    ...item,
    snippet: item.snippet || map.get(item.id)?.snippet || "",
    collection: item.collection || map.get(item.id)?.collection,
    sourceDate: item.sourceDate || map.get(item.id)?.sourceDate,
  }));
}

export function allExternalItems(state: Pick<ConnectionState, "driveItems" | "canvaItems" | "instagramItems">) {
  return [...state.driveItems, ...state.canvaItems, ...state.instagramItems];
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      driveFolderId: "root",
      driveFolderName: "我的雲端硬碟",
      driveItems: [],
      driveLastSyncAt: null,
      canvaItems: [],
      canvaLastSyncAt: null,
      instagramItems: [],
      instagramLastSyncAt: null,
      instagramUsername: "",
      styleReferences: [],
      selectDriveFolder: (driveFolderId, driveFolderName) => set({ driveFolderId, driveFolderName }),
      syncDriveItems: (incoming) =>
        set((state) => ({ driveItems: mergeItems(state.driveItems, incoming), driveLastSyncAt: Date.now() })),
      rememberDriveItems: (incoming) =>
        set((state) => {
          const merged = new Map(state.driveItems.map((item) => [item.id, item]));
          for (const item of incoming) {
            const previous = merged.get(item.id);
            merged.set(item.id, { ...previous, ...item, snippet: item.snippet || previous?.snippet || "" });
          }
          return { driveItems: [...merged.values()], driveLastSyncAt: Date.now() };
        }),
      updateDriveSnippet: (id, snippet) =>
        set((state) => ({
          driveItems: state.driveItems.map((item) =>
            item.id === id ? { ...item, snippet, syncedAt: Date.now() } : item,
          ),
        })),
      disconnectDriveMemory: () =>
        set({
          driveFolderId: "root",
          driveFolderName: "我的雲端硬碟",
          driveItems: [],
          driveLastSyncAt: null,
        }),
      syncCanvaItems: (incoming) =>
        set((state) => ({ canvaItems: mergeItems(state.canvaItems, incoming), canvaLastSyncAt: Date.now() })),
      rememberCanvaItems: (incoming) =>
        set((state) => {
          const merged = new Map(state.canvaItems.map((item) => [item.id, item]));
          for (const item of incoming) merged.set(item.id, { ...merged.get(item.id), ...item });
          return { canvaItems: [...merged.values()], canvaLastSyncAt: Date.now() };
        }),
      updateCanvaSnippet: (id, snippet) =>
        set((state) => ({
          canvaItems: state.canvaItems.map((item) =>
            item.id === id ? { ...item, snippet, syncedAt: Date.now() } : item,
          ),
        })),
      disconnectCanvaMemory: () => set({ canvaItems: [], canvaLastSyncAt: null }),
      syncInstagramItems: (incoming) =>
        set({ instagramItems: incoming, instagramLastSyncAt: Date.now() }),
      disconnectInstagramMemory: () => set({ instagramItems: [], instagramLastSyncAt: null, instagramUsername: "" }),
      setInstagramUsername: (instagramUsername) => set({ instagramUsername }),
      addStyleReference: (item, notes) => {
        const reference: StyleReference = {
          id: `${item.provider}:${item.id}`,
          provider: item.provider,
          title: item.title,
          collection: item.collection || (item.provider === "canva" ? "浮游禪光" : item.provider),
          notes: notes || item.snippet || item.title,
          webUrl: item.webUrl,
          addedAt: Date.now(),
        };
        set((state) => ({
          styleReferences: [reference, ...state.styleReferences.filter((row) => row.id !== reference.id)].slice(0, 12),
        }));
        return reference;
      },
      removeStyleReference: (id) =>
        set((state) => ({ styleReferences: state.styleReferences.filter((item) => item.id !== id) })),
    }),
    {
      name: "zen-connection-memory-v1",
      version: 2,
      skipHydration: true,
      partialize: (state) => ({
        driveFolderId: state.driveFolderId,
        driveFolderName: state.driveFolderName,
        driveItems: state.driveItems,
        driveLastSyncAt: state.driveLastSyncAt,
        canvaItems: state.canvaItems,
        canvaLastSyncAt: state.canvaLastSyncAt,
        instagramItems: state.instagramItems,
        instagramLastSyncAt: state.instagramLastSyncAt,
        instagramUsername: state.instagramUsername,
        styleReferences: state.styleReferences,
      }),
    },
  ),
);
