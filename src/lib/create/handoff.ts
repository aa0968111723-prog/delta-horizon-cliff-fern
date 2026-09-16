import type { ContentKind, FormatId } from "../studio/types.ts";

export const HANDOFF_KEY = "zen-handoff";
export const IDEA_KEY = "zen-idea";

export type CreateTab = "campaign" | "copy" | "image" | "vision" | "convert";

export type CreateHandoff = {
  idea?: string;
  tab?: CreateTab;
  imageDataUrl?: string;
  visionNote?: string;
  visionAction?: string;
  convertKind?: ContentKind;
  formatId?: FormatId;
  assetId?: string;
  sourceLabel?: string;
};

export function parseHandoff(raw: string | null, idea: string | null): CreateHandoff | null {
  let parsed: CreateHandoff = {};
  if (raw) {
    try {
      const value = JSON.parse(raw) as CreateHandoff;
      if (value && typeof value === "object") parsed = value;
    } catch {
      parsed = {};
    }
  }
  if (idea && !parsed.idea) parsed.idea = idea;
  if (!parsed.idea && !parsed.imageDataUrl && !parsed.convertKind && !parsed.assetId && !parsed.visionAction) {
    return idea ? { idea } : null;
  }
  return parsed;
}

export function writeHandoff(payload: CreateHandoff) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(payload));
  if (payload.idea) window.sessionStorage.setItem(IDEA_KEY, payload.idea);
}

export function readHandoff(): CreateHandoff | null {
  if (typeof window === "undefined") return null;
  const parsed = parseHandoff(window.sessionStorage.getItem(HANDOFF_KEY), window.sessionStorage.getItem(IDEA_KEY));
  window.sessionStorage.removeItem(HANDOFF_KEY);
  window.sessionStorage.removeItem(IDEA_KEY);
  return parsed;
}
