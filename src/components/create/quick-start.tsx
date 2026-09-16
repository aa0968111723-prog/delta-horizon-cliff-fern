import { Link } from "@tanstack/react-router";
import {
  CalendarPlus,
  Image as ImageIcon,
  Images,
  Instagram,
  Layers,
  Lightbulb,
  PenLine,
  Play,
  Sparkles,
  SquareStack,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickStartItem = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  to: string;
  search?: Record<string, string>;
  tone: "clear" | "warm" | "night";
};

/** 「我現在想創作什麼」的入口。前六個是內容型態，後五個是「從什麼開始」。 */
export const QUICK_START: QuickStartItem[] = [
  {
    id: "ig-post",
    label: "生成 IG 貼文",
    hint: "單張 4:5",
    icon: PenLine,
    to: "/create",
    search: { kind: "ig-post" },
    tone: "clear",
  },
  {
    id: "image",
    label: "生成圖片",
    hint: "先給三個視覺方向",
    icon: ImageIcon,
    to: "/create",
    search: { kind: "ig-post", step: "visual" },
    tone: "warm",
  },
  {
    id: "story",
    label: "生成 Story",
    hint: "9:16 三到五張",
    icon: SquareStack,
    to: "/create",
    search: { kind: "story" },
    tone: "night",
  },
  {
    id: "carousel",
    label: "生成 Carousel",
    hint: "多頁講完一件事",
    icon: Layers,
    to: "/create",
    search: { kind: "carousel" },
    tone: "clear",
  },
  {
    id: "reels",
    label: "生成 Reels",
    hint: "20 秒腳本＋封面",
    icon: Video,
    to: "/create",
    search: { kind: "reels" },
    tone: "night",
  },
  {
    id: "campaign",
    label: "建立活動",
    hint: "一次排完整宣傳",
    icon: CalendarPlus,
    to: "/campaigns",
    search: { new: "1" },
    tone: "warm",
  },
  {
    id: "from-idea",
    label: "從一句想法開始",
    hint: "打一句話就好",
    icon: Lightbulb,
    to: "/create",
    search: { from: "idea" },
    tone: "warm",
  },
  {
    id: "from-image",
    label: "從一張圖片開始",
    hint: "AI 讀圖再寫文案",
    icon: Sparkles,
    to: "/create",
    search: { from: "image" },
    tone: "clear",
  },
  {
    id: "from-assets",
    label: "從素材庫開始",
    hint: "挑一張現有素材",
    icon: Images,
    to: "/assets",
    tone: "night",
  },
  {
    id: "from-drive",
    label: "從 Google Drive 開始",
    hint: "歷屆照片與企劃",
    icon: Images,
    to: "/connections",
    search: { focus: "drive" },
    tone: "clear",
  },
  {
    id: "from-canva",
    label: "從 Canva 設計開始",
    hint: "延續舊設計的品牌感",
    icon: Play,
    to: "/connections",
    search: { focus: "canva" },
    tone: "warm",
  },
  {
    id: "from-ig",
    label: "從以前 IG 貼文開始",
    hint: "看表現好的再延伸",
    icon: Instagram,
    to: "/instagram",
    tone: "night",
  },
];

const TONE_RING: Record<QuickStartItem["tone"], string> = {
  clear: "bg-[color-mix(in_oklab,var(--color-clear)_16%,transparent)] text-[var(--color-accent)]",
  warm: "bg-[color-mix(in_oklab,var(--color-warm)_20%,transparent)] text-[color-mix(in_oklab,var(--color-warm)_70%,var(--color-fg))]",
  night: "bg-[color-mix(in_oklab,var(--color-night)_16%,transparent)] text-[var(--color-night)]",
};

export function QuickStartGrid({
  items = QUICK_START,
  onNavigate,
  className,
}: {
  items?: QuickStartItem[];
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <ul className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to={item.to}
            search={item.search}
            onClick={onNavigate}
            className="flex h-full min-h-[4.5rem] items-center gap-3 rounded-2xl bg-surface px-3 py-3 shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-lift)]"
          >
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", TONE_RING[item.tone])}>
              <item.icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{item.label}</span>
              <span className="block truncate text-xs text-muted">{item.hint}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
