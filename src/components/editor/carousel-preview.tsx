import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { ArtboardView } from "@/components/studio/artboard-view";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { PAGE_ROLE_LABEL } from "@/lib/studio/carousel";
import { formatById } from "@/lib/studio/formats";
import { pagesOf } from "@/lib/studio/layers";
import type { BrandKit, Project } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

export function CarouselPreview({
  project,
  brand,
  open,
  onOpenChange,
}: {
  project: Project;
  brand: BrandKit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setSlide = useStudio((s) => s.setSlide);
  const pages = pagesOf(project);
  const index = project.slideIndex ?? 0;
  const format = formatById(project.activeFormatId);

  const assetIds = useMemo(() => {
    const ids: string[] = [];
    for (const page of pages) {
      for (const layer of page.layers) {
        if (layer.type === "image") ids.push(layer.assetId);
        if (layer.type === "logo" && layer.assetId) ids.push(layer.assetId);
      }
      if (page.background.assetId) ids.push(page.background.assetId);
    }
    if (brand.logoAssetId) ids.push(brand.logoAssetId);
    return ids;
  }, [pages, brand.logoAssetId]);
  const urls = useAssetUrls(assetIds);
  const current = pages[index];
  const previewWidth = format.height > format.width ? 220 : 280;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg" data-testid="carousel-preview">
        <DialogHeader>
          <DialogTitle>整組預覽</DialogTitle>
          <DialogDescription>
            {format.name} · {pages.length} 頁。點縮圖可進入該頁編輯。
          </DialogDescription>
        </DialogHeader>
        {current ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm">
              {index + 1}/{pages.length}
              {current.role ? ` · ${PAGE_ROLE_LABEL[current.role]}` : ""}
            </p>
            <div className="overflow-hidden rounded-lg bg-bg shadow-[var(--shadow-artboard)]">
              <ArtboardView artboard={current} brand={brand} urls={urls} width={previewWidth} />
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={index <= 0}
                onClick={() => setSlide(project.id, index - 1)}
              >
                <ChevronLeft className="size-4" />
                上一頁
              </Button>
              <Button
                variant="secondary"
                disabled={index >= pages.length - 1}
                onClick={() => setSlide(project.id, index + 1)}
              >
                下一頁
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {pages.map((page, i) => {
            const thumbW = Math.round(72 * (format.width / format.height));
            return (
              <button
                key={`${page.role ?? "p"}-${i}`}
                type="button"
                onClick={() => setSlide(project.id, i)}
                className={cn(
                  "shrink-0 overflow-hidden rounded-md",
                  i === index ? "ring-2 ring-ring" : "opacity-80 hover:opacity-100",
                )}
              >
                <ArtboardView artboard={page} brand={brand} urls={urls} width={Math.max(48, thumbW)} />
                <span className="mt-1 block text-center text-xs text-muted">
                  {page.role ? PAGE_ROLE_LABEL[page.role] : i + 1}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
