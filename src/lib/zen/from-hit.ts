import type { CitedSource } from "../studio/types.ts";
import type { SearchHit } from "./search.ts";

export function ideaFromHit(hit: SearchHit) {
  if (hit.source === "instagram") {
    return `延續這則 IG 的語氣做新內容，不要複製舊文：${hit.title}。${hit.subtitle}`;
  }
  if (hit.source === "canva") {
    return `延續這個 Canva 設計的品牌 DNA 做新活動，不是直接複製：${hit.title}`;
  }
  if (hit.source === "drive") {
    return `用這份 Drive 素材做新的淡江禪學社網宣：${hit.title}`;
  }
  if (hit.source === "campaign") {
    return `為活動「${hit.title}」生成完整宣傳。${hit.subtitle}`;
  }
  return `根據「${hit.title}」做一篇淡江學生會停下來的內容。`;
}

export function hitActionLabel(hit: SearchHit) {
  if (hit.source === "canva") return "用這個設計生成";
  if (hit.source === "instagram") return "從這則 IG 生成";
  if (hit.source === "drive") return "用這份素材生成";
  if (hit.source === "campaign") return "為這個活動生成";
  return "加入創作";
}

export function memorySourceFromHit(hit: SearchHit): CitedSource["source"] {
  if (
    hit.source === "drive" ||
    hit.source === "canva" ||
    hit.source === "instagram" ||
    hit.source === "generated" ||
    hit.source === "brand"
  ) {
    return hit.source;
  }
  return "brand";
}

export function hitFromIgPost(post: {
  id: string;
  hook?: string;
  caption: string;
  mediaType: string;
  postedAt: number;
  assetId?: string;
  mediaUrl?: string;
}): SearchHit {
  const day = new Date(post.postedAt).toISOString().slice(0, 10);
  return {
    id: post.id,
    source: "instagram",
    title: post.hook || post.caption.split("\n")[0] || "IG 貼文",
    subtitle: `Instagram / ${day}`,
    tags: [post.mediaType],
    thumbAssetId: post.assetId,
    thumbUrl: post.mediaUrl,
  };
}
