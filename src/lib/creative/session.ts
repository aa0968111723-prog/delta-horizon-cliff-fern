import type { CopyBlock } from "@/lib/ai/copy";
import type { CreativePack } from "@/lib/ai/pack";

export type CanvaLoopStep = "kit" | "need-connect" | "opened";

export type LastCreateSession = {
  pack: CreativePack;
  dirId: string | null;
  copies: CopyBlock[];
  tone: CopyBlock["tone"];
  imageSrc: string | null;
  createdCampaignId?: string;
  projectId?: string;
  aspect: "4:5" | "1:1" | "9:16";
  canvaKit?: string;
  canvaStep?: CanvaLoopStep;
  canvaEditUrl?: string | null;
  savedAt: number;
};

const KEY = "tkz-last-create-v1";

export function sessionStillFresh(session: LastCreateSession | null | undefined, now = Date.now()) {
  if (!session?.pack) return false;
  return now - session.savedAt < 24 * 60 * 60 * 1000;
}

export function writeLastSession(session: LastCreateSession) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* quota — pack still lives in React state for this visit */
  }
}

export function readLastSession(): LastCreateSession | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastCreateSession;
    return sessionStillFresh(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
