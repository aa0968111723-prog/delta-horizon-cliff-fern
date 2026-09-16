import { Link } from "@tanstack/react-router";
import { format as formatDate } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import type { ContentItem } from "@/lib/studio/types";
import { CONTENT_STATUS, contentTypeShort } from "@/lib/zen/labels";
import { cn } from "@/lib/utils";

export function ContentStatusBadge({ status }: { status: ContentItem["status"] }) {
  const meta = CONTENT_STATUS[status];
  return <Badge variant={meta.tone}>{meta.label}</Badge>;
}

export function ContentCard({
  content,
  urls,
  compact,
  className,
}: {
  content: ContentItem;
  urls: Record<string, string>;
  compact?: boolean;
  className?: string;
}) {
  const cover = content.coverAssetId ? urls[content.coverAssetId] : undefined;
  const when = content.publishedAt ?? content.scheduledAt;
  return (
    <Link
      to="/create"
      search={{
        contentId: content.id,
        mode: content.type === "reels" ? "reels" : content.type === "story" ? "story" : content.type === "carousel" ? "carousel" : "post",
      }}
      className={cn(
        "group flex gap-3 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-border-hover)]",
        compact ? "min-w-[15rem]" : "",
        className,
      )}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-glow-card">
        {cover ? <img src={cover} alt="" className="size-full object-cover" /> : null}
        <span className="absolute bottom-1 left-1 rounded-md bg-night/80 px-1.5 py-0.5 text-[10px] text-night-fg">
          {contentTypeShort(content.type)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-medium leading-snug">{content.copy.hook || content.title}</p>
          <ContentStatusBadge status={content.status} />
        </div>
        <p className="mt-1 truncate text-xs text-muted">{content.title}</p>
        {when ? (
          <p className="mt-1 text-xs text-subtle tabular-nums">
            {content.status === "published" ? "發布 " : "預計 "}
            {formatDate(when, "M/d (EEEEE) HH:mm", { locale: zhTW })}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
