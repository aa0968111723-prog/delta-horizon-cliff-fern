import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      offset="calc(var(--spacing-nav-safe) + 0.75rem)"
      toastOptions={{
        classNames: {
          toast: "bg-surface text-fg border-border shadow-[var(--shadow-border)]",
        },
      }}
    />
  );
}
