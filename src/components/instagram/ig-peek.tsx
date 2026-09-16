import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog, DialogClose, DialogDescription, DialogTitle, DialogViewport } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * IG 個人頁點開預覽：深色全畫面，中間放限動或貼文。
 * 不跳去編輯器；要改稿再按「打開這則」。
 */
export function IgPeek({
  open,
  onOpenChange,
  title,
  width = "story",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  width?: "story" | "feed";
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogViewport
        overlayClassName="bg-fg/70"
        data-testid="ig-peek"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) onOpenChange(false);
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">點畫面左右切換，或關閉回到個人頁。</DialogDescription>
        <div className={cn("relative w-full", width === "story" ? "max-w-[18rem]" : "max-w-sm")}>
          <DialogClose
            data-testid="ig-peek-close"
            className="absolute top-0 right-0 z-10 flex size-11 items-center justify-center rounded-full bg-surface/85 text-fg shadow-[var(--shadow-border)]"
          >
            <X className="size-4" />
            <span className="sr-only">關閉</span>
          </DialogClose>
          {children}
        </div>
      </DialogViewport>
    </Dialog>
  );
}
