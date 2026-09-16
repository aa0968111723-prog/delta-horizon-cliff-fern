import { create } from "zustand";
import type { Brief } from "@/lib/studio/types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";
export type EditorPanel = "layers" | "assets" | "copy" | "inspect" | "ai" | "versions" | "qa";

type UiState = {
  assistantOpen: boolean;
  creativePreset: Partial<Brief> | null;
  saveStatus: SaveStatus;
  editorPanel: EditorPanel | null;
  carouselPreview: boolean;
  setAssistantOpen: (open: boolean) => void;
  startCreative: (preset?: Partial<Brief>) => void;
  clearCreativePreset: () => void;
  toggleAssistant: () => void;
  setSaveStatus: (status: SaveStatus) => void;
  setEditorPanel: (panel: EditorPanel | null) => void;
  setCarouselPreview: (open: boolean) => void;
};

export const useUi = create<UiState>((set) => ({
  assistantOpen: false,
  creativePreset: null,
  saveStatus: "idle",
  editorPanel: null,
  carouselPreview: false,
  setAssistantOpen: (open) => set({ assistantOpen: open }),
  startCreative: (creativePreset = {}) => set({ assistantOpen: true, creativePreset }),
  clearCreativePreset: () => set({ creativePreset: null }),
  toggleAssistant: () => set((s) => ({ assistantOpen: !s.assistantOpen })),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setEditorPanel: (editorPanel) => set({ editorPanel }),
  setCarouselPreview: (carouselPreview) => set({ carouselPreview }),
}));
