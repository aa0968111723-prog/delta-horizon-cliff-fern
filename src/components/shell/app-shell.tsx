import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  Home,
  Images,
  Instagram,
  Link2,
  PenTool,
  Plus,
  Search,
  Sparkles,
  SwatchBook,
  Tent,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AssistantSheet } from "@/components/assistant/assistant-sheet";
import { QUICK_START, QuickStartGrid } from "@/components/create/quick-start";
import { SaveIndicator } from "@/components/shared/save-indicator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CLUB_SHORT } from "@/lib/zen/club";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";
import { useState } from "react";

type NavKey =
  | "home"
  | "create"
  | "campaigns"
  | "calendar"
  | "assets"
  | "instagram"
  | "studio"
  | "brand"
  | "search"
  | "connections";

type NavItem = { to: string; label: string; icon: LucideIcon; match: NavKey };

/** 電腦版側欄：創作在最上面，管理類的放後面。 */
const SIDE_NAV: NavItem[] = [
  { to: "/", label: "首頁", icon: Home, match: "home" },
  { to: "/create", label: "AI 創作", icon: Sparkles, match: "create" },
  { to: "/campaigns", label: "活動", icon: Tent, match: "campaigns" },
  { to: "/calendar", label: "排程", icon: CalendarDays, match: "calendar" },
  { to: "/instagram", label: "IG", icon: Instagram, match: "instagram" },
  { to: "/assets", label: "素材", icon: Images, match: "assets" },
  { to: "/studio", label: "編輯", icon: PenTool, match: "studio" },
  { to: "/search", label: "搜尋", icon: Search, match: "search" },
  { to: "/brand", label: "品牌", icon: SwatchBook, match: "brand" },
  { to: "/connections", label: "連接", icon: Link2, match: "connections" },
];

/** 手機底部：四個分頁＋中央的「＋ AI 創作」。 */
const TAB_NAV: NavItem[] = [
  { to: "/", label: "首頁", icon: Home, match: "home" },
  { to: "/calendar", label: "排程", icon: CalendarDays, match: "calendar" },
  { to: "/assets", label: "素材", icon: Images, match: "assets" },
  { to: "/instagram", label: "IG", icon: Instagram, match: "instagram" },
];

function activeKey(pathname: string): NavKey {
  if (pathname.startsWith("/studio")) return "studio";
  if (pathname.startsWith("/create") || pathname.startsWith("/assistant")) return "create";
  if (pathname.startsWith("/campaigns")) return "campaigns";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/instagram")) return "instagram";
  if (pathname.startsWith("/assets")) return "assets";
  if (pathname.startsWith("/search")) return "search";
  if (pathname.startsWith("/brand")) return "brand";
  if (pathname.startsWith("/connections")) return "connections";
  if (pathname.startsWith("/export")) return "studio";
  return "home";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const createOpen = useUi((s) => s.createOpen);
  const setCreateOpen = useUi((s) => s.setCreateOpen);
  const current = activeKey(pathname);
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  function hrefFor(item: NavItem) {
    if (item.match === "studio" && lastProjectId) {
      return { to: "/studio/$projectId" as const, params: { projectId: lastProjectId } };
    }
    return { to: item.to };
  }

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <aside className="sticky top-0 hidden h-dvh w-[5rem] shrink-0 flex-col border-r border-border bg-surface/70 backdrop-blur lg:flex">
        <Link
          to="/"
          className="flex h-16 flex-col items-center justify-center gap-1"
          aria-label="禪學社創作中控台首頁"
        >
          <span className="three-lights size-6 rounded-full" aria-hidden />
          <span className="font-display text-[0.7rem] tracking-tight text-muted">{CLUB_SHORT}</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {SIDE_NAV.map((item) => {
            const active = current === item.match;
            const dest = hrefFor(item);
            return (
              <Link
                key={item.match}
                to={dest.to}
                params={"params" in dest ? dest.params : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[0.68rem] transition-colors",
                  active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <item.icon className="size-[1.15rem]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col items-center gap-2 px-2 pb-4">
          <SaveIndicator />
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 pb-nav">{children}</div>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/85 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          <div className="relative grid grid-cols-5">
            {TAB_NAV.slice(0, 2).map((item) => (
              <TabLink key={item.match} item={item} active={current === item.match} />
            ))}
            <div className="flex items-start justify-center">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                aria-label="AI 創作"
                className="three-lights -mt-5 flex size-14 min-h-11 flex-col items-center justify-center rounded-full text-accent-fg shadow-[var(--shadow-glow)]"
              >
                <Plus className="size-6" />
                <span className="text-[0.6rem] leading-none">AI 創作</span>
              </button>
            </div>
            {TAB_NAV.slice(2).map((item) => (
              <TabLink key={item.match} item={item} active={current === item.match} />
            ))}
          </div>
        </nav>
      </div>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="bottom" className="max-h-[86dvh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-xl">今天想創作什麼？</SheetTitle>
            <SheetDescription>選一個開始，AI 會先讀品牌記憶跟現在的學期情境。</SheetDescription>
          </SheetHeader>
          <QuickStartGrid
            items={QUICK_START.slice(0, 8)}
            onNavigate={() => setCreateOpen(false)}
            className="pb-4"
          />
        </SheetContent>
      </Sheet>

      <AssistantSheet />
    </div>
  );
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      to={item.to}
      className={cn(
        "flex h-14 min-h-11 flex-col items-center justify-center gap-1 text-[0.68rem]",
        active ? "text-fg" : "text-muted",
      )}
    >
      <item.icon className="size-[1.15rem]" />
      {item.label}
    </Link>
  );
}
