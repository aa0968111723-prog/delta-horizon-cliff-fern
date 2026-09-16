import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  FolderKanban,
  Images,
  Instagram,
  Plus,
  Sparkles,
  SwatchBook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AssistantSheet } from "@/components/assistant/assistant-sheet";
import { CreateSheet } from "@/components/create/create-sheet";
import { CreativeSearch } from "@/components/search/creative-search";
import { SaveIndicator } from "@/components/shared/save-indicator";
import { cn } from "@/lib/utils";
import { useUi } from "@/stores/ui-store";

const DESKTOP_NAV: { to: string; label: string; icon: LucideIcon; match: string }[] = [
  { to: "/", label: "首頁", icon: Sparkles, match: "home" },
  { to: "/assistant", label: "創作", icon: FolderKanban, match: "create" },
  { to: "/calendar", label: "排程", icon: CalendarDays, match: "calendar" },
  { to: "/assets", label: "素材", icon: Images, match: "assets" },
  { to: "/instagram", label: "IG", icon: Instagram, match: "instagram" },
  { to: "/brand", label: "品牌", icon: SwatchBook, match: "brand" },
];

function activeKey(pathname: string) {
  if (pathname.startsWith("/studio") || pathname.startsWith("/assistant") || pathname.startsWith("/create") || pathname.startsWith("/campaigns") || pathname.startsWith("/inspiration")) return "create";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/assets")) return "assets";
  if (pathname.startsWith("/instagram")) return "instagram";
  if (pathname.startsWith("/brand") || pathname.startsWith("/connections") || pathname.startsWith("/export")) return "brand";
  return "home";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const setCreateOpen = useUi((s) => s.setCreateOpen);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const current = activeKey(pathname);

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <aside className="sticky top-0 hidden h-dvh w-[4.75rem] shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <Link
          to="/"
          className="flex h-14 items-center justify-center font-display text-lg tracking-tight"
          aria-label="禪光工作室首頁"
        >
          禪
        </Link>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {DESKTOP_NAV.map((item) => {
            const active = current === item.match;
            return (
              <Link
                key={item.match}
                to={item.to}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-xs transition-colors",
                  active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col items-center gap-2 px-2 pb-4">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-fg"
            aria-label="AI 創作"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="搜尋素材"
          >
            <span className="text-sm">尋</span>
          </button>
          <SaveIndicator />
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 pb-nav">{children}</div>
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
          <div className="relative grid grid-cols-5">
            <MobileLink to="/" label="首頁" active={current === "home"} icon={Sparkles} />
            <MobileLink to="/calendar" label="排程" active={current === "calendar"} icon={CalendarDays} />
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="-mt-5 flex flex-col items-center justify-end gap-1 pb-2"
              aria-label="AI 創作"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-[var(--shadow-float)]">
                <Plus className="size-6" />
              </span>
              <span className="text-[10px] text-fg">AI 創作</span>
            </button>
            <MobileLink to="/assets" label="素材" active={current === "assets"} icon={Images} />
            <MobileLink to="/instagram" label="IG" active={current === "instagram"} icon={Instagram} />
          </div>
        </nav>
      </div>
      <CreateSheet />
      <CreativeSearch />
      <AssistantSheet />
    </div>
  );
}

function MobileLink({
  to,
  label,
  active,
  icon: Icon,
}: {
  to: string;
  label: string;
  active: boolean;
  icon: LucideIcon;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex h-14 min-h-11 flex-col items-center justify-center gap-1 text-xs",
        active ? "text-fg" : "text-muted",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
