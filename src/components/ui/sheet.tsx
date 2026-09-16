import type * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  className,
  children,
  side = "bottom",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  side?: "bottom" | "right";
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-fg/30" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 bg-surface shadow-[var(--shadow-border)] outline-none",
          side === "bottom" && "inset-x-0 bottom-0 max-h-[78dvh] overflow-y-auto rounded-t-xl p-4",
          side === "right" && "inset-y-0 right-0 h-full w-[min(100%,22rem)] p-4",
          className,
        )}
        {...props}
      >
        {side === "bottom" && (
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" />
        )}
        {children}
        <DialogPrimitive.Close className="absolute top-3 right-3 rounded-md p-2 text-muted hover:bg-surface-2">
          <X className="size-4" />
          <span className="sr-only">關閉</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("pr-8", className)} {...props} />;
}

export function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title className={cn("text-base font-medium", className)} {...props} />
  );
}
