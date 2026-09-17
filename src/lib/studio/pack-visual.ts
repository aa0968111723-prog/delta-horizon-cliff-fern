import { extractImageAssetId } from "./layout.ts";
import { pagesOf } from "./layers.ts";
import type { Artboard, ContentKind, Project } from "./types.ts";

export type PackVisualTarget = {
  projectId: string;
};

function applyAssetToArtboard(artboard: Artboard, assetId: string): Artboard {
  let found = false;
  const layers = artboard.layers.map((layer) => {
    if (layer.type === "image") {
      found = true;
      return { ...layer, assetId };
    }
    return layer;
  });
  if (found) return { ...artboard, layers };
  if (artboard.background.type === "image") {
    return { ...artboard, background: { ...artboard.background, assetId } };
  }
  return {
    ...artboard,
    background: { ...artboard.background, type: "image", assetId },
  };
}

/** 這一頁的主視覺：圖層優先，沒有圖層就看背景圖。 */
export function pageVisualAsset(page: Artboard | undefined): string | null {
  if (!page) return null;
  const fromLayer = extractImageAssetId(page);
  if (fromLayer) return fromLayer;
  if (page.background.type === "image") return page.background.assetId ?? null;
  return null;
}

/** 這則現在畫面上的主視覺。沒有圖就回 null，不要硬套示範素材。 */
export function visualAssetOf(
  project: Pick<Project, "activeFormatId" | "slides" | "artboards" | "reels">,
): string | null {
  for (const page of pagesOf(project)) {
    const hit = pageVisualAsset(page);
    if (hit) return hit;
  }
  return project.reels?.coverAssetId ?? null;
}

/** 把同一張主視覺畫進這則的每一頁，限動／輪播一起換，文字層不動。 */
export function paintAssetOnProject<
  T extends Pick<Project, "activeFormatId" | "slides" | "artboards" | "contentKind" | "reels">,
>(project: T, assetId: string): T {
  const formatId = project.activeFormatId;
  const pages = pagesOf(project, formatId).map((page) => applyAssetToArtboard(page, assetId));
  const reels =
    project.contentKind === "reels" && project.reels
      ? { ...project.reels, coverAssetId: assetId }
      : project.reels;
  if (!pages.length) return { ...project, reels };
  return {
    ...project,
    slides: { ...project.slides, [formatId]: pages },
    artboards: { ...project.artboards, [formatId]: pages[0]! },
    reels,
  };
}

function kindHasDownloadablePages(kind: ContentKind | undefined): boolean {
  return kind !== "threads";
}

/**
 * 同一則做成的全套裡，有畫面的型態（貼文／輪播／限動／LINE／Reels）。
 * Threads 只有文字，不套圖。
 */
export function spreadVisualAcrossPack(
  projects: Project[],
  sourceId: string,
): PackVisualTarget[] {
  const source = projects.find((item) => item.id === sourceId);
  const pack = projects.filter(
    (item) => item.id === sourceId || item.convertedFromId === sourceId || item.convertedFromId === source?.convertedFromId,
  );
  const members = pack.length ? pack : source ? [source] : [];
  return members
    .filter((item) => kindHasDownloadablePages(item.contentKind))
    .map((item) => ({ projectId: item.id }));
}
