import { useNavigate } from "@tanstack/react-router";
import {
  Camera,
  Clapperboard,
  GalleryHorizontalEnd,
  Image as ImageIcon,
  Lightbulb,
  MessageSquareText,
  Sparkles,
  Tent,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { CreateMode } from "@/lib/zen/create-modes";
import { useUi } from "@/stores/ui-store";

const OPTIONS: { mode: CreateMode; label: string; hint: string; icon: LucideIcon }[] = [
  { mode: "post", label: "生成貼文", hint: "Hook + 正文 + Hashtags", icon: MessageSquareText },
  { mode: "image", label: "生成圖片", hint: "三個視覺方向", icon: ImageIcon },
  { mode: "story", label: "生成 Story", hint: "3–5 張限動", icon: Sparkles },
  { mode: "carousel", label: "生成 Carousel", hint: "5 頁輪播", icon: GalleryHorizontalEnd },
  { mode: "reels", label: "生成 Reels", hint: "20 秒腳本", icon: Clapperboard },
  { mode: "idea", label: "從一句想法開始", hint: "先寫一句就好", icon: Lightbulb },
  { mode: "photo", label: "從一張圖片開始", hint: "AI 看圖再延伸", icon: Camera },
];

export function CreateSheet() {
  const open = useUi((s) => s.createOpen);
  const setOpen = useUi((s) => s.setCreateOpen);
  const navigate = useNavigate();

  function go(mode: CreateMode) {
    setOpen(false);
    void navigate({ to: "/create", search: { mode } });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="glass max-h-[86dvh] rounded-t-[28px] p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
        <SheetTitle className="font-display text-xl">今天想創作什麼？</SheetTitle>
        <p className="mt-1 text-sm text-muted">AI 會先讀品牌記憶與淡江學生情境，再開始。</p>
        <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {OPTIONS.map((opt) => (
            <li key={opt.mode}>
              <button
                type="button"
                onClick={() => go(opt.mode)}
                className="flex min-h-[5.5rem] w-full flex-col items-start gap-2 rounded-2xl bg-surface p-3.5 text-left shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-border-hover)]"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <opt.icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{opt.label}</span>
                  <span className="block text-xs text-muted">{opt.hint}</span>
                </span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void navigate({ to: "/campaigns", search: { new: 1 } });
              }}
              className="flex min-h-[5.5rem] w-full flex-col items-start gap-2 rounded-2xl bg-night p-3.5 text-left text-night-fg shadow-[var(--shadow-glow)]"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-night-fg/15">
                <Tent className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-medium">建立活動</span>
                <span className="block text-xs text-night-fg/70">AI 生成完整宣傳</span>
              </span>
            </button>
          </li>
        </ul>
      </SheetContent>
    </Sheet>
  );
}
