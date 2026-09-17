import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "create", label: "發想", to: "/" },
  { id: "studio", label: "編輯", to: "/studio" },
  { id: "export", label: "輸出", to: "/export" },
] as const;

export function CreationLoop({ current, className }: { current: string; className?: string }) {
  return (
    <nav className={cn("flex flex-wrap items-center gap-1.5 text-xs", className)} aria-label="創作流程">
      {STEPS.map((step, index) => {
        const active = step.id === current;
        return (
          <span key={step.id} className="flex items-center gap-1.5">
            {index > 0 ? <span className="text-subtle">→</span> : null}
            <Link
              to={step.to}
              className={cn(
                "rounded-full px-2.5 py-1",
                active ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
              )}
            >
              {step.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
