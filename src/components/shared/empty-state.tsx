import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl surface-card px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-lg bg-surface-2 text-muted">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 font-display text-xl tracking-tight">{title}</p>
      {description ? <p className="mt-2 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = "載入中…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-sm text-muted">
      <span className="size-6 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
      {label}
    </div>
  );
}

export function ErrorState({
  title = "出了一點問題",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl surface-card px-5 py-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-sm text-danger">{message}</p>
      {onRetry ? (
        <Button className="mt-5" variant="secondary" onClick={onRetry}>
          再試一次
        </Button>
      ) : null}
    </div>
  );
}
