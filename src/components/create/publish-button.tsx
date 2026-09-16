import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { captionFromProject } from "@/lib/creative/publish";
import { extractImageAssetId } from "@/lib/studio/layout";
import { pagesOf } from "@/lib/studio/layers";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export function PublishButton({
  campaignId,
  waveId,
  projectId,
  title,
  caption,
  className,
  size = "sm",
  variant = "ghost",
}: {
  campaignId?: string;
  waveId?: string;
  projectId?: string;
  title?: string;
  caption?: string;
  className?: string;
  size?: "sm" | "default";
  variant?: "ghost" | "secondary" | "default";
}) {
  const markPublished = useCreative((s) => s.markPublished);
  const project = useStudio((s) => (projectId ? s.projects.find((item) => item.id === projectId) : undefined));
  const published = useCreative((s) => {
    if (campaignId && waveId) {
      const wave = s.campaigns.find((item) => item.id === campaignId)?.waves.find((item) => item.id === waveId);
      if (wave?.status === "published") return true;
    }
    return false;
  });
  if (project?.status === "published" || published) {
    return <span className="text-xs text-subtle">已進 Content Memory</span>;
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={cn("min-h-11", className)}
      onClick={() => {
        const board = project ? pagesOf(project)[0] : undefined;
        const imageId = extractImageAssetId(board);
        const post = markPublished({
          campaignId: campaignId ?? project?.campaignId ?? undefined,
          waveId,
          projectId: projectId ?? project?.id,
          title: title ?? project?.name,
          caption: caption ?? (project ? captionFromProject(project) : undefined),
          kind: project?.contentKind,
          assetIds: imageId ? [imageId] : undefined,
        });
        if (project) {
          useStudio.getState().updateProject(project.id, {
            status: "published",
            publishedAt: post?.takenAt ?? Date.now(),
          });
        }
        if (post) toast.success("已標記發布，下次生成會參考這篇");
        else toast.error("找不到要發布的內容");
      }}
    >
      標記已發布
    </Button>
  );
}
