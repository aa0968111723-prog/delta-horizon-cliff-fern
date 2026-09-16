import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { IgFeedPreview } from "@/components/instagram/ig-feed-preview";
import { IgPeek } from "@/components/instagram/ig-peek";
import { IgStoryPreview } from "@/components/instagram/ig-story-preview";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { convertPackOf } from "@/lib/studio/convert-pack";
import { igPeekMode, isHighlightKind } from "@/lib/studio/ig-profile";
import { pagesOf } from "@/lib/studio/layers";
import type { BrandKit, Project } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio-store";

function assetIdsFromProjects(projects: Project[]): string[] {
  const ids: string[] = [];
  for (const project of projects) {
    for (const page of pagesOf(project)) {
      for (const layer of page.layers) {
        if (layer.type === "image") ids.push(layer.assetId);
        if (layer.type === "logo" && layer.assetId) ids.push(layer.assetId);
      }
      if (page.background.assetId) ids.push(page.background.assetId);
    }
  }
  return ids;
}

/**
 * 畫面編輯裡直接用 IG 限動／貼文看，不必先去 IG 中心。
 * Threads／LINE 不是 IG 畫面，不出現這顆按鈕。
 */
export function StudioIgPeekButton({ project, brand }: { project: Project; brand: BrandKit }) {
  const mode = igPeekMode(project.contentKind);
  const projects = useStudio((s) => s.projects);
  const [open, setOpen] = useState(false);
  const pack = useMemo(() => convertPackOf(projects, project.id), [projects, project.id]);
  const previewProjects = useMemo(() => {
    if (mode === "story") {
      const stories = pack.filter(
        (item) => isHighlightKind(item.contentKind) && item.status !== "idea",
      );
      return stories.length ? stories : [project];
    }
    return [project];
  }, [mode, pack, project]);
  const urls = useAssetUrls(assetIdsFromProjects(previewProjects));

  if (!mode) return null;

  const story = mode === "story";
  const label = story ? "用限動看" : "用貼文看";

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        data-testid="studio-ig-peek"
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        <Eye className="size-4" />
        {label}
      </Button>
      <IgPeek
        open={open}
        onOpenChange={setOpen}
        title={story ? "限動預覽" : "貼文預覽"}
        width={story ? "story" : "feed"}
      >
        {story ? (
          <IgStoryPreview
            key={project.id}
            projects={previewProjects}
            brand={brand}
            urls={urls}
            initialProjectId={project.id}
            tone="overlay"
          />
        ) : (
          <IgFeedPreview projects={previewProjects} brand={brand} urls={urls} tone="overlay" />
        )}
      </IgPeek>
    </>
  );
}
