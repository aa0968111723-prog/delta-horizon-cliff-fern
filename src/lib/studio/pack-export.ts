import { packTextOnlyMembers, packVisualMembers } from "./convert-pack.ts";
import { packCaptionsFilename } from "./export-name.ts";
import { pagesOf } from "./layers.ts";
import { packChannelForKind, packText } from "./post-pack.ts";
import { reelsScriptText, shotListText } from "./reels-cover.ts";
import { contentKindLabel } from "./status.ts";
import type { ContentKind, Project } from "./types.ts";

export { packCaptionsFilename, packTextOnlyMembers, packVisualMembers };

export type PackMember = Pick<Project, "id" | "name" | "contentKind" | "copy" | "reels" | "artboards" | "slides" | "activeFormatId">;

/** 有畫面可以匯出 PNG 的全套成員。Threads 不算；還沒排版的也不算。 */
export function packDownloadableMembers<T extends PackMember>(members: T[]): T[] {
  return packVisualMembers(members).filter((item) => pagesOf(item).length > 0);
}

export function packSkippedKinds(members: PackMember[]): ContentKind[] {
  const downloadable = new Set(packDownloadableMembers(members).map((item) => item.id));
  return members.filter((item) => !downloadable.has(item.id)).map((item) => item.contentKind);
}

/** 一份可貼上 IG／Threads／LINE 的文案，Reels 另外附腳本與拍攝清單。 */
export function packCaptionsText(members: PackMember[]): string {
  const lines: string[] = [
    "禪光工作室 · 全套發文文案",
    "貼到 IG、Threads 或 LINE 就能發。Threads 沒有圖。",
    "",
  ];
  for (const item of members) {
    const label = contentKindLabel(item.contentKind);
    const caption = packText(item.copy, packChannelForKind(item.contentKind));
    const alt = item.copy.altText.trim();
    lines.push(`## ${label}`);
    lines.push(caption || "（還沒有文案）");
    if (alt) {
      lines.push("", `Alt：${alt}`);
    }
    if (item.contentKind === "reels" && item.reels) {
      lines.push("", "腳本", reelsScriptText(item.reels), "", "拍攝清單", shotListText(item.reels));
    }
    lines.push("");
  }
  return `${lines.join("\n").trim()}\n`;
}

export function packCaptionsBlob(members: PackMember[]): { filename: string; text: string } {
  const root = members[0];
  return {
    filename: packCaptionsFilename(root?.name ?? "禪光"),
    text: packCaptionsText(members),
  };
}
