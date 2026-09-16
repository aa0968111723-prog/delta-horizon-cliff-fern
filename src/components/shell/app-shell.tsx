import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  Images,
  Instagram,
  Lightbulb,
  Plus,
  Sparkles,
  SwatchBook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CreateLaunchSheet } from "@/components/create/create-sheet";
import { SaveIndicator } from "@/components/shared/save-indicator";
import { APP_NAME } from "@/lib/zen/club";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";
import { useState } from "react";

type NavId = "home" | "create" | "calendar" | "assets" | "ig" | "campaigns" | "brand" | "connect" | "inspire";

const DESKTOP_NAV: { to: "/" | "/create" | "/campaigns" | "/calendar" | "/assets" | "/instagram" | "/brand" | "/connect" | "/inspire"; label: string; icon: LucideIcon; id: NavId }[] = [
  { to: "/", label: "首頁", icon: Sparkles, id: "home" },
  { to: "/create", label: "創作", icon: Sparkles, id: "create" },
  { to: "/campaigns", label: "活動", icon: Sparkles, id: "campaigns" },
  { to: "/calendar", label: "排程", icon: CalendarDays, id: "calendar" },
  { to: "/assets", label: "素材", icon: Images, id: "assets" },
  { to: "/instagram", label: "IG", icon: Instagram, id: "ig" },
  { to: "/inspire", label: "靈感", icon: Lightbulb, id: "inspire" },
  { to: "/brand", label: "品牌", icon: SwatchBook, id: "brand" },
  { to: "/connect", label: "連接", icon: Sparkles, id: "connect" },
];

function activeKey(pathname: string): NavId {
  if (pathname.startsWith("/studio") || pathname.startsWith("/create") || pathname.startsWith("/assistant")) return "create";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/assets")) return "assets";
  if (pathname.startsWith("/instagram")) return "ig";
  if (pathname.startsWith("/campaigns")) return "campaigns";
  if (pathname.startsWith("/brand")) return "brand";
  if (pathname.startsWith("/inspire")) return "inspire";
  if (pathname.startsWith("/connect")) return "connect";
  if (pathname.startsWith("/export")) return "create";
  return "home";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const setAssistantOpen = useUi((s) => s.setAssistantOpen);
  const current = activeKey(pathname);
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="hero-wash flex min-h-dvh min-w-0 overflow-x-hidden text-fg">
      <aside className="sticky top-0 hidden h-dvh w-[4.75rem] shrink-0 flex-col border-r border-border/80 bg-surface/80 backdrop-blur-md lg:flex">
        <Link to="/" className="flex h-14 items-center justify-center font-display text-lg tracking-tight" aria-label={`${APP_NAME}首頁`}>
          光
        </Link>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {DESKTOP_NAV.map((item) => {
            const active = current === item.id;
            return (
              <Link
                key={item.id}
                to={item.to}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] transition-colors",
                  active ? "bg-accent text-accent-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
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
            onClick={() => (lastProjectId ? navigate({ to: "/studio/$projectId", params: { projectId: lastProjectId } }) : setAssistantOpen(true))}
            className="flex size-11 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="打開畫布"
          >
            <Sparkles className="size-4" />
          </button>
          <SaveIndicator />
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col overflow-x-hidden">
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden pb-nav">{children}</div>
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
          <div className="grid grid-cols-5">
            <Tab to="/" label="首頁" icon={Sparkles} active={current === "home"} />
            <Tab to="/calendar" label="排程" icon={CalendarDays} active={current === "calendar"} />
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="relative flex h-14 flex-col items-center justify-center"
              aria-label="AI 創作"
            >
              <span className="-mt-6 flex size-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-[var(--shadow-artboard)]">
                <Plus className="size-6" />
              </span>
            </button>
            <Tab to="/assets" label="素材" icon={Images} active={current === "assets"} />
            <Tab to="/instagram" label="IG" icon={Instagram} active={current === "ig"} />
          </div>
        </nav>
      </div>
      <CreateLaunchSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function Tab({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: "/" | "/calendar" | "/assets" | "/instagram";
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link to={to} className={cn("flex h-14 min-h-11 flex-col items-center justify-center gap-1 text-xs", active ? "text-fg" : "text-muted")}>
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
