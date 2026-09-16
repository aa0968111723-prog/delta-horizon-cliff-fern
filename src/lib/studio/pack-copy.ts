import { convertCopy } from "./convert-copy.ts";
import { convertPackOf } from "./convert-pack.ts";
import { reelsFromCopy } from "./convert.ts";
import type { CopyDeck, Project, ReelsScript } from "./types.ts";

export type PackCopyUpdate = {
  projectId: string;
  copy: CopyDeck;
  reels?: ReelsScript;
};

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
      ...(member.contentKind === "reels" ? { reels: reelsFromCopy(copy, member.brief) } : {}),
    };
  });
}
