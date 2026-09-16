import { VISION_ACTIONS, type VisionActionId } from "../ai/image-directions.ts";
import type { CitedSource, ContentKind, FormatId } from "../studio/types.ts";
import type { ConvertTargetId } from "./convert.ts";

export type LaunchAction = VisionActionId | "copy";

export const LAUNCH_ACTIONS: { id: LaunchAction; label: string }[] = [
  ...VISION_ACTIONS,
  { id: "copy", label: "生成文案" },
];

export function ideaFromAsset(asset: { name: string; tags: string[]; category: string }) {
  const tags = asset.tags.slice(0, 4).join("、");
  return `延續「${asset.name}」這張素材做淡江禪學社 IG。${tags ? `畫面關鍵：${tags}。` : ""}不要複製舊海報，做成學生會停下來的新內容。`;
}

export function citedFromAsset(asset: {
  name: string;
  tags: string[];
  category: string;
  source: string;
}): CitedSource {
  const source =
    asset.source === "drive" ||
    asset.source === "canva" ||
    asset.source === "instagram" ||
    asset.source === "generated"
      ? asset.source
      : "brand";
  return {
    source,
    label: asset.name,
    detail: asset.tags.join(" · ") || asset.category,
  };
}

export function formatForLaunchAction(action: LaunchAction): FormatId {
  if (action === "story") return "story";
  if (action === "reels-cover") return "reels-cover";
  return "feed-portrait";
}

export function convertTargetForLaunchAction(action: LaunchAction): ConvertTargetId {
  if (action === "story") return "story";
  if (action === "carousel") return "carousel";
  if (action === "reels-cover") return "reels";
  return "post";
}

export function contentKindForLaunchAction(action: LaunchAction): ContentKind {
  if (action === "story") return "story";
  if (action === "carousel") return "carousel";
  if (action === "reels-cover") return "reels";
  return "ig-post";
}

export function formatForAsset(asset: { category: string; width: number; height: number }): FormatId {
  if (asset.category === "story") return "story";
  if (asset.category === "reels") return "reels-cover";
  if (asset.width > 0 && asset.width === asset.height) return "feed-square";
  if (asset.width > 0 && asset.height / asset.width > 1.5) return "story";
  return "feed-portrait";
}

export function analysisFromAsset(asset: { name: string; tags: string[]; category: string }) {
  return {
    content: asset.name,
    color: asset.tags.join("、") || "苔綠與沙色",
    composition: asset.category,
    brand: "淡江禪學社 龜龜 三色光",
  };
}

export function launchSuccessMessage(action: LaunchAction) {
  if (action === "story") return "已做成限動，打開 IG Preview";
  if (action === "carousel") return "已做成 Carousel，打開 IG Preview";
  if (action === "reels-cover") return "已做成 Reels Cover，打開 IG Preview";
  if (action === "similar") return "已生成相似視覺，打開 IG Preview";
  if (action === "continue-style") return "已延續這個風格，打開 IG Preview";
  if (action === "redesign") return "已重新設計，打開 IG Preview";
  return "已生成文案，打開 IG Preview";
}
