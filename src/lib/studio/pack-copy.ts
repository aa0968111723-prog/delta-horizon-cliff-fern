import { applyCopyToArtboard } from "./layout";
import { pagesOf } from "./layers";
import type { BrandKit, CopyDeck, Project, ReelsScript } from "./types";

export type PackCopyUpdate = {
  projectId: string;
  copy: CopyDeck;
  reels?: ReelsScript | null;
};

export function applyPackCopyToProject(project: Project, _brand: BrandKit, copy: CopyDeck): Project {
  const formatId = project.activeFormatId;
  const pages = pagesOf(project, formatId).map((page) => applyCopyToArtboard(page, copy));
  return {
    ...project,
    copy,
    artboards: pages[0] ? { ...project.artboards, [formatId]: pages[0] } : project.artboards,
    slides: { ...project.slides, [formatId]: pages },
    updatedAt: Date.now(),
  };
}

export function spreadCopyAcrossPack(
  projects: Project[],
  sourceId: string,
  deck: CopyDeck,
): PackCopyUpdate[] {
  const source = projects.find((item) => item.id === sourceId);
  const pack = projects.filter(
    (item) =>
      item.id === sourceId ||
      item.convertedFromId === sourceId ||
      item.convertedFromId === source?.convertedFromId,
  );
  const members = pack.length ? pack : source ? [source] : [];
  return members.map((item) => ({
    projectId: item.id,
    copy: {
      ...item.copy,
      ...deck,
      handle: deck.handle || item.copy.handle,
      hashtags: deck.hashtags?.length ? deck.hashtags : item.copy.hashtags,
    },
    reels: item.reels
      ? {
          ...item.reels,
          hook: deck.headline || item.reels.hook,
        }
      : item.reels,
  }));
}
