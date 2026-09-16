import type { IgMemoryPost } from "./types.ts";
import type { ContentKind, Project } from "../studio/types.ts";

export function captionFromProject(project: Pick<Project, "name" | "copy">) {
  const caption = project.copy.caption?.trim();
  if (caption) return caption;
  const parts = [project.copy.headline.replace(/\n/g, " "), project.copy.body, project.copy.cta, project.copy.hashtags.join(" ")].filter(
    Boolean,
  );
  return parts.join("\n") || project.name;
}

export function mediaTypeFromKind(kind: ContentKind): IgMemoryPost["mediaType"] {
  if (kind === "carousel") return "carousel";
  if (kind === "reels") return "reels";
  return "image";
}

export function buildPublishedPost(input: {
  title: string;
  caption: string;
  kind: ContentKind;
  assetIds?: string[];
  publishedAt?: number;
}): IgMemoryPost {
  const publishedAt = input.publishedAt ?? Date.now();
  const caption = input.caption.trim() || input.title;
  const hook = caption.split("\n").map((line) => line.trim()).find(Boolean) ?? input.title;
  return {
    id: `pub_${publishedAt}`,
    source: "seed",
    mediaType: mediaTypeFromKind(input.kind),
    caption,
    takenAt: publishedAt,
    assetIds: input.assetIds ?? [],
    analysis: {
      hook,
      visual: "剛發布，等官方 Insights 回來再補數字",
      theme: input.title,
      captionLength: caption.length,
      cta: /來坐|留言|連結|報名/.test(caption) ? "有 CTA" : "弱",
      direction: "這篇已進 Content Memory，下次生成會參考。",
      improve: ["發布後看收藏與停留，再決定下一則要生活還是倒數"],
    },
  };
}
