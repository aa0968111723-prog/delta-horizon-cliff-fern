import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExternalMemoryItem } from "@/lib/connections/types";

type ConnectionState = {
  driveFolderId: string;
  driveFolderName: string;
  driveItems: ExternalMemoryItem[];
  driveLastSyncAt: number | null;
  selectDriveFolder: (id: string, name: string) => void;
  syncDriveItems: (items: ExternalMemoryItem[]) => void;
  rememberDriveItems: (items: ExternalMemoryItem[]) => void;
  updateDriveSnippet: (id: string, snippet: string) => void;
  disconnectDriveMemory: () => void;
};

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      driveFolderId: "root",
      driveFolderName: "我的雲端硬碟",
      driveItems: [],
      driveLastSyncAt: null,
      selectDriveFolder: (driveFolderId, driveFolderName) => set({ driveFolderId, driveFolderName }),
      syncDriveItems: (incoming) =>
        set((state) => {
          const previous = new Map(state.driveItems.map((item) => [item.id, item]));
          const driveItems = incoming.map((item) => ({
            ...previous.get(item.id),
            ...item,
            snippet: item.snippet || previous.get(item.id)?.snippet || "",
          }));
          return { driveItems, driveLastSyncAt: Date.now() };
        }),
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
    }),
    {
      name: "zen-connection-memory-v1",
      version: 1,
      skipHydration: true,
      partialize: (state) => ({
        driveFolderId: state.driveFolderId,
        driveFolderName: state.driveFolderName,
        driveItems: state.driveItems,
        driveLastSyncAt: state.driveLastSyncAt,
      }),
    },
  ),
);
