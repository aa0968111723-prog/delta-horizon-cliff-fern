import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  History,
  Images,
  Layers,
  Redo2,
  Scan,
  Sparkles,
  Type,
  Undo2,
} from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AssetTray } from "@/components/editor/asset-tray";
import { HeroPhotoStrip } from "@/components/editor/hero-photo-strip";
import { ArtboardCanvas } from "@/components/editor/artboard-canvas";
import { CopyPanel } from "@/components/editor/copy-panel";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { Inspector } from "@/components/editor/inspector";
import { LayerTree } from "@/components/editor/layer-tree";
import { SlideBar } from "@/components/editor/slide-bar";
import { CarouselPreview } from "@/components/editor/carousel-preview";
import { VersionPanel } from "@/components/editor/version-panel";
import { PublishPreview } from "@/components/create/publish-preview";
import { ReelsTimeline } from "@/components/create/reels-timeline";
import { ConvertBar } from "@/components/create/convert-bar";
import { PackSyncButtons } from "@/components/shared/pack-sync";
import { StudioIgPeekButton } from "@/components/instagram/studio-ig-peek";
import { PlannerPanel } from "@/components/planner/planner-panel";
import { QualityPanel } from "@/components/qa/quality-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { SaveIndicator } from "@/components/shared/save-indicator";
import { ContentFlowBar } from "@/components/shared/content-flow";
import { SourceList } from "@/components/shared/source-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { FORMATS } from "@/lib/studio/formats";
import { pagesOf } from "@/lib/studio/layers";
import { inspectProject } from "@/lib/studio/quality";
import type { FormatId } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { activeArtboard, useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

export function StudioWorkspace({ projectId }: { projectId: string }) {
  const project = useStudio((s) => s.projects.find((p) => p.id === projectId));
  const brands = useStudio((s) => s.brands);
  const setActiveFormat = useStudio((s) => s.setActiveFormat);
  const ensureArtboard = useStudio((s) => s.ensureArtboard);
  const setLastProjectId = useStudio((s) => s.setLastProjectId);
  const editor = useStudio((s) => s.editor);
  const undo = useStudio((s) => s.undo);
  const redo = useStudio((s) => s.redo);
  const removeLayer = useStudio((s) => s.removeLayer);
  const duplicateLayer = useStudio((s) => s.duplicateLayer);
  const nudgeLayer = useStudio((s) => s.nudgeLayer);
  const captureSnapshot = useStudio((s) => s.captureSnapshot);
  const panel = useUi((s) => s.editorPanel);
  const setPanel = useUi((s) => s.setEditorPanel);
  const carouselPreview = useUi((s) => s.carouselPreview);
  const setCarouselPreview = useUi((s) => s.setCarouselPreview);
  const [rightTab, setRightTab] = useState("inspect");

  function openCopyPanel() {
    setRightTab("copy");
    if (typeof window !== "undefined" && !window.matchMedia("(min-width: 1024px)").matches) {
      setPanel("copy");
    }
  }

  function openReelsScript() {
    openCopyPanel();
  }

  useEffect(() => {
    setLastProjectId(projectId);
  }, [projectId, setLastProjectId]);

  useEffect(() => {
    if (project) ensureArtboard(project.id, project.activeFormatId);
  }, [project, ensureArtboard]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      const t = e.target as HTMLElement | null;
      const typing = Boolean(t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable));
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(projectId);
        else undo(projectId);
        return;
      }
      if (meta && e.key.toLowerCase() === "d" && editor.selectedId && !typing) {
        e.preventDefault();
        duplicateLayer(projectId, editor.selectedId);
        return;
      }
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        captureSnapshot(projectId, "手動版本");
        toast.success("已儲存版本");
        return;
      }
      if ((e.key === "Backspace" || e.key === "Delete") && editor.selectedId && !typing) {
        e.preventDefault();
        removeLayer(projectId, editor.selectedId);
        return;
      }
      if (!typing && editor.selectedId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        nudgeLayer(projectId, editor.selectedId, dx, dy);
      }
      if (e.key === "Escape") {
        useStudio.getState().select(null);
        useStudio.getState().setEditor({ tool: "select" });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [projectId, editor.selectedId, undo, redo, removeLayer, duplicateLayer, nudgeLayer, captureSnapshot]);

  const brand = project ? brands.find((b) => b.id === project.brandId) ?? brands[0] : undefined;
  const artboard = project ? activeArtboard(project) : undefined;

  const assetIds = useMemo(() => {
    const ids: string[] = [];
    if (artboard) {
      for (const l of artboard.layers) {
        if (l.type === "image") ids.push(l.assetId);
        if (l.type === "logo" && l.assetId) ids.push(l.assetId);
      }
      if (artboard.background.assetId) ids.push(artboard.background.assetId);
    }
    if (brand?.logoAssetId) ids.push(brand.logoAssetId);
    return ids;
  }, [artboard, brand]);
  const urls = useAssetUrls(assetIds);

  if (!project || !brand) {
    return (
      <div className="flex h-app items-center justify-center px-4">
        <EmptyState
          icon={Layers}
          title="找不到這個專案"
          description="它可能已被刪除，或還沒同步到此裝置。"
          action={
            <Button asChild variant="secondary">
              <Link to="/">回到首頁</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (!artboard) {
    return (
      <div className="flex h-app flex-col items-center justify-center gap-3 text-sm text-muted">
        <span className="size-6 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
        正在建立畫布…
      </div>
    );
  }

  const qa = inspectProject(pagesOf(project), brand, project.copy);

  return (
    <div className="flex h-app flex-col">
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-border bg-surface px-2 md:gap-2 md:px-3">
        <Button asChild size="icon-sm" variant="ghost" aria-label="返回首頁">
          <Link to="/">
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium">{project.name}</h1>
        <ContentFlowBar project={project} variant="compact" />
        <div className="hidden items-center gap-1 md:flex">
          {FORMATS.map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={project.activeFormatId === f.id ? "default" : "ghost"}
              onClick={() => setActiveFormat(project.id, f.id)}
            >
              {f.short}
            </Button>
          ))}
        </div>
        <SaveIndicator className="hidden sm:inline-flex" />
        <Button size="icon-sm" variant="ghost" aria-label="復原" onClick={() => undo(project.id)}>
          <Undo2 className="size-4" />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="重做" onClick={() => redo(project.id)}>
          <Redo2 className="size-4" />
        </Button>
        <button
          type="button"
          data-testid="qa-score-chip"
          onClick={() => {
            setRightTab("qa");
            setPanel("qa");
          }}
          className={cn(
            "px-2 text-xs tabular-nums",
            qa.score >= 85 ? "text-success" : qa.score >= 70 ? "text-warn" : "text-danger",
          )}
        >
          {qa.score}
        </button>
      </header>
      <div className="shrink-0 space-y-2 overflow-x-auto border-b border-border bg-surface px-3 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <ConvertBar project={project} variant="compact" />
          <StudioIgPeekButton project={project} brand={brand} />
          <PackSyncButtons projectId={project.id} />
        </div>
        <p className="text-xs text-subtle">點照片當主視覺。Logo 到左側素材放入。</p>
        <HeroPhotoStrip projectId={project.id} />
        <SourceList sources={project.sources} />
      </div>

      <div className="flex h-0 min-h-0 flex-1">
        <div className="hidden h-full min-h-0 min-w-0 flex-1 lg:block">
          <Group orientation="horizontal" className="h-full">
            <Panel defaultSize="20%" minSize="16%" className="bg-surface">
              <Tabs defaultValue="assets" className="flex h-full min-h-0 flex-col">
                <div className="px-3 pt-3">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="layers">圖層</TabsTrigger>
                    <TabsTrigger value="assets">素材</TabsTrigger>
                    <TabsTrigger value="versions">版本</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="layers" className="min-h-0 flex-1">
                  <LayerTree projectId={project.id} artboard={artboard} brand={brand} />
                </TabsContent>
                <TabsContent value="assets" className="min-h-0 flex-1">
                  <AssetTray projectId={project.id} />
                </TabsContent>
                <TabsContent value="versions" className="min-h-0 flex-1 overflow-y-auto">
                  <VersionPanel project={project} />
                </TabsContent>
              </Tabs>
            </Panel>
            <Separator className="w-1 bg-border hover:bg-border-strong" />
            <Panel defaultSize="56%" minSize="36%">
              <div className="flex h-full min-h-0 flex-col">
                <div className="border-b border-border bg-surface">
                  <EditorToolbar />
                  <SlideBar project={project} />
                </div>
                {project.contentKind === "reels" && project.reels ? (
                  <div className="shrink-0 border-b border-border bg-surface px-3 py-2">
                    <ReelsTimeline
                      variant="compact"
                      reels={project.reels}
                      adapter={project.reels.source}
                      projectId={project.id}
                      onOpenScript={openReelsScript}
                    />
                  </div>
                ) : project.contentKind === "threads" ? (
                  <div className="min-h-0 flex-1 overflow-y-auto border-b border-border bg-surface px-3 py-3">
                    <PublishPreview project={project} brand={brand} urls={urls} />
                  </div>
                ) : project.contentKind === "line" ? (
                  <div className="shrink-0 border-b border-border bg-surface px-3 py-2">
                    <PublishPreview
                      project={project}
                      brand={brand}
                      urls={urls}
                      variant="compact"
                      onOpenCopy={openCopyPanel}
                    />
                  </div>
                ) : null}
                {project.contentKind === "threads" ? null : (
                  <ArtboardCanvas projectId={project.id} artboard={artboard} brand={brand} urls={urls} />
                )}
              </div>
            </Panel>
            <Separator className="w-1 bg-border hover:bg-border-strong" />
            <Panel defaultSize="24%" minSize="18%" className="bg-surface">
              <Tabs value={rightTab} onValueChange={setRightTab} className="flex h-full min-h-0 flex-col">
                <div className="px-3 pt-3">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="inspect">屬性</TabsTrigger>
                    <TabsTrigger value="copy" data-testid="studio-tab-copy">
                      文字
                    </TabsTrigger>
                    <TabsTrigger value="qa">檢查</TabsTrigger>
                    <TabsTrigger value="ai" data-testid="studio-tab-ai">
                      AI
                    </TabsTrigger>
                  </TabsList>
                </div>
                <ScrollArea className="min-h-0 flex-1">
                  <TabsContent value="inspect">
                    <Inspector projectId={project.id} artboard={artboard} brand={brand} />
                  </TabsContent>
                  <TabsContent value="copy">
                    <CopyPanel project={project} />
                  </TabsContent>
                  <TabsContent value="qa">
                    <QualityPanel project={project} brand={brand} />
                  </TabsContent>
                  <TabsContent value="ai">
                    <PlannerPanel project={project} brand={brand} />
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </Panel>
          </Group>
        </div>

        <div className="flex h-0 min-h-0 min-w-0 flex-1 flex-col lg:hidden">
          <div className="border-b border-border bg-surface">
            <EditorToolbar />
          </div>
          {project.contentKind === "reels" && project.reels ? (
            <div className="shrink-0 border-b border-border bg-surface px-3 py-2">
              <ReelsTimeline
                variant="compact"
                reels={project.reels}
                adapter={project.reels.source}
                projectId={project.id}
                onOpenScript={openReelsScript}
              />
            </div>
          ) : project.contentKind === "threads" ? (
            <div className="min-h-0 flex-1 overflow-y-auto border-b border-border bg-surface px-3 py-3">
              <PublishPreview project={project} brand={brand} urls={urls} />
            </div>
          ) : project.contentKind === "line" ? (
            <div className="shrink-0 border-b border-border bg-surface px-3 py-2">
              <PublishPreview
                project={project}
                brand={brand}
                urls={urls}
                variant="compact"
                onOpenCopy={openCopyPanel}
              />
            </div>
          ) : null}
          {project.contentKind === "threads" ? null : (
            <ArtboardCanvas projectId={project.id} artboard={artboard} brand={brand} urls={urls} />
          )}
          <div className="border-t border-border bg-surface">
            <SlideBar project={project} />
          </div>
          <div className="flex border-t border-border bg-surface md:hidden">
            <FormatScroller
              value={project.activeFormatId}
              onChange={(id) => setActiveFormat(project.id, id)}
            />
          </div>
          <div className="flex h-12 border-t border-border bg-surface">
            <MobileTab icon={<Layers className="size-4" />} label="圖層" onClick={() => setPanel("layers")} active={panel === "layers"} />
            <MobileTab icon={<Images className="size-4" />} label="素材" onClick={() => setPanel("assets")} active={panel === "assets"} />
            <MobileTab icon={<Type className="size-4" />} label="文字" onClick={() => setPanel("copy")} active={panel === "copy"} />
            <MobileTab icon={<Scan className="size-4" />} label="屬性" onClick={() => setPanel("inspect")} active={panel === "inspect"} />
            <MobileTab icon={<History className="size-4" />} label="版本" onClick={() => setPanel("versions")} active={panel === "versions"} />
            <MobileTab icon={<Sparkles className="size-4" />} label="AI" onClick={() => setPanel("ai")} active={panel === "ai"} testId="studio-tab-ai-mobile" />
          </div>
        </div>
      </div>

      <Sheet open={panel !== null} onOpenChange={(o) => !o && setPanel(null)}>
        <SheetContent side="bottom" className="flex max-h-[78dvh] flex-col overflow-hidden">
          <SheetTitle className="mb-3">
            {panel === "layers"
              ? "圖層"
              : panel === "assets"
                ? "素材"
                : panel === "copy"
                  ? "文字"
                  : panel === "inspect"
                    ? "屬性"
                    : panel === "versions"
                      ? "版本"
                      : panel === "qa"
                        ? "品質檢查"
                        : "AI 操作"}
          </SheetTitle>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {panel === "layers" && (
              <div className="h-[52dvh]">
                <LayerTree projectId={project.id} artboard={artboard} brand={brand} />
              </div>
            )}
            {panel === "assets" && (
              <div className="h-[52dvh]">
                <AssetTray projectId={project.id} />
              </div>
            )}
            {panel === "copy" && <CopyPanel project={project} />}
            {panel === "inspect" && (
              <Inspector projectId={project.id} artboard={artboard} brand={brand} />
            )}
            {panel === "versions" && <VersionPanel project={project} />}
            {panel === "qa" && <QualityPanel project={project} brand={brand} />}
            {panel === "ai" && <PlannerPanel project={project} brand={brand} />}
          </div>
        </SheetContent>
      </Sheet>
      <CarouselPreview
        project={project}
        brand={brand}
        open={carouselPreview}
        onOpenChange={setCarouselPreview}
      />
    </div>
  );
}

function MobileTab({
  icon,
  label,
  onClick,
  active,
  testId,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={cn(
        "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs",
        active ? "text-fg" : "text-muted",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function FormatScroller({
  value,
  onChange,
}: {
  value: FormatId;
  onChange: (id: FormatId) => void;
}) {
  return (
    <div className="flex w-full gap-1 overflow-x-auto px-2 py-2">
      {FORMATS.map((f) => (
        <Button
          key={f.id}
          size="sm"
          variant={value === f.id ? "default" : "secondary"}
          onClick={() => onChange(f.id)}
        >
          {f.short}
        </Button>
      ))}
    </div>
  );
}
