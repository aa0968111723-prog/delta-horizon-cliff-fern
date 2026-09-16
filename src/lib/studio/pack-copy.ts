import { convertCopy } from "./convert-copy.ts";
import { convertPackOf } from "./convert-pack.ts";
import { applyKindLayout, reelsFromCopy } from "./convert.ts";
import { applyCopyToArtboard } from "./layout.ts";
import { pagesOf } from "./layers.ts";
import { paintAssetOnProject, visualAssetOf } from "./pack-visual.ts";
import { kindUsesPagedLayout } from "./status.ts";
import type { BrandKit, ContentKind, CopyDeck, Project, ReelsScript } from "./types.ts";

export type PackCopyUpdate = {
  projectId: string;
  copy: CopyDeck;
  reels?: ReelsScript;
  rebuildLayout: boolean;
};

export function needsLayoutRebuild(kind: ContentKind): boolean {
  return kindUsesPagedLayout(kind);
}

/**
 * 把一版文案同步到同一則做成的全套。
 * 貼文／限動／LINE／Threads／Reels 各用自己的轉換，不用再做成一次。
 */
export function spreadCopyAcrossPack(
  projects: Project[],
  sourceId: string,
  sourceCopy: CopyDeck,
): PackCopyUpdate[] {
  const pack = convertPackOf(projects, sourceId);
  const members = pack.length ? pack : projects.filter((item) => item.id === sourceId);
  return members.map((member) => {
    const copy = convertCopy(sourceCopy, member.contentKind);
    return {
      projectId: member.id,
      copy,
      rebuildLayout: needsLayoutRebuild(member.contentKind),
      ...(member.contentKind === "reels"
        ? { reels: reelsFromCopy(copy, { ...member.brief, fromPhoto: Boolean(visualAssetOf(member)) }) }
        : {}),
    };
  });
}

/**
 * 單頁只改文字層；輪播／限動依新文案重排各頁，主視覺留著。
 */
export function applyPackCopyToProject(project: Project, brand: BrandKit | null, copy: CopyDeck): Project {
  if (needsLayoutRebuild(project.contentKind) && brand) {
    const imageId = visualAssetOf(project);
    const next = applyKindLayout({ ...project, copy }, brand, project.contentKind);
    return imageId ? paintAssetOnProject(next, imageId) : next;
  }
  const formatId = project.activeFormatId;
  const pages = pagesOf(project, formatId).map((page) => applyCopyToArtboard(page, copy));
  if (!pages.length) return { ...project, copy };
  return {
    ...project,
    copy,
    slides: { ...project.slides, [formatId]: pages },
    artboards: { ...project.artboards, [formatId]: pages[0]! },
  };
}
