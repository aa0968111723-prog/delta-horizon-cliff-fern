import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function BrandSubnav({ current }: { current: "brand" | "assets" | "connections" | "export" }) {
  const items = [
    { to: "/brand", id: "brand" as const, label: "品牌記憶" },
    { to: "/assets", id: "assets" as const, label: "素材庫" },
    { to: "/connections", id: "connections" as const, label: "連接" },
    { to: "/export", id: "export" as const, label: "輸出" },
  ];
  return (
    <div className="inline-flex flex-wrap rounded-lg bg-surface-2 p-1">
      {items.map((item) => (
        <Link
          key={item.id}
          to={item.to}
          className={cn(
            "flex h-9 items-center rounded-md px-3 text-sm",
            current === item.id ? "bg-surface text-fg shadow-[var(--shadow-border)]" : "text-muted",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
