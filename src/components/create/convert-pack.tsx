import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PostPackBar } from "@/components/create/post-pack";
import { PublishPreview } from "@/components/create/publish-preview";
import { DownloadPackButton } from "@/components/export/download-pack";
import { SectionHeader } from "@/components/shared/page-header";
import { ArtboardView } from "@/components/studio/artboard-view";
import { Button } from "@/components/ui/button";
import { pagesOf } from "@/lib/studio/layers";
import { contentKindLabel } from "@/lib/studio/status";
import type { BrandKit, Project } from "@/lib/studio/types";
import { CONVERT_TARGETS } from "@/lib/studio/convert-copy";

/** 一次做成全套之後：同一則內容的每種型態都可以直接複製帶走。 */
export function ConvertPack({
  members,
  brand,
  urls,
}: {
  members: Project[];
  brand?: BrandKit;
  urls: Record<string, string>;
}) {
  if (members.length < 2) return null;

  return (
    <section id="convert-pack" className="mt-8 space-y-4">
      <SectionHeader
        title="這次做成的全套"
        hint="同一則內容的貼文、輪播、限動、Threads、LINE、Reels。一次下載圖，文案會複製並存成檔。"
        action={<DownloadPackButton projectId={members[0]!.id} size="sm" />}
      />
      <ul className="grid gap-4 lg:grid-cols-2">
        {members.map((project) => {
          const page = pagesOf(project)[0];
          const hint = CONVERT_TARGETS.find((item) => item.id === project.contentKind)?.hint;
          return (
            <li key={project.id} className="min-w-0 space-y-3 rounded-3xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{contentKindLabel(project.contentKind)}</p>
                  {hint ? <p className="mt-0.5 text-xs text-subtle">{hint}</p> : null}
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/studio/$projectId" params={{ projectId: project.id }}>
                    進畫面
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </div>
              <PublishPreview project={project} brand={brand} urls={urls} />
              {project.contentKind === "threads" || project.contentKind === "line" || project.contentKind === "reels" ? null : (
                <div className="overflow-hidden rounded-2xl bg-surface-2">
                  {page && brand ? (
                    <span className="flex w-full justify-center">
                      <ArtboardView artboard={page} brand={brand} urls={urls} width={280} />
                    </span>
                  ) : (
                    <p className="px-3 py-8 text-center text-xs text-muted">{project.name}</p>
                  )}
                </div>
              )}
              <PostPackBar
                copy={project.copy}
                kind={project.contentKind}
                projectId={project.id}
                variant="compact"
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
