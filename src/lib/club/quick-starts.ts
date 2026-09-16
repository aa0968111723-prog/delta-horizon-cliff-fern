export type QuickStart = {
  id: string;
  label: string;
  to: "/assistant" | "/create" | "/campaigns" | "/connections" | "/instagram";
  tab?: "campaign" | "copy" | "image" | "vision" | "convert";
  openSearch?: boolean;
};

export const QUICK_STARTS: QuickStart[] = [
  { id: "post", label: "生成 IG 貼文", to: "/assistant" },
  { id: "image", label: "生成圖片", to: "/create", tab: "image" },
  { id: "story", label: "生成 Story", to: "/create", tab: "convert" },
  { id: "carousel", label: "生成 Carousel", to: "/create", tab: "convert" },
  { id: "reels", label: "生成 Reels", to: "/create", tab: "convert" },
  { id: "campaign", label: "建立活動", to: "/campaigns" },
  { id: "idea", label: "從一句想法開始", to: "/create", tab: "campaign" },
  { id: "photo", label: "從一張圖片開始", to: "/create", tab: "vision" },
  { id: "drive", label: "從 Google Drive 素材開始", to: "/connections", openSearch: true },
  { id: "canva", label: "從 Canva 設計開始", to: "/connections", openSearch: true },
  { id: "ig", label: "從以前 IG 貼文開始", to: "/instagram" },
];
