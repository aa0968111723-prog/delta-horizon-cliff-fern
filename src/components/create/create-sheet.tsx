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
import { handoffFromQuickStart, QUICK_STARTS } from "@/lib/club/quick-starts";
import { writeHandoff } from "@/lib/create/handoff";
import { useCreative } from "@/stores/creative-store";
import { useUi } from "@/stores/ui-store";

const ICONS = {
  post: Instagram,
  image: ImageIcon,
  story: Sparkles,
  carousel: Rows3,
  reels: Clapperboard,
  campaign: CalendarDays,
  idea: Lightbulb,
  photo: ImageIcon,
  drive: Images,
  canva: Images,
  ig: Instagram,
} as const;

export function CreateSheet() {
  const open = useUi((s) => s.createOpen);
  const setCreateOpen = useUi((s) => s.setCreateOpen);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const setLastSearch = useCreative((s) => s.setLastSearch);
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={(next) => setCreateOpen(next)}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <SheetTitle>今天想創作什麼？</SheetTitle>
        <p className="mt-1 text-sm text-muted">一人完成淡江禪學社網宣。選一個起點即可。</p>
        <ul className="mt-4 grid max-h-[50dvh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {QUICK_STARTS.map((action) => {
            const Icon = ICONS[action.id as keyof typeof ICONS] ?? Sparkles;
            return (
              <li key={action.id}>
                <Button
                  variant="secondary"
                  className="h-12 w-full justify-start"
                  onClick={() => {
                    setCreateOpen(false, action.id);
                    if (action.openSearch) {
                      setLastSearch(action.id === "canva" ? "找以前茶會 Canva" : "找以前晚上的茶會照片");
                      setSearchOpen(true);
                      return;
                    }
                    if (action.to === "/create") {
                      writeHandoff(handoffFromQuickStart(action));
                      void navigate({ to: "/create", search: { tab: action.tab ?? "campaign" } });
                    } else {
                      void navigate({ to: action.to });
                    }
                  }}
                >
                  <Icon className="size-4" />
                  {action.label}
                </Button>
              </li>
            );
          })}
        </ul>
        <Button
          className="mt-4 w-full"
          onClick={() => {
            setCreateOpen(false);
            void navigate({ to: "/create", search: { tab: "campaign" } });
          }}
        >
          <Plus className="size-4" />
          打開 AI 創作台
        </Button>
      </SheetContent>
    </Sheet>
  );
}
