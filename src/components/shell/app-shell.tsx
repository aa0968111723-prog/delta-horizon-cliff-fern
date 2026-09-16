import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  Compass,
  Instagram,
  PenTool,
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

const NAV: { to: string; label: string; icon: LucideIcon; match: "home" | "calendar" | "studio" | "instagram" | "brand" }[] = [
  { to: "/", label: "首頁", icon: Compass, match: "home" },
  { to: "/calendar", label: "日曆", icon: CalendarDays, match: "calendar" },
  { to: "/studio", label: "畫布", icon: PenTool, match: "studio" },
  { to: "/instagram", label: "IG", icon: Instagram, match: "instagram" },
  { to: "/brand", label: "品牌", icon: SwatchBook, match: "brand" },
];

function activeKey(pathname: string) {
  if (pathname.startsWith("/studio")) return "studio";
  if (pathname.startsWith("/calendar") || pathname.startsWith("/export")) return "calendar";
  if (pathname.startsWith("/instagram")) return "instagram";
  if (pathname.startsWith("/brand") || pathname.startsWith("/assets")) return "brand";
  return "home";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const setCreateOpen = useUi((s) => s.setCreateOpen);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const current = activeKey(pathname);

  function hrefFor(item: (typeof NAV)[number]) {
    if (item.match === "studio" && lastProjectId) {
      return { to: "/studio/$projectId" as const, params: { projectId: lastProjectId } };
    }
    return { to: item.to };
  }

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <aside className="sticky top-0 hidden h-dvh w-[4.75rem] shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <Link
          to="/"
          className="flex h-14 items-center justify-center font-display text-base font-bold tracking-tight text-accent"
          aria-label="淡江禪學社首頁"
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
      {current !== "studio" && current !== "home" ? (
        <button
          type="button"
          onClick={() => setAssistantOpen(true)}
          className="fixed right-4 z-30 flex size-12 items-center justify-center rounded-full bg-accent text-accent-fg shadow-[var(--shadow-artboard)] lg:hidden"
          style={{ bottom: "calc(var(--spacing-nav-safe) + 0.75rem)" }}
          aria-label="快速開啟 AI 助手"
        >
          <Sparkles className="size-5" />
        </button>
      ) : null}
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
