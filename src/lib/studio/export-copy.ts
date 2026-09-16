import type { Project } from "./types.ts";

export function buildExportCopyPack(project: Project) {
  const pack = project.plan?.copyPack;
  const variant = pack?.variants[0];
  const caption = variant
    ? [variant.body, variant.cta, variant.hashtags.join(" ")].filter(Boolean).join("\n\n")
    : [project.copy.caption, project.copy.hashtags.join(" ")].filter(Boolean).join("\n\n");

  return [
    `禪作所內容包｜${project.name}`,
    `尺寸：${project.activeFormatId}`,
    "這是本機輸出文案，不是 Instagram 發文，也不含官方 Insights。",
    "",
    "Caption",
    caption || "（尚未有文案）",
    project.copy.altText ? `\nAlt\n${project.copy.altText}` : "",
    pack?.threads ? `\nThreads\n${pack.threads}` : "",
    pack?.line ? `\nLINE\n${pack.line}` : "",
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim() + "\n";
}
