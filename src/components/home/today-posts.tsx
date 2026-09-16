import { Link } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { PostPackBar } from "@/components/create/post-pack";
import { DownloadPackButton } from "@/components/export/download-pack";
import { PackFlowBar } from "@/components/shared/pack-flow";
import { ProjectCard } from "@/components/shared/project-card";
import { SectionHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { contentKindLabel } from "@/lib/studio/status";
import { readyPacks, readyPostLabel } from "@/lib/studio/today-post";
import { useStudio } from "@/stores/studio-store";

/** 首頁「今天可以發」：完成或排在今天的內容。同一則做成的全套算一組。 */
export function TodayPosts() {
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const urls = useAssetUrls(assets.map((asset) => asset.id));
  const ready = readyPacks(projects);

  return (
    <section className="mt-10">
      <SectionHeader
        title="今天可以發"
        hint="完成或排在今天的，複製文案、下載圖就能貼。全套會併成一組。"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to="/calendar">看日曆</Link>
          </Button>
        }
      />
      {ready.length === 0 ? (
        <p className="rounded-2xl surface-card px-4 py-8 text-center text-sm text-muted">
          完成一篇就會出現在這裡。沒有審核，一個人就能發。
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {ready.map((pack) => (
            <li key={pack.rootId} className="min-w-0">
              <p className="mb-2 flex items-center gap-1.5 text-xs text-muted">
                <Send className="size-3.5" />
                {readyPostLabel(pack.reason)}
                {pack.pack.length > 1 ? ` · ${pack.pack.length} 種型態` : ""}
              </p>
              {pack.pack.length > 1 ? (
                <ul className="mb-2 flex flex-wrap gap-1.5">
                  {pack.pack.map((item) => (
                    <li key={item.id} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-fg">
                      {contentKindLabel(item.contentKind)}
                    </li>
                  ))}
                </ul>
              ) : null}
              <ProjectCard
                project={pack.primary}
                brand={brands.find((brand) => brand.id === pack.primary.brandId)}
                urls={urls}
                compact
                footer={
                  <div className="space-y-2 pt-2">
                    {pack.pack.length > 1 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <PackFlowBar projectId={pack.primary.id} />
                        <DownloadPackButton projectId={pack.primary.id} size="sm" variant="secondary" />
                      </div>
                    ) : null}
                    <PostPackBar
                      copy={pack.primary.copy}
                      kind={pack.primary.contentKind}
                      projectId={pack.primary.id}
                      variant="compact"
                    />
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
