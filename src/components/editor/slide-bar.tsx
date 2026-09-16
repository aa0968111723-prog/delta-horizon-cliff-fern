import { ChevronLeft, ChevronRight, Copy, LayoutGrid, Plus, RefreshCw, Rows3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ADAPT_FORMATS, PAGE_ROLE_LABEL } from "@/lib/studio/carousel";
import { formatById } from "@/lib/studio/formats";
import { MAX_SLIDES, pagesOf } from "@/lib/studio/layers";
import { slideBarCanExpand, slideBarKindLabel } from "@/lib/studio/status";
import type { FormatId, Project } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

export function SlideBar({ project, compact = false }: { project: Project; compact?: boolean }) {
  const setSlide = useStudio((s) => s.setSlide);
  const addSlide = useStudio((s) => s.addSlide);
  const removeSlide = useStudio((s) => s.removeSlide);
  const reorderSlide = useStudio((s) => s.reorderSlide);
  const regenerateSlide = useStudio((s) => s.regenerateSlide);
  const expandCarousel = useStudio((s) => s.expandCarousel);
  const adaptToFormat = useStudio((s) => s.adaptToFormat);
  const setCarouselPreview = useUi((s) => s.setCarouselPreview);
  const pages = pagesOf(project);
  const index = project.slideIndex ?? 0;
  const canAdd = pages.length < MAX_SLIDES;
  const current = pages[index];

  function adapt(formatId: FormatId) {
    const from = formatById(project.activeFormatId);
    const to = formatById(formatId);
    adaptToFormat(project.id, formatId);
    toast.success(
      formatId === project.activeFormatId
        ? `已重排 ${pages.length} 頁 · ${to.short}`
        : `已保留 ${from.short} 原版，並重排出 ${to.short}`,
    );
  }

  return (
    <div className="space-y-1.5 px-2 py-1.5">
      <div className="flex items-center gap-1 overflow-x-auto">
        <p className="mr-1 shrink-0 text-xs text-muted" data-testid="slide-bar-label">
          {slideBarKindLabel(project.contentKind)}
        </p>
        {pages.map((page, i) => (
          <Button
            key={`${page.role ?? "page"}-${i}`}
            size="sm"
            variant={i === index ? "default" : "secondary"}
            onClick={() => setSlide(project.id, i)}
            data-testid={page.role ? `slide-role-${page.role}` : undefined}
            className={cn("min-h-11 shrink-0 tabular-nums")}
          >
            {page.role ? PAGE_ROLE_LABEL[page.role] : i + 1}
          </Button>
        ))}
        <span className="ml-1 shrink-0 text-xs text-subtle tabular-nums" data-testid="slide-count">
          {index + 1}/{pages.length}
        </span>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto">
        <Button
          size="icon"
          variant="ghost"
          aria-label="左移"
          disabled={index <= 0}
          onClick={() => reorderSlide(project.id, index, index - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="右移"
          disabled={index >= pages.length - 1}
          onClick={() => reorderSlide(project.id, index, index + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="新增空白頁"
          disabled={!canAdd}
          onClick={() => addSlide(project.id, "blank")}
        >
          <Plus className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="複製此頁"
          disabled={!canAdd}
          onClick={() => addSlide(project.id, "duplicate")}
        >
          <Copy className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="重排此頁"
          onClick={() => {
            regenerateSlide(project.id);
            toast.success(`已重排「${current?.role ? PAGE_ROLE_LABEL[current.role] : "此頁"}」`);
          }}
        >
          <RefreshCw className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="刪除此頁"
          disabled={pages.length <= 1}
          onClick={() => removeSlide(project.id)}
        >
          <Trash2 className="size-4" />
        </Button>
        <Button
          size="sm"
          className="min-h-11 shrink-0"
          variant="ghost"
          onClick={() => setCarouselPreview(true)}
          data-testid="carousel-preview-open"
        >
          <Rows3 className="size-4" />
          {compact ? "預覽" : "整組預覽"}
        </Button>
        {slideBarCanExpand(project.contentKind) && pages.length < 6 ? (
          <Button
            size="sm"
            className="min-h-11 shrink-0"
            variant="secondary"
            data-testid="slide-bar-expand"
            onClick={() => {
              expandCarousel(project.id);
              toast.success("已展開為六頁輪播腳本");
            }}
          >
            {compact ? "六頁" : "展開六頁"}
          </Button>
        ) : null}
        {compact
          ? ADAPT_FORMATS.map((id) => {
              const format = formatById(id);
              const active = project.activeFormatId === id;
              return (
                <Button
                  key={id}
                  size="sm"
                  className="min-h-11 shrink-0"
                  variant={active ? "default" : "secondary"}
                  data-testid={`adapt-format-${id}`}
                  onClick={() => adapt(id)}
                >
                  {active ? `重排 ${format.short}` : format.short}
                </Button>
              );
            })
          : null}
      </div>
      {compact ? null : (
      <div className="flex items-center gap-1 overflow-x-auto">
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
          <LayoutGrid className="size-3.5" />
          自動排版
        </span>
        {ADAPT_FORMATS.map((id) => {
          const format = formatById(id);
          const active = project.activeFormatId === id;
          return (
            <Button
              key={id}
              size="sm"
              className="min-h-11"
              variant={active ? "default" : "secondary"}
              data-testid={`adapt-format-${id}`}
              onClick={() => adapt(id)}
            >
              {active ? `重排 ${format.short}` : format.short}
            </Button>
          );
        })}
      </div>
      )}
    </div>
  );
}
