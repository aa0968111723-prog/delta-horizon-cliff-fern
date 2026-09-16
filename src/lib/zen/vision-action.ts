import { createSearchParams, type CreateSearch } from "../studio/create-search.ts";

export const VISION_ACTIONS = [
  { id: "continue-style", label: "延續這個風格" },
  { id: "redesign", label: "保留內容重新設計" },
  { id: "story", label: "做成限動" },
  { id: "carousel", label: "做成 Carousel" },
  { id: "reels", label: "做成 Reels Cover" },
  { id: "threads", label: "做成 Threads 圖" },
  { id: "similar", label: "生成相似視覺" },
] as const;

export type VisionActionId = (typeof VISION_ACTIONS)[number]["id"];

const INTO: Partial<Record<VisionActionId, CreateSearch["into"]>> = {
  story: "story",
  carousel: "carousel",
  reels: "reels",
  threads: "threads",
};

export function visionActionOf(label: string): VisionActionId {
  if (/限動|Story/i.test(label)) return "story";
  if (/Carousel/i.test(label)) return "carousel";
  if (/Reels/i.test(label)) return "reels";
  if (/Threads/i.test(label)) return "threads";
  if (/相似/.test(label)) return "similar";
  if (/重新設計|保留內容/.test(label)) return "redesign";
  return "continue-style";
}

/** Spoken idea stays short so from-image does not become a vision dump. */
export function ideaForVisionAction(action: VisionActionId, seed: string) {
  const spoken = (seed.split(/\n/)[0] || seed).replace(/\s+/g, " ").trim().slice(0, 40);
  if (action === "redesign") {
    return `${spoken || "這張圖"}。保留畫面內容，重新設計成適合淡江學生停留的主視覺，不要複製舊作品。`.slice(0, 400);
  }
  if (action === "similar") {
    return `${spoken || "這張圖"}。延續這個風格，生成相似視覺，不要複製舊作品。`.slice(0, 400);
  }
  return spoken || "延續這張圖";
}

export function staysOnImageStudio(action: VisionActionId) {
  return action === "continue-style" || action === "redesign" || action === "similar" || action === "reels";
}

/** Keep the still (asset / Drive file) when turning vision into Story / Carousel / Reels. */
export function createSearchFromVision(opts: {
  action: VisionActionId;
  idea: string;
  assetId?: string;
  remoteId?: string;
}): CreateSearch {
  const into = INTO[opts.action];
  const idea = ideaForVisionAction(opts.action, opts.idea);
  if (opts.assetId) {
    return createSearchParams({ mode: "from-image", idea, asset: opts.assetId, into });
  }
  if (opts.remoteId) {
    return createSearchParams({ mode: "from-drive", idea, remote: opts.remoteId, into });
  }
  if (into) return createSearchParams({ mode: into, idea });
  return createSearchParams({ mode: "from-image", idea });
}
