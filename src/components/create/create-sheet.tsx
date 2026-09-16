import { useNavigate } from "@tanstack/react-router";
import {
  CalendarPlus,
  Clapperboard,
  ImageIcon,
  Instagram,
  Layers,
  Lightbulb,
  PenLine,
  Rows3,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCreative } from "@/stores/creative-store";
import { useUi } from "@/stores/ui-store";

const ACTIONS = [
  { id: "post", label: "生成 IG 貼文", hint: "Hook + 文案 + 主視覺方向", to: "/create", kind: "event", idea: "下週有一場茶會", auto: false },
  { id: "image", label: "生成圖片", hint: "文字 → 圖片，含三種方向", to: "/create/image" },
  { id: "story", label: "生成 Story", hint: "3–5 張限動", to: "/create", kind: "story", idea: "把下週茶會做成 3 到 5 張限動", auto: true },
  { id: "carousel", label: "生成 Carousel", hint: "Hook 到 CTA 六頁", to: "/create", kind: "carousel", idea: "下週茶會 Carousel，第一頁先講生活", auto: true },
  { id: "reels", label: "生成 Reels", hint: "0–20 秒分鏡", to: "/create", kind: "reels", idea: "茶會 Reels，前三秒先讓淡江學生停下來", auto: true },
  { id: "campaign", label: "建立活動", hint: "茶會、禪光、社課", to: "/campaigns" },
  { id: "idea", label: "從一句想法開始", hint: "先寫感覺再變內容", to: "/create", kind: "emotion", idea: "最近是不是連休息都覺得有罪惡感？", auto: true },
  { id: "photo", label: "從一張圖片開始", hint: "理解畫面再延伸", to: "/create/image" },
  { id: "qa", label: "生成 Q&A", hint: "學生會問的事", to: "/create", kind: "qa", idea: "禪學社是在做什麼？要先懂禪嗎？", auto: true },
  { id: "poll", label: "生成互動投票", hint: "限動互動", to: "/create", kind: "poll", idea: "最近比較像課表塞滿，還是晚上不知道要幹嘛？", auto: true },
  { id: "member", label: "生成社員故事", hint: "人味，不是招生廣告", to: "/create", kind: "member", idea: "來社團之前，我也覺得自己不太會交朋友", auto: true },
  { id: "knowledge", label: "生成知識內容", hint: "禪翻成生活", to: "/create", kind: "knowledge", idea: "禪不是要你突然變得很懂，先坐一下就好", auto: true },
  { id: "drive", label: "從 Google Drive 開始", hint: "找歷屆照片與企劃", to: "/connect" },
  { id: "canva", label: "從 Canva 設計開始", hint: "風格參考或繼續編輯", to: "/connect" },
  { id: "ig", label: "從以前 IG 開始", hint: "用自己的帳號記憶", to: "/instagram" },
  { id: "inspire", label: "靈感研究", hint: "抽象別人，做成自己的", to: "/inspire" },
] as const;

const ICONS = {
  post: PenLine,
  image: ImageIcon,
  story: Rows3,
  carousel: Layers,
  reels: Clapperboard,
  campaign: CalendarPlus,
  idea: Lightbulb,
  photo: ImageIcon,
  qa: PenLine,
  poll: Lightbulb,
  member: PenLine,
  knowledge: Lightbulb,
  drive: Lightbulb,
  canva: Layers,
  ig: Instagram,
  inspire: Lightbulb,
};

export function CreateLaunchSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const setAssistantOpen = useUi((s) => s.setAssistantOpen);
  const setCreateIntent = useCreative((s) => s.setCreateIntent);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">今天想創作什麼？</SheetTitle>
        </SheetHeader>
        <ul className="mt-4 grid gap-2">
          {ACTIONS.map((action) => {
            const Icon = ICONS[action.id];
            return (
              <li key={action.id}>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    if ("kind" in action && action.kind) {
                      setCreateIntent({
                        idea: action.idea,
                        kind: action.kind,
                        autoGenerate: action.auto,
                      });
                    } else {
                      setCreateIntent(null);
                    }
                    void navigate({ to: action.to });
                  }}
                  className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-surface px-3 text-left shadow-[var(--shadow-border)]"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-surface-2">
                    <Icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{action.label}</span>
                    <span className="block text-xs text-muted">{action.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                setAssistantOpen(true);
              }}
              className="flex min-h-12 w-full items-center justify-center rounded-2xl text-sm text-muted"
            >
              打開畫布助手
            </button>
          </li>
        </ul>
      </SheetContent>
    </Sheet>
  );
}
