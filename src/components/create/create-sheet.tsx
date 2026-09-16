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
import { useUi } from "@/stores/ui-store";

const ACTIONS = [
  { id: "post", label: "生成 IG 貼文", hint: "Hook + 文案 + 主視覺方向", to: "/create" },
  { id: "image", label: "生成圖片", hint: "文字 → 圖片，含三種方向", to: "/create/image" },
  { id: "story", label: "生成 Story", hint: "3–5 張限動", to: "/create" },
  { id: "carousel", label: "生成 Carousel", hint: "Hook 到 CTA 六頁", to: "/create" },
  { id: "reels", label: "生成 Reels", hint: "0–20 秒分鏡", to: "/create" },
  { id: "campaign", label: "建立活動", hint: "茶會、禪光、社課", to: "/campaigns" },
  { id: "idea", label: "從一句想法開始", hint: "先寫感覺再變內容", to: "/create" },
  { id: "drive", label: "從 Google Drive 開始", hint: "找歷屆照片與企劃", to: "/connect" },
  { id: "ig", label: "從以前 IG 開始", hint: "用自己的帳號記憶", to: "/instagram" },
] as const;

const ICONS = {
  post: PenLine,
  image: ImageIcon,
  story: Rows3,
  carousel: Layers,
  reels: Clapperboard,
  campaign: CalendarPlus,
  idea: Lightbulb,
  drive: Lightbulb,
  ig: Instagram,
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
                    if (action.id === "campaign") {
                      void navigate({ to: "/campaigns" });
                      return;
                    }
                    if (action.id === "drive") {
                      void navigate({ to: "/connect" });
                      return;
                    }
                    if (action.id === "ig") {
                      void navigate({ to: "/instagram" });
                      return;
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
