import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function BrandSubnav({ current }: { current: "brand" | "assets" | "connect" }) {
  return (
    <div className="inline-flex rounded-lg bg-surface-2 p-1">
      <Link
        to="/brand"
        className={cn(
          "flex h-9 items-center rounded-md px-3 text-sm",
          current === "brand" ? "bg-surface text-fg shadow-[var(--shadow-border)]" : "text-muted",
        )}
      >
        品牌記憶
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
      <Link
        to="/connect"
        className={cn(
          "flex h-9 items-center rounded-md px-3 text-sm",
          current === "connect" ? "bg-surface text-fg shadow-[var(--shadow-border)]" : "text-muted",
        )}
      >
        連接
      </Link>
    </div>
  );
}
