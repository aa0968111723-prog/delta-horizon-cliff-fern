import { create } from "zustand";

export type SaveStatus = "idle" | "saving" | "saved" | "error";
export type EditorPanel = "layers" | "assets" | "copy" | "inspect" | "ai" | "versions" | "qa";

type UiState = {
  assistantOpen: boolean;
  createOpen: boolean;
  saveStatus: SaveStatus;
  editorPanel: EditorPanel | null;
  carouselPreview: boolean;
  setAssistantOpen: (open: boolean) => void;
  setCreateOpen: (open: boolean) => void;
  toggleAssistant: () => void;
  setSaveStatus: (status: SaveStatus) => void;
  setEditorPanel: (panel: EditorPanel | null) => void;
  setCarouselPreview: (open: boolean) => void;
};

export const useUi = create<UiState>((set) => ({
  assistantOpen: false,
  createOpen: false,
  saveStatus: "idle",
  editorPanel: null,
  carouselPreview: false,
  setAssistantOpen: (open) => set({ assistantOpen: open }),
  setCreateOpen: (open) => set({ createOpen: open }),
  toggleAssistant: () => set((s) => ({ assistantOpen: !s.assistantOpen })),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setEditorPanel: (editorPanel) => set({ editorPanel }),
  setCarouselPreview: (carouselPreview) => set({ carouselPreview }),
}));
