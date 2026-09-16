import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      suppressHydrationWarning
      className={cn(
        "flex h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg outline-none",
        "placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      suppressHydrationWarning
      className={cn(
        "flex min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg outline-none",
        "placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
