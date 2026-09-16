import { Heart, MessageCircle, Play, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CaptionMeter } from "@/components/assistant/caption-meter";
import { ArtboardView } from "@/components/studio/artboard-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import {
  IG_SURFACES,
  captionMeter,
  livePreviewCopy,
  surfaceConversionPatch,
  surfaceFromFormat,
  type IgSurface,
} from "@/lib/studio/ig-surfaces";
import { pagesOf } from "@/lib/studio/layers";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/stores/connection-store";
import { activeArtboard, useStudio } from "@/stores/studio-store";

export function IgPreview({
  projectId,
  surface: requestedSurface,
}: {
  projectId?: string;
  surface?: IgSurface;
}) {
  const projects = useStudio((state) => state.projects);
  const brands = useStudio((state) => state.brands);
  const setCopy = useStudio((state) => state.setCopy);
  const patchPlan = useStudio((state) => state.patchPlan);
  const adaptToFormat = useStudio((state) => state.adaptToFormat);
  const setActiveFormat = useStudio((state) => state.setActiveFormat);
  const setSlide = useStudio((state) => state.setSlide);
  const connectedHandle = useConnectionStore((state) => state.instagramUsername);
  const [selectedId, setSelectedId] = useState(projectId ?? projects[0]?.id ?? "");
  const project = projects.find((item) => item.id === selectedId)
    ?? projects.find((item) => item.id === projectId)
    ?? projects[0];
  const brand = brands.find((item) => item.id === project?.brandId) ?? brands[0];
  const artboard = project ? activeArtboard(project) : undefined;
  const touchX = useRef<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [overlayIndex, setOverlayIndex] = useState(0);
  const [previewSurface, setPreviewSurface] = useState<IgSurface>("feed");
  const [frameWidth, setFrameWidth] = useState(300);
  const appliedSurface = useRef<string>("");

  useEffect(() => {
    if (projectId) setSelectedId(projectId);
  }, [projectId]);

  const pages = project ? pagesOf(project) : [];
  const surface = previewSurface;
  const preview = project ? livePreviewCopy(project, surface, pages.length) : null;

  function applySurfaceTo(target: NonNullable<typeof project>, next: IgSurface) {
    const patch = surfaceConversionPatch(target, next);
    const existing = pagesOf(target, patch.formatId);
    if (patch.formatId !== target.activeFormatId) {
      if (existing.length) setActiveFormat(target.id, patch.formatId);
      else adaptToFormat(target.id, patch.formatId);
    }
    setCopy(target.id, patch.copy);
    if (patch.planPatch) patchPlan(target.id, patch.planPatch);
    setOverlayIndex(0);
    setPreviewSurface(next);
  }

  useEffect(() => {
    if (!project) return;
    setPreviewSurface(surfaceFromFormat(project.activeFormatId, pagesOf(project).length));
  }, [project?.id]);

  useEffect(() => {
    if (!project || !requestedSurface) return;
    const key = `${project.id}:${requestedSurface}`;
    if (appliedSurface.current === key) return;
    const current = surfaceFromFormat(project.activeFormatId, pagesOf(project).length);
    appliedSurface.current = key;
    if (current === requestedSurface) return;
    applySurfaceTo(project, requestedSurface);
    // Convert once when arriving from 排程 with a surface, not on every artboard tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, requestedSurface]);

  const assetIds = useMemo(() => {
    const ids: string[] = [];
    if (!artboard || !brand) return ids;
    if (artboard.background.assetId) ids.push(artboard.background.assetId);
    for (const layer of artboard.layers) {
      if (layer.type === "image") ids.push(layer.assetId);
      if (layer.type === "logo" && layer.assetId) ids.push(layer.assetId);
    }
    if (brand.logoAssetId) ids.push(brand.logoAssetId);
    return ids;
  }, [artboard, brand]);
  const urls = useAssetUrls(assetIds);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setFrameWidth(Math.max(160, Math.floor(el.clientWidth)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [project?.id, previewSurface]);

  if (!project || !brand || !artboard || !preview) {
    return (
      <div className="rounded-3xl bg-surface p-8 text-center shadow-[var(--shadow-border)]">
        <p className="font-medium">還沒有可預覽的 Studio 畫面</p>
        <p className="mt-2 text-sm text-muted">先在 AI 創作或 Studio 完成一則貼文，再回來看成 IG 預覽。</p>
      </div>
    );
  }

  const story = surface === "story";
  const reels = surface === "reels";
  const tall = story || reels;
  const handle = connectedHandle ? `@${connectedHandle.replace(/^@/, "")}` : (brand.handle || "@tku_zen");
  const slideIndex = project.slideIndex ?? 0;
  const overlay = preview.overlay;
  const storyCount = Math.max(story ? overlay.length || pages.length : pages.length, 1);
  const storyFrame = overlay[Math.min(overlayIndex, Math.max(overlay.length - 1, 0))] ?? overlay[0] ?? "";
  const caption = preview.caption;
  const hashtags = preview.hashtags;
  const meter = captionMeter(caption, hashtags);
  const folded = !story && meter.overPreview;
  const captionBody = hashtags
    .reduce((text, tag) => text.split(tag).join(""), caption)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const tagsLine = hashtags.join(" ");

  function applySurface(next: IgSurface) {
    applySurfaceTo(project, next);
  }

  function swipe(direction: -1 | 1) {
    if (story && overlay.length > 1) {
      setOverlayIndex((index) => Math.min(overlay.length - 1, Math.max(0, index + direction)));
      return;
    }
    if (pages.length < 2) return;
    const next = Math.min(pages.length - 1, Math.max(0, slideIndex + direction));
    setSlide(project.id, next);
  }

  const canvasWidth = tall ? Math.min(224, frameWidth) : frameWidth;

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,auto)_minmax(0,1fr)]">
      <div className="mx-auto w-full min-w-0 max-w-sm">
        <div
          className="overflow-hidden rounded-3xl bg-fg p-3 text-bg shadow-[var(--shadow-artboard)]"
          data-testid="ig-phone-preview"
          data-ig-format={project.activeFormatId}
          data-ig-surface={surface}
          onTouchStart={(event) => {
            touchX.current = event.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const start = touchX.current;
            const end = event.changedTouches[0]?.clientX;
            if (start == null || end == null) return;
            if (end - start > 40) swipe(-1);
            if (start - end > 40) swipe(1);
            touchX.current = null;
          }}
        >
          <div className="mb-3 flex items-center justify-between px-2 text-xs tracking-wide text-bg/70">
            <span>9:41</span>
            <span>{story ? "限動預覽" : reels ? "Reels 預覽" : "貼文預覽"}</span>
          </div>
          {story ? (
            <div className="mb-2 flex gap-1">
              {Array.from({ length: storyCount }, (_, index) => (
                <span key={`story-seg-${index}`} className="h-0.5 flex-1 overflow-hidden rounded-full bg-bg/20">
                  <span
                    className="block h-full bg-bg"
                    style={{ width: index < overlayIndex ? "100%" : index === overlayIndex ? "70%" : "0%" }}
                  />
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-1 pb-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs text-accent-fg">禪</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{handle}</p>
                <p className="text-xs text-bg/60">{reels ? "原音" : "淡水・校園"}</p>
              </div>
            </div>
          )}
          <div
            ref={frameRef}
            className={cn("relative overflow-hidden rounded-xl bg-bg", tall ? "mx-auto w-full max-w-56" : "w-full")}
          >
            <div className="mx-auto w-fit max-w-full" data-testid="ig-preview-canvas">
              <ArtboardView artboard={artboard} brand={brand} urls={urls} width={canvasWidth} />
            </div>
            {reels ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-fg/70 text-bg">
                  <Play className="size-5 fill-current" />
                </span>
              </div>
            ) : null}
            {story && storyFrame ? (
              <p className="pointer-events-none absolute inset-x-4 bottom-10 rounded-xl bg-fg/70 px-3 py-2 text-center text-sm leading-6 text-bg">
                {storyFrame}
              </p>
            ) : null}
            {reels && overlay[0] ? (
              <p className="pointer-events-none absolute inset-x-3 top-10 rounded-lg bg-fg/55 px-2 py-1 text-center text-xs leading-5 text-bg">
                {overlay[0]}
              </p>
            ) : null}
          </div>
          {pages.length > 1 && surface === "carousel" ? (
            <div className="mt-2 flex justify-center gap-1">
              {pages.map((page, index) => (
                <span
                  key={`${page.role ?? "page"}-${index}`}
                  className={cn("size-1.5 rounded-full", index === slideIndex ? "bg-bg" : "bg-bg/30")}
                />
              ))}
            </div>
          ) : null}
          {story ? null : (
            <div className="mt-3 flex items-center gap-4 px-1 text-bg" data-testid="ig-no-likes">
              <Heart className="size-5" aria-hidden />
              <MessageCircle className="size-5" aria-hidden />
              <Send className="size-5" aria-hidden />
              <span className="sr-only">圖示不含數字</span>
            </div>
          )}
          {story ? null : (
            <div className="mt-3 max-h-40 overflow-y-auto px-1 pb-2 text-sm leading-6 text-bg">
              <p className="whitespace-pre-line" data-testid="ig-preview-caption">
                <span className="font-medium">{handle} </span>
                {folded ? `${captionBody.split(/\n/)[0]?.slice(0, 125)}… 更多` : captionBody}
              </p>
              {tagsLine ? (
                <p className="mt-2 break-words text-xs leading-5 text-bg/75" data-testid="ig-preview-hashtags">
                  {tagsLine}
                </p>
              ) : null}
            </div>
          )}
        </div>
        <p className="mt-3 text-center text-xs leading-5 text-muted">
          {reels
            ? "這是這則網宣的 Reels 封面預覽，不是發文，也不會上傳 Instagram。"
            : story
              ? "這是這則網宣的限動預覽，不是發文。"
              : "這是這則網宣的貼文預覽，不是發文，也不會連到 Instagram 上傳。"}
        </p>
      </div>
      <div className="min-w-0 space-y-4">
        {projects.length > 1 ? (
          <div>
            <p className="text-xs text-muted">這一則網宣</p>
            <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
              {projects.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "min-h-11 shrink-0 rounded-full px-3 text-sm",
                    item.id === project.id ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]",
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div>
          <p className="text-xs text-muted">切換成轉換後的 Feed／Story／Reels</p>
          <div className="-mx-1 mt-2 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1" data-testid="ig-preview-surfaces">
            {IG_SURFACES.map((item) => (
              <button
                key={item.id}
                type="button"
                data-testid={`ig-preview-surface-${item.id}`}
                onClick={() => applySurface(item.id)}
                className={cn(
                  "min-h-14 min-w-32 shrink-0 rounded-xl px-3 py-2 text-left",
                  surface === item.id ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]",
                )}
              >
                <span className="block text-sm font-medium">{item.label}</span>
                <span className={cn("mt-0.5 block text-xs", surface === item.id ? "text-accent-fg/80" : "text-subtle")}>
                  {item.hint}
                </span>
              </button>
            ))}
          </div>
        </div>
        {pages.length > 1 ? (
          <div>
            <p className="text-xs text-muted">Carousel 共 {pages.length} 頁，現在預覽第 {slideIndex + 1} 頁。手機可左右滑。</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {pages.map((page, index) => (
                <Button
                  key={`${page.role ?? "page"}-${index}`}
                  size="sm"
                  variant={slideIndex === index ? "default" : "secondary"}
                  className="min-h-11"
                  onClick={() => setSlide(project.id, index)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        {story && overlay.length > 1 ? (
          <div>
            <p className="text-xs text-muted">限動 {overlay.length} 則，現在第 {overlayIndex + 1} 則。手機可左右滑。</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {overlay.map((_, index) => (
                <Button
                  key={`overlay-${index}`}
                  size="sm"
                  variant={overlayIndex === index ? "default" : "secondary"}
                  className="min-h-11"
                  onClick={() => setOverlayIndex(index)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        {caption ? (
          <div>
            <p className="text-xs text-muted">目前貼文與 hashtag</p>
            <div className="mt-2">
              <CaptionMeter caption={caption} hashtags={hashtags} />
            </div>
            <p className="mt-2 whitespace-pre-line rounded-xl bg-surface p-3 text-sm leading-6 shadow-[var(--shadow-border)]">
              {caption}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted">還沒有文案。到 AI 創作寫學生版貼文後，這裡會套上這則網宣的 Caption 與 hashtag。</p>
        )}
        <Badge variant="default">這是預覽，不是發文</Badge>
        <p className="text-xs leading-5 text-muted">
          畫面來自 Studio 畫布，文案與 hashtag 來自這則網宣。切換尺寸會套用 Feed／Story／Reels 轉換，愛心只是圖示。
        </p>
      </div>
    </div>
  );
}
