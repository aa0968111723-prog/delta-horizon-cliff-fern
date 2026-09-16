import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  Download,
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
import { CreateSheet } from "@/components/create/create-sheet";
import { SaveIndicator } from "@/components/shared/save-indicator";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/zen/labels";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

type NavKey =
  | "home"
  | "create"
  | "campaigns"
  | "calendar"
  | "assets"
  | "instagram"
  | "brand"
  | "connections"
  | "search"
  | "studio"
  | "export";

type NavItem = { to: string; label: string; icon: LucideIcon; match: NavKey };

const DESKTOP_NAV: NavItem[] = [
  { to: "/", label: "首頁", icon: Home, match: "home" },
  { to: "/create", label: "AI 創作", icon: Sparkles, match: "create" },
  { to: "/campaigns", label: "活動", icon: Tent, match: "campaigns" },
  { to: "/calendar", label: "排程", icon: CalendarDays, match: "calendar" },
  { to: "/assets", label: "素材", icon: Images, match: "assets" },
  { to: "/instagram", label: "IG", icon: Instagram, match: "instagram" },
  { to: "/brand", label: "品牌", icon: SwatchBook, match: "brand" },
  { to: "/search", label: "搜尋", icon: Search, match: "search" },
  { to: "/connections", label: "連接", icon: Link2, match: "connections" },
];

const MOBILE_LEFT: NavItem[] = [
  { to: "/", label: "首頁", icon: Home, match: "home" },
  { to: "/calendar", label: "排程", icon: CalendarDays, match: "calendar" },
];
const MOBILE_RIGHT: NavItem[] = [
  { to: "/assets", label: "素材", icon: Images, match: "assets" },
  { to: "/instagram", label: "IG", icon: Instagram, match: "instagram" },
];

function activeKey(pathname: string): NavKey {
  if (pathname.startsWith("/studio")) return "studio";
  if (pathname.startsWith("/create") || pathname.startsWith("/assistant")) return "create";
  if (pathname.startsWith("/campaigns")) return "campaigns";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/assets")) return "assets";
  if (pathname.startsWith("/instagram")) return "instagram";
  if (pathname.startsWith("/brand")) return "brand";
  if (pathname.startsWith("/connections")) return "connections";
  if (pathname.startsWith("/search")) return "search";
  if (pathname.startsWith("/export")) return "export";
  return "home";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const setCreateOpen = useUi((s) => s.setCreateOpen);
  const current = activeKey(pathname);
  const inStudio = current === "studio";

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <aside className="sticky top-0 hidden h-dvh w-[5rem] shrink-0 flex-col border-r border-border/70 bg-surface/80 backdrop-blur lg:flex">
        <Link
          to="/"
          className="flex h-16 items-center justify-center"
          aria-label={`${APP_NAME} 首頁`}
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-night text-night-fg shadow-[var(--shadow-glow)]">
            <span className="size-3 rounded-full bg-[image:linear-gradient(135deg,var(--color-glow-amber),var(--color-glow-teal),var(--color-glow-lavender))]" />
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-2">
          {DESKTOP_NAV.map((item) => {
            const active = current === item.match;
            return (
              <Link
                key={item.match}
                to={item.to}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] transition-colors",
                  active ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <item.icon className="size-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col items-center gap-1 px-2 pb-4">
          {lastProjectId ? (
            <Link
              to="/studio/$projectId"
              params={{ projectId: lastProjectId }}
              className={cn(
                "flex size-11 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg",
                inStudio && "bg-accent/10 text-accent",
              )}
              aria-label="開啟編輯器"
            >
              <PenTool className="size-[18px]" />
            </Link>
          ) : null}
          <Link
            to="/export"
            className={cn(
              "flex size-11 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg",
              current === "export" && "bg-accent/10 text-accent",
            )}
            aria-label="輸出"
          >
            <Download className="size-[18px]" />
          </Link>
          <SaveIndicator />
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <div className={cn("min-h-0 flex-1", !inStudio && "pb-nav")}>{children}</div>

        {!inStudio ? (
          <nav
            className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border/70 pb-[env(safe-area-inset-bottom)] lg:hidden"
            aria-label="主要導覽"
          >
            <div className="relative grid h-[var(--spacing-nav)] grid-cols-5 items-end">
              {MOBILE_LEFT.map((item) => (
                <MobileNavLink key={item.match} item={item} active={current === item.match} />
              ))}
              <div className="relative flex flex-col items-center justify-end pb-1.5">
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="absolute -top-7 flex size-16 items-center justify-center rounded-full bg-night text-night-fg shadow-[var(--shadow-glow)] transition-transform active:scale-95"
                  aria-label="AI 創作"
                >
                  <span className="absolute inset-0 rounded-full bg-[image:conic-gradient(from_180deg,var(--color-glow-amber),var(--color-glow-teal),var(--color-glow-lavender),var(--color-glow-amber))] opacity-70 blur-[10px]" />
                  <span className="relative flex size-14 items-center justify-center rounded-full bg-night">
                    <Plus className="size-7" strokeWidth={2.4} />
                  </span>
                </button>
                <span className="mt-9 text-[11px] font-medium text-fg">AI 創作</span>
              </div>
              {MOBILE_RIGHT.map((item) => (
                <MobileNavLink key={item.match} item={item} active={current === item.match} />
              ))}
            </div>
          </nav>
        ) : null}
      </div>
      <CreateSheet />
      <AssistantSheet />
    </div>
  );
}

function MobileNavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      to={item.to}
      className={cn(
        "flex h-[var(--spacing-nav)] min-h-11 flex-col items-center justify-center gap-1 text-[11px]",
        active ? "text-accent" : "text-muted",
      )}
    >
      <item.icon className="size-5" />
      {item.label}
    </Link>
  );
}
