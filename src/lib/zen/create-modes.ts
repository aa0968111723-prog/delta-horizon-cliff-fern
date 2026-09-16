import type { ContentType } from "../studio/types.ts";

export type CreateMode = "post" | "image" | "story" | "carousel" | "reels" | "idea" | "photo" | "drive" | "canva" | "ig";

export const CREATE_MODES: CreateMode[] = ["post", "image", "story", "carousel", "reels", "idea", "photo", "drive", "canva", "ig"];

export function isCreateMode(v: unknown): v is CreateMode {
  return typeof v === "string" && (CREATE_MODES as string[]).includes(v);
}

export function modeToContentType(mode: CreateMode): ContentType {
  switch (mode) {
    case "story":
      return "story";
    case "carousel":
      return "carousel";
    case "reels":
      return "reels";
    default:
      return "ig-post";
  }
}

export const MODE_LABEL: Record<CreateMode, string> = {
  post: "生成 IG 貼文",
  image: "生成圖片",
  story: "生成 Story",
  carousel: "生成 Carousel",
  reels: "生成 Reels",
  idea: "從一句想法開始",
  photo: "從一張圖片開始",
  drive: "從 Google Drive 素材開始",
  canva: "從 Canva 設計開始",
  ig: "從以前的 IG 貼文開始",
};
