import { create } from "zustand";
import type { Brief } from "@/lib/studio/types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";
export type EditorPanel = "layers" | "assets" | "copy" | "inspect" | "ai" | "versions" | "qa";
export type CreationDesk = "plan" | "copy" | "art";

export type StylePrompt = {
  title: string;
  collection: string;
  notes: string;
  provider: string;
};

type UiState = {
  assistantOpen: boolean;
  /** 底部中央的「＋ AI 創作」面板 */
  createOpen: boolean;
  saveStatus: SaveStatus;
  editorPanel: EditorPanel | null;
  carouselPreview: boolean;
  stylePrompt: StylePrompt | null;
  creationDesk: CreationDesk;
  setAssistantOpen: (open: boolean) => void;
  startCreative: (preset?: Partial<Brief>, contentLinkId?: string | null) => void;
  primeCreative: (preset?: Partial<Brief>, contentLinkId?: string | null) => void;
  clearCreativePreset: () => void;
  clearContentLink: () => void;
  toggleAssistant: () => void;
  setCreateOpen: (open: boolean) => void;
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
  stylePrompt: null,
  creationDesk: "plan",
  setAssistantOpen: (open) => set({ assistantOpen: open }),
  startCreative: (creativePreset = {}, contentLinkId = null) =>
    set({ assistantOpen: true, creativePreset, contentLinkId, creationDesk: "plan" }),
  primeCreative: (creativePreset = {}, contentLinkId = null) =>
    set({ creativePreset, contentLinkId, creationDesk: "plan" }),
  clearCreativePreset: () => set({ creativePreset: null }),
  clearContentLink: () => set({ contentLinkId: null }),
  toggleAssistant: () => set((s) => ({ assistantOpen: !s.assistantOpen })),
  setCreateOpen: (createOpen) => set({ createOpen }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setEditorPanel: (editorPanel) => set({ editorPanel }),
  setCarouselPreview: (carouselPreview) => set({ carouselPreview }),
}));
