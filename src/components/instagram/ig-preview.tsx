import { Heart, MessageCircle, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { ArtboardView } from "@/components/studio/artboard-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { FORMATS } from "@/lib/studio/formats";
import { pagesOf } from "@/lib/studio/layers";
import type { FormatId } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { activeArtboard, useStudio } from "@/stores/studio-store";

export function IgPreview({ projectId }: { projectId?: string }) {
  const projects = useStudio((state) => state.projects);
  const brands = useStudio((state) => state.brands);
  const setActiveFormat = useStudio((state) => state.setActiveFormat);
  const setSlide = useStudio((state) => state.setSlide);
  const [selectedId, setSelectedId] = useState(projectId ?? projects[0]?.id ?? "");
  const project = projects.find((item) => item.id === selectedId) ?? projects.find((item) => item.id === projectId) ?? projects[0];
  const brand = brands.find((item) => item.id === project?.brandId) ?? brands[0];
  const artboard = project ? activeArtboard(project) : undefined;
  const [captionTone, setCaptionTone] = useState(0);

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

  if (!project || !brand || !artboard) {
    return (
      <div className="rounded-3xl bg-surface p-8 text-center shadow-[var(--shadow-border)]">
        <p className="font-medium">還沒有可預覽的 Studio 畫面</p>
        <p className="mt-2 text-sm text-muted">先在 AI 創作或 Studio 完成一則貼文，再回來看成 IG 預覽。</p>
      </div>
    );
  }

  const pack = project.plan?.copyPack;
  const variant = pack?.variants[captionTone] ?? pack?.variants[0];
  const caption = variant
    ? `${variant.body}\n\n${variant.cta}\n\n${variant.hashtags.join(" ")}`
    : project.copy.caption;
  const pages = pagesOf(project);
  const formatId = project.activeFormatId;
  const tall = formatId === "story" || formatId === "reels-cover";

  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
      <div className="mx-auto w-full max-w-sm">
        <div
          className="overflow-hidden rounded-[1.75rem] bg-fg p-3 text-bg shadow-[var(--shadow-artboard)]"
          data-testid="ig-phone-preview"
        >
          <div className="mb-3 flex items-center justify-between px-2 text-[10px] tracking-wide text-bg/70">
            <span>9:41</span>
            <span>IG 預覽</span>
          </div>
          <div className="flex items-center gap-2 px-1 pb-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs text-accent-fg">禪</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{brand.handle || "淡江禪學社"}</p>
              <p className="text-[10px] text-bg/60">淡水・校園</p>
            </div>
          </div>
          <div className={cn("overflow-hidden rounded-xl bg-bg", tall ? "mx-auto max-w-56" : "")}>
            <ArtboardView artboard={artboard} brand={brand} urls={urls} width={tall ? 224 : 300} />
          </div>
          <div className="mt-3 flex items-center gap-4 px-1 text-bg">
            <Heart className="size-5" />
            <MessageCircle className="size-5" />
            <Send className="size-5" />
          </div>
          <div className="mt-3 max-h-40 overflow-y-auto px-1 pb-2 text-sm leading-6 text-bg">
            <p className="whitespace-pre-line">
              <span className="font-medium">{brand.handle || "淡江禪學社"} </span>
              {caption}
            </p>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted">這是預覽，不是發文。不會連到 Instagram 上傳。</p>
      </div>
      <div className="space-y-4">
        {projects.length > 1 ? (
          <div>
            <p className="text-xs text-muted">作品</p>
            <Select value={project.id} onValueChange={setSelectedId}>
              <SelectTrigger className="mt-2 min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {projects.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div>
          <p className="text-xs text-muted">尺寸</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {FORMATS.map((format) => (
              <Button
                key={format.id}
                size="sm"
                variant={formatId === format.id ? "default" : "secondary"}
                className="min-h-11"
                onClick={() => setActiveFormat(project.id, format.id as FormatId)}
              >
                {format.name}
              </Button>
            ))}
          </div>
        </div>
        {pages.length > 1 ? (
          <div>
            <p className="text-xs text-muted">Carousel 共 {pages.length} 頁，現在預覽第 {(project.slideIndex ?? 0) + 1} 頁。</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {pages.map((page, index) => (
                <Button
                  key={`${page.role ?? "page"}-${index}`}
                  size="sm"
                  variant={(project.slideIndex ?? 0) === index ? "default" : "secondary"}
                  className="min-h-11"
                  onClick={() => setSlide(project.id, index)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        {pack ? (
          <div>
            <p className="text-xs text-muted">Caption 語氣</p>
            <Select value={String(captionTone)} onValueChange={(value) => setCaptionTone(Number(value))}>
              <SelectTrigger className="mt-2 min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {pack.variants.map((item, index) => (
                  <SelectItem key={item.tone} value={String(index)}>{item.tone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="text-sm text-muted">還沒有 Copy Pack。到 Studio 生成文案後，這裡會套上 Caption 與 hashtags。</p>
        )}
        <Badge variant="default">這是預覽，不是發文</Badge>
      </div>
    </div>
  );
}
