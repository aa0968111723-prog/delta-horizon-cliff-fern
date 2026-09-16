import { useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  Clapperboard,
  ImageIcon,
  Images,
  Instagram,
  Lightbulb,
  Plus,
  Rows3,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useUi } from "@/stores/ui-store";
import type { CreateTab } from "@/components/create/create-hub";

const ACTIONS: {
  intent: string;
  label: string;
  to: "/assistant" | "/create" | "/campaigns" | "/connections" | "/instagram";
  tab?: CreateTab;
  icon: typeof Instagram;
}[] = [
  { intent: "post", label: "生成 IG 貼文", to: "/assistant", icon: Instagram },
  { intent: "image", label: "生成圖片", to: "/create", tab: "image", icon: ImageIcon },
  { intent: "story", label: "生成 Story", to: "/create", tab: "convert", icon: Sparkles },
  { intent: "carousel", label: "生成 Carousel", to: "/create", tab: "convert", icon: Rows3 },
  { intent: "reels", label: "生成 Reels", to: "/create", tab: "convert", icon: Clapperboard },
  { intent: "campaign", label: "建立活動", to: "/campaigns", icon: CalendarDays },
  { intent: "idea", label: "從一句想法開始", to: "/create", tab: "copy", icon: Lightbulb },
  { intent: "photo", label: "從一張圖片開始", to: "/create", tab: "vision", icon: ImageIcon },
  { intent: "drive", label: "從 Google Drive 素材開始", to: "/connections", icon: Images },
  { intent: "canva", label: "從 Canva 設計開始", to: "/connections", icon: Images },
  { intent: "ig", label: "從以前 IG 貼文開始", to: "/instagram", icon: Instagram },
];

export function CreateSheet() {
  const open = useUi((s) => s.createOpen);
  const setCreateOpen = useUi((s) => s.setCreateOpen);
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={(next) => setCreateOpen(next)}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <SheetTitle>今天想創作什麼？</SheetTitle>
        <p className="mt-1 text-sm text-muted">一人完成淡江禪學社網宣。選一個起點即可。</p>
        <ul className="mt-4 grid max-h-[50dvh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {ACTIONS.map((action) => (
            <li key={action.intent}>
              <Button
                variant="secondary"
                className="h-12 w-full justify-start"
                onClick={() => {
                  setCreateOpen(false, action.intent);
                  if (action.to === "/create") {
                    void navigate({ to: "/create", search: { tab: action.tab ?? "image" } });
                  } else {
                    void navigate({ to: action.to });
                  }
                }}
              >
                <action.icon className="size-4" />
                {action.label}
              </Button>
            </li>
          ))}
        </ul>
        <Button
          className="mt-4 w-full"
          onClick={() => {
            setCreateOpen(false);
            void navigate({ to: "/assistant" });
          }}
        >
          <Plus className="size-4" />
          打開 AI 創作台
        </Button>
      </SheetContent>
    </Sheet>
  );
}
