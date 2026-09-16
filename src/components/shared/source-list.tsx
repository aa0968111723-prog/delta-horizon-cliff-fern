import { Link } from "@tanstack/react-router";
import { SOURCE_KIND_LABEL } from "@/lib/studio/sources";
import type { CreativeSourceRef } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

export function SourceList({
  sources,
  className,
}: {
  sources: CreativeSourceRef[];
  className?: string;
}) {
  if (!sources.length) return null;
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-xs text-muted">這則用到的來源</p>
      <ul className="flex flex-wrap gap-1.5">
        {sources.map((src, index) => {
          const label = `${SOURCE_KIND_LABEL[src.kind]} · ${src.label}`;
          const title = src.detail ? `${label}（${src.detail}）` : label;
          const chip = (
            <span
              title={title}
              className="inline-flex max-w-full items-center rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted"
            >
              <span className="truncate">{label}</span>
            </span>
          );
          return (
            <li key={`${src.kind}-${src.label}-${index}`} className="min-w-0">
              {src.href ? (
                <a href={src.href} target="_blank" rel="noreferrer" className="block min-w-0">
                  {chip}
                </a>
              ) : src.assetId ? (
                <Link to="/assets" className="block min-w-0">
                  {chip}
                </Link>
              ) : (
                chip
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
