import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function BrandSubnav({ current }: { current: "brand" | "assets" | "connections" }) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-lg bg-surface-2 p-1">
      <Link
        to="/brand"
        className={cn(
          "flex min-h-11 items-center rounded-md px-3 text-sm",
          current === "brand" ? "bg-surface text-fg shadow-[var(--shadow-border)]" : "text-muted",
        )}
      >
        品牌規範
      </Link>
      <Link
        to="/assets"
        className={cn(
          "flex min-h-11 items-center rounded-md px-3 text-sm",
          current === "assets" ? "bg-surface text-fg shadow-[var(--shadow-border)]" : "text-muted",
        )}
      >
        素材庫
      </Link>
      <Link
        to="/connections"
        className={cn(
          "flex min-h-11 items-center rounded-md px-3 text-sm",
          current === "connections" ? "bg-surface text-fg shadow-[var(--shadow-border)]" : "text-muted",
        )}
      >
        連接
      </Link>
    </div>
  );
}
