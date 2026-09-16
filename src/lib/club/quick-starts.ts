import type { ContentKind } from "../studio/types.ts";
import type { CreateHandoff, CreateTab } from "../create/handoff.ts";

export type QuickStart = {
  id: string;
  label: string;
  to: "/assistant" | "/create" | "/campaigns" | "/connections" | "/instagram";
  tab?: CreateTab;
  openSearch?: boolean;
};

export const QUICK_STARTS: QuickStart[] = [
  { id: "post", label: "生成 IG 貼文", to: "/create", tab: "campaign" },
  { id: "image", label: "生成圖片", to: "/create", tab: "image" },
  { id: "story", label: "生成 Story", to: "/create", tab: "campaign" },
  { id: "carousel", label: "生成 Carousel", to: "/create", tab: "campaign" },
  { id: "reels", label: "生成 Reels", to: "/create", tab: "campaign" },
  { id: "campaign", label: "建立活動", to: "/campaigns" },
  { id: "idea", label: "從一句想法開始", to: "/create", tab: "campaign" },
  { id: "photo", label: "從一張圖片開始", to: "/create", tab: "vision" },
  { id: "drive", label: "從 Google Drive 素材開始", to: "/connections", openSearch: true },
  { id: "canva", label: "從 Canva 設計開始", to: "/connections", openSearch: true },
  { id: "ig", label: "從以前 IG 貼文開始", to: "/instagram" },
];

const START_IDEAS: Record<string, string> = {
  post: "最近是不是很久沒有好好坐下來？",
  story: "做三到五張限動，讓淡江學生今晚想坐下",
  carousel: "做一篇 IG Carousel，先問生活再帶活動",
  reels: "做一支 20 秒 Reels，0–3 秒先問生活",
  idea: "下週有一場茶會",
  image: "我要宣傳茶會",
};

export function convertKindFromQuickStart(id: string): ContentKind | undefined {
  if (id === "story") return "story";
  if (id === "carousel") return "carousel";
  if (id === "reels") return "reels";
  if (id === "post") return "ig-post";
  return undefined;
}

export function handoffFromQuickStart(action: QuickStart): CreateHandoff {
  const convertKind = convertKindFromQuickStart(action.id);
  const autoRun = action.id === "post" || action.id === "story" || action.id === "carousel" || action.id === "reels";
  return {
    idea: START_IDEAS[action.id],
    tab: action.tab,
    convertKind,
    autoRun,
    sourceLabel: action.label,
  };
}
