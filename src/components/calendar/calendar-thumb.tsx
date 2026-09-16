import { cn } from "@/lib/utils";
import type { CalendarItem } from "@/lib/creative/types";

export function CalendarThumb({
  item,
  urls,
  size = "md",
}: {
  item: Pick<CalendarItem, "coverAssetId" | "coverUrl" | "coverFromCanva">;
  urls: Record<string, string>;
  size?: "sm" | "md";
}) {
  const src = (item.coverAssetId ? urls[item.coverAssetId] : undefined) || item.coverUrl;
  if (!src) return null;
  return (
    <span
      data-cal-cover=""
      data-cover-from={item.coverFromCanva ? "canva" : "asset"}
      className={cn(
        "relative shrink-0 overflow-hidden bg-surface-2 shadow-[var(--shadow-border)]",
        size === "sm" ? "size-7 rounded-md" : "size-12 rounded-xl",
      )}
    >
      <img src={src} alt="" className="size-full object-cover" />
    </span>
  );
}
