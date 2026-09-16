import { formatIdForSurface, type IgSurface } from "../studio/ig-surfaces.ts";
import type { FormatId } from "../studio/types.ts";
import type { ContentItem, ContentType } from "./types.ts";

const COPY_TYPES: ContentType[] = ["Threads", "LINE", "知識內容", "Q&A"];
const STORY_TYPES: ContentType[] = ["Story", "倒數", "互動投票"];

export function surfaceForContentType(type: ContentType): IgSurface {
  if (STORY_TYPES.includes(type)) return "story";
  if (type === "Reels") return "reels";
  if (type === "Carousel") return "carousel";
  return "feed";
}

export function contentWorkKind(type: ContentType): "studio" | "copy" {
  return COPY_TYPES.includes(type) ? "copy" : "studio";
}

export type ContentOpenPlan = {
  hasWork: boolean;
  kind: "studio" | "copy" | "create";
  projectId: string | null;
  surface: IgSurface;
  formatId: FormatId;
};

export function contentOpenPlan(item: ContentItem): ContentOpenPlan {
  const surface = surfaceForContentType(item.type);
  const formatId = formatIdForSurface(surface);
  if (!item.projectId) {
    return { hasWork: false, kind: "create", projectId: null, surface, formatId };
  }
  return {
    hasWork: true,
    kind: contentWorkKind(item.type),
    projectId: item.projectId,
    surface,
    formatId,
  };
}

export function contentOpenLabel(plan: ContentOpenPlan) {
  if (!plan.hasWork) return "開始這則網宣";
  return plan.kind === "copy" ? "打開文案" : "打開網宣";
}
