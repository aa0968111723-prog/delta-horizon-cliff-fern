import type { Project } from "./types.ts";

export function buildExportCopyPack(project: Project) {
  const pack = project.plan?.copyPack;
  const variant = pack?.variants.find((item) => item.tone === "學生版") ?? pack?.variants[0];
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
    pack?.storyFrames?.length ? `\nStory\n${pack.storyFrames.map((item, index) => `${index + 1}. ${item}`).join("\n")}` : "",
    pack?.reelsScript?.length ? `\nReels\n${pack.reelsScript.map((item) => `${item.timing} ${item.subtitle}`).join("\n")}` : "",
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim() + "\n";
}
