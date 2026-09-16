import { Link, useNavigate } from "@tanstack/react-router";
import { format as formatDate } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Download, FolderKanban } from "lucide-react";
import { EmptyState, LoadingState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { DownloadPackButton, PackExportHint } from "@/components/export/download-pack";
import { ExportPanel } from "@/components/export/export-panel";
import { ContentFlowBar } from "@/components/shared/content-flow";
import { QualityPanel } from "@/components/qa/quality-panel";
import { ArtboardView } from "@/components/studio/artboard-view";
import { BrandSubnav } from "@/components/brand/brand-subnav";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { convertPackOf, kindHasDownloadablePages } from "@/lib/studio/convert-pack";
import { formatById } from "@/lib/studio/formats";
import { pagesOf } from "@/lib/studio/layers";
import { contentKindLabel } from "@/lib/studio/status";
import { activeArtboard, useStudio } from "@/stores/studio-store";
import { useMemo } from "react";

export function ExportCenter() {
  const navigate = useNavigate();
  const hydrated = useStudio((s) => s.hydrated);
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const setLastProjectId = useStudio((s) => s.setLastProjectId);
  const setActiveFormat = useStudio((s) => s.setActiveFormat);
  const ensureArtboard = useStudio((s) => s.ensureArtboard);
  const setSlide = useStudio((s) => s.setSlide);

  const project = projects.find((p) => p.id === lastProjectId) ?? projects[0];
  const brand = project ? brands.find((b) => b.id === project.brandId) ?? brands[0] : undefined;
  const artboard = project ? activeArtboard(project) : undefined;

  const assetIds = useMemo(() => {
    const ids: string[] = [];
    if (artboard) {
      if (artboard.background.assetId) ids.push(artboard.background.assetId);
      for (const l of artboard.layers) {
        if (l.type === "image") ids.push(l.assetId);
        if (l.type === "logo" && l.assetId) ids.push(l.assetId);
      }
    }
    if (brand?.logoAssetId) ids.push(brand.logoAssetId);
    return ids;
  }, [artboard, brand]);
  const urls = useAssetUrls(assetIds);

  if (!hydrated) return <LoadingState label="讀取作品…" />;

  if (!project || !brand) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <EmptyState
          icon={FolderKanban}
          title="還沒有可輸出的作品"
          description="先完成一則網宣，再回來檢查與下載。"
          action={
            <Button asChild>
              <Link to="/">回首頁</Link>
            </Button>
          }
        />
      </main>
    );
  }

  if (!artboard) {
    return <LoadingState label="正在準備預覽…" />;
  }

  const format = formatById(artboard.formatId);
  const pages = pagesOf(project);
  const pack = convertPackOf(projects, project.id);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="輸出中心"
        title="預覽與下載"
        description="檢查安全區與文案，再輸出 Instagram 用的高畫質檔案。做成全套之後可以一次下載所有畫面。"
        actions={
          <div className="flex flex-wrap gap-2">
            <BrandSubnav current="export" />
            <Button asChild variant="secondary">
              <Link to="/studio/$projectId" params={{ projectId: project.id }}>
                回編輯器
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={project.id}
          onValueChange={(id) => {
            setLastProjectId(id);
            void navigate({ to: "/export" });
          }}
        >
          <SelectTrigger className="sm:max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <StatusBadge status={project.status} />
      </div>

      {pack.length > 1 ? (
        <section className="mt-6 rounded-2xl surface-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-sm font-medium">這次做成的全套</h2>
              <p className="mt-1 text-xs text-muted">一次下載貼文、輪播、限動、LINE、Reels 封面。Threads 只寫進文案檔。</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {pack.map((item) => (
                  <li key={item.id} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-fg">
                    {contentKindLabel(item.contentKind)}
                    {kindHasDownloadablePages(item.contentKind) ? "" : " · 文案"}
                  </li>
                ))}
              </ul>
              <PackExportHint projectId={project.id} className="mt-2" />
            </div>
            <DownloadPackButton projectId={project.id} />
          </div>
        </section>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-2xl surface-card p-4">
          <div className="mb-3 flex flex-wrap gap-1">
            {(["feed-square", "feed-portrait", "feed-landscape", "story", "reels-cover", "threads", "line-promo"] as const).map(
              (id) => (
                <Button
                  key={id}
                  size="sm"
                  variant={project.activeFormatId === id ? "default" : "secondary"}
                  onClick={() => {
                    ensureArtboard(project.id, id);
                    setActiveFormat(project.id, id);
                  }}
                >
                  {formatById(id).short}
                </Button>
              ),
            )}
          </div>
          <div className="flex min-h-80 items-center justify-center rounded-lg bg-bg p-4">
            <ArtboardView
              artboard={artboard}
              brand={brand}
              urls={urls}
              width={Math.min(280, (280 * format.width) / format.height)}
              showSafe
            />
          </div>
          <p className="mt-3 text-center text-xs text-muted tabular-nums">
            {format.name} · {format.width}×{format.height}
            {pages.length > 1 ? ` · 第 ${(project.slideIndex ?? 0) + 1}/${pages.length} 頁` : ""}
          </p>
          {pages.length > 1 ? (
            <div className="mt-2 flex justify-center gap-1">
              {pages.map((_, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={i === (project.slideIndex ?? 0) ? "default" : "secondary"}
                  onClick={() => setSlide(project.id, i)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          ) : null}
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl surface-card p-4">
            <ContentFlowBar project={project} />
          </section>
          <section className="rounded-2xl surface-card p-4">
            <ExportPanel project={project} brand={brand} artboard={artboard} />
          </section>
          <section className="rounded-2xl surface-card p-4">
            <QualityPanel project={project} brand={brand} />
          </section>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-medium">版本紀錄</h2>
        {project.exports.length === 0 ? (
          <p className="mt-3 rounded-2xl surface-card px-4 py-8">
            還沒有下載紀錄。第一次匯出會出現在這裡。
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {project.exports.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.filename}</p>
                  <p className="text-xs text-muted tabular-nums">
                    {formatById(item.formatId).short} · {item.width}×{item.height} · {item.scale}x ·{" "}
                    {formatDate(item.createdAt, "M/d HH:mm", { locale: zhTW })}
                  </p>
                </div>
                <Download className="size-4 shrink-0 text-subtle" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
