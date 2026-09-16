import type { ContentKind, FormatId } from "../studio/types.ts";

export const HANDOFF_KEY = "zen-handoff";
export const IDEA_KEY = "zen-idea";

export type CreateTab = "campaign" | "copy" | "image" | "vision" | "convert";

export type CreateHandoff = {
  idea?: string;
  tab?: CreateTab;
  imageDataUrl?: string;
  imageSrc?: string;
  visionNote?: string;
  visionAction?: string;
  convertKind?: ContentKind;
  formatId?: FormatId;
  assetId?: string;
  sourceLabel?: string;
  autoRun?: boolean;
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
  if (
    !parsed.idea &&
    !parsed.imageDataUrl &&
    !parsed.imageSrc &&
    !parsed.convertKind &&
    !parsed.assetId &&
    !parsed.visionAction &&
    !parsed.autoRun
  ) {
    return idea ? { idea } : null;
  }
  return parsed;
}

let lastConsumed: CreateHandoff | null = null;
let autoRunUsed = false;

export function writeHandoff(payload: CreateHandoff) {
  if (typeof window === "undefined") return;
  lastConsumed = null;
  autoRunUsed = false;
  window.sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(payload));
  if (payload.idea) window.sessionStorage.setItem(IDEA_KEY, payload.idea);
}

export function consumeHandoff(): CreateHandoff | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(HANDOFF_KEY);
  const idea = window.sessionStorage.getItem(IDEA_KEY);
  if (raw || idea) {
    lastConsumed = parseHandoff(raw, idea);
    autoRunUsed = false;
    window.sessionStorage.removeItem(HANDOFF_KEY);
    window.sessionStorage.removeItem(IDEA_KEY);
  }
  return lastConsumed;
}

export function takeAutoRun(flag?: boolean) {
  if (!flag) return false;
  if (autoRunUsed) return false;
  autoRunUsed = true;
  return true;
}

export function readHandoff(): CreateHandoff | null {
  return consumeHandoff();
}
