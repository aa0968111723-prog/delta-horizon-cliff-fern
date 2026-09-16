import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  Images,
  Instagram,
  Plus,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { AssistantSheet } from "@/components/assistant/assistant-sheet";
import { CreateMenu } from "@/components/create/create-menu";
import { SaveIndicator } from "@/components/shared/save-indicator";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

const NAV: { to: string; label: string; icon: LucideIcon; match: string }[] = [
  { to: "/", label: "首頁", icon: Sparkles, match: "home" },
  { to: "/calendar", label: "排程", icon: CalendarDays, match: "calendar" },
  { to: "/create", label: "創作", icon: Plus, match: "create" },
  { to: "/assets", label: "素材", icon: Images, match: "assets" },
  { to: "/ig", label: "IG", icon: Instagram, match: "ig" },
];

function activeKey(pathname: string) {
  if (pathname.startsWith("/create") || pathname.startsWith("/assistant") || pathname.startsWith("/inspire")) return "create";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/assets") || pathname.startsWith("/brand")) return "assets";
  if (pathname.startsWith("/ig") || pathname.startsWith("/studio") || pathname.startsWith("/export")) return "ig";
  if (pathname.startsWith("/connect") || pathname.startsWith("/campaigns")) return "home";
  return "home";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const setAssistantOpen = useUi((s) => s.setAssistantOpen);
  const current = activeKey(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <aside className="sticky top-0 hidden h-dvh w-[4.75rem] shrink-0 flex-col border-r border-border bg-surface/90 backdrop-blur-sm lg:flex">
        <Link
          to="/"
          className="flex h-14 items-center justify-center font-display text-lg tracking-tight"
          aria-label="禪學社 Studio 首頁"
        >
          禪
        </Link>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {NAV.map((item) => {
            const active = current === item.match;
            return (
              <Link
                key={item.match}
                to={item.to}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-xs transition-colors",
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
          {lastProjectId ? (
            <Link
              to="/studio/$projectId"
              params={{ projectId: lastProjectId }}
              className="text-[10px] text-muted hover:text-fg"
            >
              畫布
            </Link>
          ) : null}
          <Link to="/connect" className="text-[10px] text-muted hover:text-fg">
            連接
          </Link>
          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            className="flex size-11 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="畫布指令"
          >
            <Sparkles className="size-4" />
          </button>
          <SaveIndicator />
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 pb-nav">{children}</div>
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden">
          <div className="relative grid grid-cols-5">
            {NAV.map((item) => {
              const active = current === item.match;
              const center = item.match === "create";
              if (center) {
                return (
                  <button
                    key={item.match}
                    type="button"
                    onClick={() => {
                      setMenuOpen(true);
                    }}
                    className="relative flex h-14 min-h-11 flex-col items-center justify-center"
                    aria-label="AI 創作"
                  >
                    <span className="absolute -top-1 flex size-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-[var(--shadow-artboard)]">
                      <Plus className="size-6" />
                    </span>
                    <span className="mt-6 text-[10px] text-fg">創作</span>
                  </button>
                );
              }
              return (
                <Link
                  key={item.match}
                  to={item.to}
                  className={cn(
                    "flex h-14 min-h-11 flex-col items-center justify-center gap-1 text-xs",
                    active ? "text-fg" : "text-muted",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      {current === "create" ? null : (
        <button
          type="button"
          onClick={() => void navigate({ to: "/create" })}
          className="fixed right-4 z-30 hidden size-12 items-center justify-center rounded-full bg-accent text-accent-fg shadow-[var(--shadow-artboard)] lg:flex"
          style={{ bottom: "1.25rem" }}
          aria-label="打開 AI 創作"
        >
          <Plus className="size-5" />
        </button>
      )}
      <CreateMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <AssistantSheet />
    </div>
  );
}
