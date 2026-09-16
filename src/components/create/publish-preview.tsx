import { LinePreview } from "@/components/create/line-preview";
import { ReelsTimeline } from "@/components/create/reels-timeline";
import { ThreadsPreview } from "@/components/create/threads-preview";
import type { BrandKit, Project } from "@/lib/studio/types";
import { CLUB_HANDLE } from "@/lib/zen/club";

export function isPublishPreviewKind(kind: Project["contentKind"]) {
  return kind === "threads" || kind === "line" || kind === "reels";
}

/** 轉換後先看「貼上去長怎樣」。IG／限動在 IG 中心看；這裡補 Threads、LINE、Reels。 */
export function PublishPreview({
  project,
  brand,
  urls,
}: {
  project: Project;
  brand?: BrandKit;
  urls: Record<string, string>;
}) {
  if (project.contentKind === "threads") {
    return <ThreadsPreview copy={project.copy} />;
  }
  if (project.contentKind === "line") {
    return <LinePreview project={project} brand={brand} urls={urls} />;
  }
  if (project.contentKind === "reels" && project.reels) {
    return (
      <div className="mx-auto w-full max-w-lg">
        <p className="mb-2 text-xs text-subtle">Reels 預覽 · {CLUB_HANDLE}</p>
        <ReelsTimeline reels={project.reels} adapter={project.reels.source} projectId={project.id} />
      </div>
    );
  }
  return null;
}
