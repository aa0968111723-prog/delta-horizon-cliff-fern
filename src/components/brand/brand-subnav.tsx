import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function BrandSubnav({ current }: { current: "brand" | "assets" }) {
  return (
    <div className="inline-flex rounded-lg bg-surface-2 p-1">
      <Link
        to="/brand"
        className={cn(
          "flex h-9 items-center rounded-md px-3 text-sm",
          current === "brand" ? "bg-surface text-fg shadow-[var(--shadow-border)]" : "text-muted",
        )}
      >
        品牌規範
      </Link>
      <Link
        to="/assets"
        className={cn(
          "flex h-9 items-center rounded-md px-3 text-sm",
          current === "assets" ? "bg-surface text-fg shadow-[var(--shadow-border)]" : "text-muted",
        )}
      >
        素材庫
      </Link>
    </div>
  );
}
