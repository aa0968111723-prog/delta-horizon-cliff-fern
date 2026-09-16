import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="light"
      position="top-center"
      offset="4.75rem"
      toastOptions={{
        classNames: {
          toast:
            "max-w-[min(22rem,calc(100vw-1.5rem))] break-words bg-surface text-fg border-border shadow-[var(--shadow-border)]",
        },
      }}
    />
  );
}
