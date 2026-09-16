import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PostPackBar } from "@/components/create/post-pack";
import { PublishPreview } from "@/components/create/publish-preview";
import { DownloadPackButton } from "@/components/export/download-pack";
import { PackFlowBar } from "@/components/shared/pack-flow";
import { SectionHeader } from "@/components/shared/page-header";
import { ArtboardView } from "@/components/studio/artboard-view";
import { Button } from "@/components/ui/button";
import { pagesOf } from "@/lib/studio/layers";
import { contentKindLabel } from "@/lib/studio/status";
import type { BrandKit, Project } from "@/lib/studio/types";
import { CONVERT_TARGETS } from "@/lib/studio/convert-copy";
import { useStudio } from "@/stores/studio-store";

/** 一次做成全套之後：同一則內容的每種型態都可以直接複製帶走。 */
export function ConvertPack({
  members,
  brand,
  urls,
  sourceId,
}: {
  members: Project[];
  brand?: BrandKit;
  urls: Record<string, string>;
  sourceId?: string;
}) {
  if (members.length < 2) return null;
  const packId = sourceId ?? members[0]!.id;

  return (
    <section id="convert-pack" className="mt-8 space-y-4">
      <SectionHeader
        title="這次做成的全套"
        hint="同一則內容的貼文、輪播、限動、Threads、LINE、Reels。文案和主視覺都可以一次套到全套。"
        action={<DownloadPackButton projectId={packId} size="sm" />}
      />
      <div className="flex flex-wrap items-center gap-2">
        <PackFlowBar projectId={packId} />
        <SpreadCopyButton projectId={packId} />
        <SpreadVisualButton projectId={packId} />
      </div>
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

function SpreadCopyButton({ projectId }: { projectId: string }) {
  const applyCopyToPack = useStudio((s) => s.applyCopyToPack);
  return (
    <Button
      size="sm"
      variant="secondary"
      aria-label="文案套到全套"
      onClick={() => {
        const count = applyCopyToPack(projectId);
        if (count > 1) toast.success(`這則文案已套到 ${count} 種型態。Threads、LINE、Reels 也換了。`);
        else toast.info("這則還沒做成其他型態。");
      }}
    >
      文案套到全套
    </Button>
  );
}

function SpreadVisualButton({ projectId }: { projectId: string }) {
  const applyVisualToPack = useStudio((s) => s.applyVisualToPack);
  return (
    <Button
      size="sm"
      variant="secondary"
      aria-label="畫面套到全套"
      onClick={() => {
        const count = applyVisualToPack(projectId);
        if (count > 1) toast.success(`主視覺已套到 ${count} 種畫面。限動、LINE、Reels 封面也換了。`);
        else if (count === 1) toast.info("這則還沒做成其他有畫面的型態。");
        else toast.info("這則還沒有主視覺。");
      }}
    >
      畫面套到全套
    </Button>
  );
}
