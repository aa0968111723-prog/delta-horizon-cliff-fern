import { Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  ImagePlus,
  Instagram,
  Layers,
  Sparkles,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const ACTIONS = [
  { to: "/create", search: { mode: "post" }, label: "生成 IG 貼文", icon: Instagram },
  { to: "/create", search: { mode: "image" }, label: "生成圖片", icon: ImagePlus },
  { to: "/create", search: { mode: "story" }, label: "生成 Story", icon: Layers },
  { to: "/create", search: { mode: "carousel" }, label: "生成 Carousel", icon: Layers },
  { to: "/create", search: { mode: "reels" }, label: "生成 Reels", icon: Video },
  { to: "/campaigns", search: undefined, label: "建立活動", icon: CalendarDays },
  { to: "/create", search: { mode: "idea" }, label: "從一句想法開始", icon: Sparkles },
  { to: "/create", search: { mode: "vision" }, label: "從一張圖片開始", icon: ImagePlus },
  { to: "/create", search: { mode: "drive" }, label: "從 Drive 素材開始", icon: Layers },
  { to: "/create", search: { mode: "canva" }, label: "從 Canva 開始", icon: Layers },
  { to: "/ig", search: undefined, label: "從以前 IG 開始", icon: Instagram },
  { to: "/inspire", search: undefined, label: "靈感研究", icon: Sparkles },
] as const;

export function CreateMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <SheetTitle className="font-display text-2xl">今天想創作什麼？</SheetTitle>
        <ul className="mt-4 grid grid-cols-2 gap-2">
          {ACTIONS.map((action) => (
            <li key={action.label}>
              <Button
                variant="secondary"
                className="h-auto min-h-14 w-full justify-start gap-3 px-3 py-3 text-left"
                onClick={() => {
                  onOpenChange(false);
                  void navigate({ to: action.to, search: action.search } as never);
                }}
              >
                <action.icon className="size-4 shrink-0" />
                <span className="text-sm">{action.label}</span>
              </Button>
            </li>
          ))}
        </ul>
        <Button asChild className="mt-4 w-full">
          <Link to="/create" onClick={() => onOpenChange(false)}>
            打開 AI 創作台
          </Link>
        </Button>
      </SheetContent>
    </Sheet>
  );
}
