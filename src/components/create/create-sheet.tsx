import { useNavigate } from "@tanstack/react-router";
import {
  CalendarPlus,
  Clapperboard,
  ImagePlus,
  Images,
  Instagram,
  Layers3,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useUi, type CreateMode } from "@/stores/ui-store";

const ACTIONS: { mode: Exclude<CreateMode, null>; label: string; hint: string; icon: typeof Sparkles }[] = [
  { mode: "post", label: "生成貼文", hint: "Hook、正文、CTA", icon: Sparkles },
  { mode: "image", label: "生成圖片", hint: "三個視覺方向", icon: ImagePlus },
  { mode: "story", label: "生成 Story", hint: "3–5 則限動", icon: Layers3 },
  { mode: "carousel", label: "生成 Carousel", hint: "五到六頁", icon: Layers3 },
  { mode: "reels", label: "生成 Reels", hint: "腳本與封面", icon: Clapperboard },
  { mode: "campaign", label: "建立活動", hint: "再生成完整宣傳", icon: CalendarPlus },
  { mode: "idea", label: "從一句想法開始", hint: "下週有一場茶會", icon: Lightbulb },
  { mode: "from-image", label: "從一張圖片開始", hint: "理解後延伸", icon: ImagePlus },
  { mode: "from-drive", label: "從 Google Drive", hint: "歷屆照片與企劃", icon: Images },
  { mode: "from-canva", label: "從 Canva", hint: "舊設計當風格", icon: Images },
  { mode: "from-ig", label: "從以前 IG", hint: "學自己的語氣", icon: Instagram },
];

export function CreateSheet() {
  const navigate = useNavigate();
  const open = useUi((s) => s.createOpen);
  const setCreateOpen = useUi((s) => s.setCreateOpen);

  function go(mode: Exclude<CreateMode, null>) {
    setCreateOpen(false, mode);
    if (mode === "image") {
      void navigate({ to: "/image" });
      return;
    }
    void navigate({
      to: "/create",
      search: mode === "idea" ? { mode, idea: "下週有一場茶會" } : { mode },
    });
  }

  return (
    <Sheet open={open} onOpenChange={(next) => setCreateOpen(next)}>
      <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto">
        <SheetTitle>今天想創作什麼？</SheetTitle>
        <p className="mt-1 text-sm text-muted">一人完成淡江禪學社網宣。先選一件事。</p>
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ACTIONS.map((item) => (
            <li key={item.mode}>
              <button
                type="button"
                onClick={() => go(item.mode)}
                className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-surface-2 px-3 py-3 text-left"
              >
                <item.icon className="size-5 text-accent" />
                <span>
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-muted">{item.hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
