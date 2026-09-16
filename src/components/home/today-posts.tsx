import { Link } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { PostPackBar } from "@/components/create/post-pack";
import { ProjectCard } from "@/components/shared/project-card";
import { SectionHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { readyPostLabel, readyToPost } from "@/lib/studio/today-post";
import { useStudio } from "@/stores/studio-store";

/** 首頁「今天可以發」：完成或排在今天的內容，複製文案下載圖就能貼。 */
export function TodayPosts() {
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const urls = useAssetUrls(assets.map((asset) => asset.id));
  const ready = readyToPost(projects);

  return (
    <section className="mt-10">
      <SectionHeader
        title="今天可以發"
        hint="完成或排在今天的，複製文案、下載圖就能貼"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to="/calendar">看日曆</Link>
          </Button>
        }
      />
      {ready.length === 0 ? (
        <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]">
          完成一篇就會出現在這裡。沒有審核，一個人就能發。
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {ready.map(({ project, reason }) => (
            <li key={project.id} className="min-w-0">
              <p className="mb-2 flex items-center gap-1.5 text-xs text-muted">
                <Send className="size-3.5" />
                {readyPostLabel(reason)}
              </p>
              <ProjectCard
                project={project}
                brand={brands.find((brand) => brand.id === project.brandId)}
                urls={urls}
                compact
                footer={
                  <PostPackBar
                    copy={project.copy}
                    kind={project.contentKind}
                    projectId={project.id}
                    variant="compact"
                    className="pt-2"
                  />
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
