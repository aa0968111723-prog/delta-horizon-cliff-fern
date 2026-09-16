import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  House,
  Images,
  Instagram,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AssistantSheet } from "@/components/assistant/assistant-sheet";
import { CreateSheet } from "@/components/create/create-sheet";
import { CreativeSearch } from "@/components/search/creative-search";
import { SaveIndicator } from "@/components/shared/save-indicator";
import { cn } from "@/lib/utils";
import { useUi } from "@/stores/ui-store";

const SIDE: { to: string; label: string; icon: LucideIcon; match: string }[] = [
  { to: "/", label: "首頁", icon: House, match: "home" },
  { to: "/create", label: "AI 創作", icon: Sparkles, match: "create" },
  { to: "/calendar", label: "排程", icon: CalendarDays, match: "calendar" },
  { to: "/assets", label: "素材", icon: Images, match: "assets" },
  { to: "/ig", label: "IG", icon: Instagram, match: "ig" },
];

function activeKey(pathname: string) {
  if (pathname.startsWith("/studio") || pathname.startsWith("/assistant")) return "create";
  if (pathname.startsWith("/create") || pathname.startsWith("/image")) return "create";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/assets") || pathname.startsWith("/brand") || pathname.startsWith("/connect")) return "assets";
  if (pathname.startsWith("/ig") || pathname.startsWith("/export")) return "ig";
  return "home";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const setCreateOpen = useUi((s) => s.setCreateOpen);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const current = activeKey(pathname);

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <aside className="sticky top-0 hidden h-dvh w-[4.75rem] shrink-0 flex-col border-r border-border bg-surface/90 backdrop-blur-md lg:flex">
        <Link
          to="/"
          className="flex h-14 items-center justify-center font-display text-lg tracking-tight"
          aria-label="禪光首頁"
        >
          光
        </Link>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {SIDE.map((item) => {
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
            onClick={() => setSearchOpen(true)}
            className="flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="搜尋素材"
          >
            <Search className="size-4" />
          </button>
          <SaveIndicator />
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 pb-24 lg:pb-0">{children}</div>
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
          <div className="relative grid grid-cols-5">
            <MobileLink to="/" label="首頁" icon={House} active={current === "home"} />
            <MobileLink to="/calendar" label="排程" icon={CalendarDays} match={current === "calendar"} />
            <div className="relative flex h-14 flex-col items-center justify-end pb-1">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="absolute -top-5 flex size-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-[var(--shadow-lift)]"
                aria-label="AI 創作"
              >
                <Plus className="size-6" />
              </button>
              <span className="text-[10px] text-muted">AI 創作</span>
            </div>
            <MobileLink to="/assets" label="素材" icon={Images} active={current === "assets"} />
            <MobileLink to="/ig" label="IG" icon={Instagram} active={current === "ig"} />
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
  icon: Icon,
  active,
  match,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  match?: boolean;
}) {
  const on = active ?? match ?? false;
  return (
    <Link to={to} className={cn("flex h-14 min-h-11 flex-col items-center justify-center gap-1 text-xs", on ? "text-fg" : "text-muted")}>
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
