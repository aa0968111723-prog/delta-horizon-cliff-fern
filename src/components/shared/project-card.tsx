import { Link } from "@tanstack/react-router";
import { format as formatDate } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Copy, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { ArtboardView } from "@/components/studio/artboard-view";
import { ContentFlowBar } from "@/components/shared/content-flow";
import { Button } from "@/components/ui/button";
import { formatById } from "@/lib/studio/formats";
import { contentKindLabel } from "@/lib/studio/status";
import type { BrandKit, Project } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

export function ProjectCard({
  project,
  brand,
  urls,
  onDuplicate,
  onDelete,
  footer,
  compact,
}: {
  project: Project;
  brand?: BrandKit;
  urls: Record<string, string>;
  onDuplicate?: () => void;
  onDelete?: () => void;
  footer?: ReactNode;
  compact?: boolean;
}) {
  const board = project.artboards[project.activeFormatId];
  const format = formatById(project.activeFormatId);
  const previewW = compact ? 112 : Math.min(180, (180 * format.width) / format.height);

  return (
    <article className="group rounded-2xl surface-card p-3">
      <Link
        to="/studio/$projectId"
        params={{ projectId: project.id }}
        className={cn(
          "block overflow-hidden rounded-lg bg-bg",
          compact ? "h-40" : "h-52",
        )}
      >
        <div className="flex h-full items-center justify-center p-3">
          {board && brand ? (
            <ArtboardView artboard={board} brand={brand} urls={urls} width={previewW} />
          ) : (
            <span className="text-sm text-muted">尚無畫布</span>
          )}
        </div>
      </Link>
      <div className="flex items-start justify-between gap-2 px-1 pt-3">
        <div className="min-w-0">
          <Link
            to="/studio/$projectId"
            params={{ projectId: project.id }}
            className="block truncate font-medium"
          >
            {project.name}
          </Link>
          <p className="mt-0.5 text-xs text-muted">
            {contentKindLabel(project.contentKind)} · {format.short} ·{" "}
            {formatDate(project.updatedAt, "M/d HH:mm", { locale: zhTW })}
          </p>
          {project.sources.length ? (
            <p className="mt-1 truncate text-xs text-subtle">
              來源 {project.sources.map((src) => src.label).join("、")}
            </p>
          ) : null}
        </div>
        <StatusBadge status={project.status} contentStatus={project.contentStatus} />
      </div>
      {footer ?? (
        <div className="mt-1 flex justify-end">
          {onDuplicate ? (
            <Button variant="ghost" size="icon-sm" aria-label="複製專案" onClick={onDuplicate}>
              <Copy className="size-4" />
            </Button>
          ) : null}
          {onDelete ? (
            <Button variant="ghost" size="icon-sm" aria-label="刪除專案" onClick={onDelete}>
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      )}
    </article>
  );
}
