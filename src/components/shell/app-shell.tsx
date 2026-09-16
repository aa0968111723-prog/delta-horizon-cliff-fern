import { Link, useRouterState } from "@tanstack/react-router";
import {
  Download,
  FolderKanban,
  PenTool,
  Sparkles,
  SwatchBook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AssistantSheet } from "@/components/assistant/assistant-sheet";
import { SaveIndicator } from "@/components/shared/save-indicator";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

const NAV: { to: string; label: string; icon: LucideIcon; match: "home" | "assistant" | "studio" | "brand" | "export" }[] = [
  { to: "/", label: "首頁", icon: FolderKanban, match: "home" },
  { to: "/assistant", label: "助手", icon: Sparkles, match: "assistant" },
  { to: "/studio", label: "編輯", icon: PenTool, match: "studio" },
  { to: "/brand", label: "品牌", icon: SwatchBook, match: "brand" },
  { to: "/export", label: "輸出", icon: Download, match: "export" },
];

function activeKey(pathname: string) {
  if (pathname.startsWith("/studio")) return "studio";
  if (pathname.startsWith("/assistant")) return "assistant";
  if (pathname.startsWith("/brand") || pathname.startsWith("/assets")) return "brand";
  if (pathname.startsWith("/export")) return "export";
  return "home";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const setAssistantOpen = useUi((s) => s.setAssistantOpen);
  const current = activeKey(pathname);

  function hrefFor(item: (typeof NAV)[number]) {
    if (item.match === "studio" && lastProjectId) {
      return { to: "/studio/$projectId" as const, params: { projectId: lastProjectId } };
    }
    if (item.match === "export" && lastProjectId) {
      return { to: "/export" as const };
    }
    return { to: item.to };
  }

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <aside className="sticky top-0 hidden h-dvh w-[4.5rem] shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <Link
          to="/"
          className="flex h-14 items-center justify-center font-display text-lg tracking-tight"
          aria-label="構幀首頁"
        >
          構
        </Link>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {NAV.map((item) => {
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
            aria-label="開啟 AI 助手"
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
            {NAV.map((item) => {
              const active = current === item.match;
              const dest = hrefFor(item);
              return (
                <Link
                  key={item.match}
                  to={dest.to}
                  params={"params" in dest ? dest.params : undefined}
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
      {current !== "assistant" && current !== "studio" ? (
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
