import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  Home,
  Images,
  Instagram,
  PenTool,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AssistantSheet } from "@/components/assistant/assistant-sheet";
import { SaveIndicator } from "@/components/shared/save-indicator";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

type NavKey = "home" | "assistant" | "calendar" | "studio" | "assets" | "instagram";

const SIDE_NAV: { to: string; label: string; icon: LucideIcon; match: NavKey }[] = [
  { to: "/", label: "首頁", icon: Home, match: "home" },
  { to: "/assistant", label: "AI 創作", icon: Sparkles, match: "assistant" },
  { to: "/calendar", label: "排程", icon: CalendarDays, match: "calendar" },
  { to: "/studio", label: "Studio", icon: PenTool, match: "studio" },
  { to: "/assets", label: "素材", icon: Images, match: "assets" },
  { to: "/instagram", label: "IG", icon: Instagram, match: "instagram" },
];

const MOBILE_NAV: { to: string; label: string; icon: LucideIcon; match: NavKey }[] = [
  { to: "/", label: "首頁", icon: Home, match: "home" },
  { to: "/assistant", label: "AI 創作", icon: Sparkles, match: "assistant" },
  { to: "/calendar", label: "排程", icon: CalendarDays, match: "calendar" },
  { to: "/assets", label: "素材", icon: Images, match: "assets" },
  { to: "/instagram", label: "IG", icon: Instagram, match: "instagram" },
];

function activeKey(pathname: string): NavKey {
  if (pathname.startsWith("/studio") || pathname.startsWith("/export")) return "studio";
  if (pathname.startsWith("/assistant")) return "assistant";
  if (pathname.startsWith("/assets") || pathname.startsWith("/brand") || pathname.startsWith("/connections")) return "assets";
  if (pathname.startsWith("/calendar") || pathname.startsWith("/campaigns")) return "calendar";
  if (pathname.startsWith("/instagram")) return "instagram";
  return "home";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const setAssistantOpen = useUi((s) => s.setAssistantOpen);
  const current = activeKey(pathname);

  function hrefFor(item: (typeof SIDE_NAV)[number]) {
    if (item.match === "studio" && lastProjectId) {
      return { to: "/studio/$projectId" as const, params: { projectId: lastProjectId } };
    }
    return { to: item.to };
  }

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <aside className="sticky top-0 hidden h-dvh w-[4.5rem] shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <Link
          to="/"
          className="flex h-14 items-center justify-center font-display text-lg tracking-tight"
          aria-label="禪作所首頁"
        >
          禪
        </Link>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {SIDE_NAV.map((item) => {
            const active = current === item.match;
            const dest = hrefFor(item);
            return (
              <Link
                key={item.match}
                to={dest.to}
                params={"params" in dest ? dest.params : undefined}
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
            onClick={() => setAssistantOpen(true)}
            className="flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="開啟 AI 創作"
          >
            <Sparkles className="size-4" />
          </button>
          <SaveIndicator />
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 pb-nav">{children}</div>
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div className="relative grid grid-cols-5">
            {MOBILE_NAV.map((item) => {
              const active = current === item.match;
              const dest = hrefFor(item);
              return (
                <Link
                  key={item.match}
                  to={dest.to}
                  params={"params" in dest ? dest.params : undefined}
                  className={cn(
                    "flex h-14 min-h-11 flex-col items-center justify-center gap-1 text-xs",
                    item.match === "assistant" && "-mt-3 h-16 rounded-2xl bg-accent text-accent-fg shadow-[var(--shadow-artboard)]",
                    item.match !== "assistant" && (active ? "text-fg" : "text-muted"),
                  )}
                >
                  <item.icon className={cn(item.match === "assistant" ? "size-5" : "size-4")} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      <AssistantSheet />
    </div>
  );
}
