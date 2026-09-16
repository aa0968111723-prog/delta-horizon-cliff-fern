import { create } from "zustand";

export type SaveStatus = "idle" | "saving" | "saved" | "error";
export type EditorPanel = "layers" | "assets" | "copy" | "inspect" | "ai" | "versions" | "qa";

type UiState = {
  assistantOpen: boolean;
  saveStatus: SaveStatus;
  editorPanel: EditorPanel | null;
  carouselPreview: boolean;
  setAssistantOpen: (open: boolean) => void;
  toggleAssistant: () => void;
  setSaveStatus: (status: SaveStatus) => void;
  setEditorPanel: (panel: EditorPanel | null) => void;
  setCarouselPreview: (open: boolean) => void;
  createOpen: boolean;
  createIntent: string | null;
  setCreateOpen: (open: boolean, intent?: string | null) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
};

export const useUi = create<UiState>((set) => ({
  assistantOpen: false,
  saveStatus: "idle",
  editorPanel: null,
  carouselPreview: false,
  setAssistantOpen: (open) => set({ assistantOpen: open }),
  toggleAssistant: () => set((s) => ({ assistantOpen: !s.assistantOpen })),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setEditorPanel: (editorPanel) => set({ editorPanel }),
  setCarouselPreview: (carouselPreview) => set({ carouselPreview }),
  createOpen: false,
  createIntent: null,
  setCreateOpen: (open, intent = null) => set({ createOpen: open, createIntent: open ? intent : null }),
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
}));
