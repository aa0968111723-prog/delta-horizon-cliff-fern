import { Link } from "@tanstack/react-router";
import { FolderKanban, Images, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { NewProjectDialog } from "@/components/dashboard/new-project-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { ProjectCard } from "@/components/shared/project-card";
import { ArtboardView } from "@/components/studio/artboard-view";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { categoryLabel } from "@/lib/studio/assets";
import { formatById } from "@/lib/studio/formats";
import { previewTemplate, TEMPLATE_STARTERS } from "@/lib/studio/templates";
import { useStudio } from "@/stores/studio-store";
import { useNavigate } from "@tanstack/react-router";

export function HomePage() {
  const navigate = useNavigate();
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const duplicateProject = useStudio((s) => s.duplicateProject);
  const deleteProject = useStudio((s) => s.deleteProject);
  const createFromTemplate = useStudio((s) => s.createFromTemplate);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    const list = n
      ? projects.filter((p) => p.name.toLowerCase().includes(n) || (brands.find((b) => b.id === p.brandId)?.name ?? "").toLowerCase().includes(n))
      : projects;
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [projects, brands, q]);

  const drafts = filtered.filter((p) => p.status === "draft");
  const recent = filtered.slice(0, 8);
  const brand = brands[0];

  const assetIds = useMemo(() => {
    const ids: string[] = [];
    for (const p of filtered) {
      const board = p.artboards[p.activeFormatId];
      if (!board) continue;
      for (const l of board.layers) {
        if (l.type === "image") ids.push(l.assetId);
        if (l.type === "logo" && l.assetId) ids.push(l.assetId);
      }
    }
    for (const b of brands) if (b.logoAssetId) ids.push(b.logoAssetId);
    for (const a of assets) ids.push(a.id);
    return ids;
  }, [filtered, brands, assets]);
  const urls = useAssetUrls(assetIds);

  function startTemplate(id: (typeof TEMPLATE_STARTERS)[number]["id"]) {
    if (!brand) return;
    const project = createFromTemplate({ templateId: id, brandId: brand.id });
    void navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Instagram 網宣工作台"
        title="構幀"
        description="最近作品、草稿、模板與品牌資產都在這裡。手機用底部導覽，電腦可開左右面板編輯。"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            新建專案
          </Button>
        }
      />

      <div className="mt-6 flex items-center gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋作品或品牌"
          className="max-w-sm"
        />
        <p className="text-xs text-subtle tabular-nums">{filtered.length} 件</p>
      </div>

      <section className="mt-8">
        <SectionHeader title="最近作品" hint="依最後編輯排列" />
        {recent.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="還沒有作品"
            description="從模板開始，或新建一則網宣。"
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                新建專案
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((project) => (
              <li key={project.id}>
                <ProjectCard
                  project={project}
                  brand={brands.find((b) => b.id === project.brandId)}
                  urls={urls}
                  onDuplicate={() => duplicateProject(project.id)}
                  onDelete={() => setPendingDelete(project.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <SectionHeader title="草稿" hint="尚未完成企劃或輸出" />
        {drafts.length === 0 ? (
          <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]">
            沒有草稿。完成企劃後會標成可輸出。
          </p>
        ) : (
          <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3">
            {drafts.map((project) => (
              <li key={project.id} className="min-w-[16rem] sm:min-w-0">
                <ProjectCard
                  project={project}
                  brand={brands.find((b) => b.id === project.brandId)}
                  urls={urls}
                  compact
                  onDuplicate={() => duplicateProject(project.id)}
                  onDelete={() => setPendingDelete(project.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <SectionHeader title="模板" hint="套用品牌色與字體，立刻進編輯器" />
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {TEMPLATE_STARTERS.map((tpl) => {
            const preview = brand ? previewTemplate(tpl, brand, assets.find((a) => a.kind === "image")?.id) : null;
            const format = formatById(tpl.formatId);
            return (
              <li key={tpl.id}>
                <button
                  type="button"
                  onClick={() => startTemplate(tpl.id)}
                  className="w-full rounded-2xl bg-surface p-3 text-left shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-border-hover)]"
                >
                  <div className="flex h-36 items-center justify-center overflow-hidden rounded-lg bg-bg">
                    {preview && brand ? (
                      <ArtboardView
                        artboard={preview}
                        brand={brand}
                        urls={urls}
                        width={Math.min(120, (120 * format.width) / format.height)}
                      />
                    ) : (
                      <span className="text-xs text-muted">預覽</span>
                    )}
                  </div>
                  <p className="mt-3 truncate text-sm font-medium">{tpl.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">{tpl.description}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <SectionHeader
          title="品牌資產"
          hint="Logo、商品圖與場景"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/assets">全部素材</Link>
            </Button>
          }
        />
        {assets.length === 0 ? (
          <EmptyState
            icon={Images}
            title="還沒有素材"
            description="上傳 Logo 與商品圖，之後排版會直接取用。"
            action={
              <Button asChild variant="secondary">
                <Link to="/assets">前往素材庫</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {assets.slice(0, 12).map((asset) => (
              <li key={asset.id} className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
                <Link to="/assets" className="block">
                  <div className="aspect-square bg-bg">
                    {urls[asset.id] ? (
                      <img src={urls[asset.id]} alt={asset.name} className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-muted">載入中</div>
                    )}
                  </div>
                  <p className="truncate px-2 py-1.5 text-xs">{asset.name}</p>
                  <p className="truncate px-2 pb-1.5 text-xs text-subtle">{categoryLabel(asset.category)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <NewProjectDialog open={open} onOpenChange={setOpen} />
      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={() => setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除這個專案？</AlertDialogTitle>
            <AlertDialogDescription>此動作無法復原。素材庫與品牌規範會保留。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteProject(pendingDelete);
                setPendingDelete(null);
              }}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
