import { Check, LoaderCircle, TriangleAlert } from "lucide-react";
import { useUi } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function SaveIndicator({ className }: { className?: string }) {
  const status = useUi((s) => s.saveStatus);
  if (status === "idle") return null;

  const label =
    status === "saving" ? "儲存中" : status === "saved" ? "已儲存" : "儲存失敗";

  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs",
        status === "error" ? "text-danger" : "text-muted",
        className,
      )}
      aria-live="polite"
    >
      {status === "saving" ? (
        <LoaderCircle className="size-3.5 animate-spin" />
      ) : status === "saved" ? (
        <Check className="size-3.5 text-success" />
      ) : (
        <TriangleAlert className="size-3.5" />
      )}
      {label}
    </span>
  );
}
