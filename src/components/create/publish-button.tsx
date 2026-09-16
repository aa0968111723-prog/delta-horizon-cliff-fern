import { useState } from "react";
import { Button } from "@/components/ui/button";
import { runPublish } from "@/components/create/run-publish";
import { publicImageUrl } from "@/lib/connect/ig-publish";
import { captionFromProject } from "@/lib/creative/publish";
import { extractImageAssetId } from "@/lib/studio/layout";
import { pagesOf } from "@/lib/studio/layers";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export function PublishButton({
  campaignId,
  waveId,
  projectId,
  title,
  caption,
  imageUrl,
  className,
  size = "sm",
  variant = "ghost",
}: {
  campaignId?: string;
  waveId?: string;
  projectId?: string;
  title?: string;
  caption?: string;
  imageUrl?: string | null;
  className?: string;
  size?: "sm" | "default";
  variant?: "ghost" | "secondary" | "default";
}) {
  const project = useStudio((s) => (projectId ? s.projects.find((item) => item.id === projectId) : undefined));
  const [busy, setBusy] = useState(false);
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
      disabled={busy}
      onClick={() => {
        void (async () => {
          const studio = useStudio.getState();
          const liveProject =
            (projectId ? studio.projects.find((item) => item.id === projectId) : undefined) ?? project;
          const board = liveProject ? pagesOf(liveProject)[0] : undefined;
          const imageId = extractImageAssetId(board);
          const text = caption ?? (liveProject ? captionFromProject(liveProject) : title) ?? "";
          const httpsUrl =
            publicImageUrl(imageUrl) ||
            publicImageUrl(liveProject?.sourceRefs.find((ref) => publicImageUrl(ref.id))?.id);
          setBusy(true);
          try {
            const result = await runPublish({
              campaignId: campaignId ?? liveProject?.campaignId ?? undefined,
              waveId,
              projectId: projectId ?? liveProject?.id,
              title: title ?? liveProject?.name ?? "淡江禪學社",
              caption: text || title || "淡江禪學社",
              kind: liveProject?.contentKind ?? "ig-post",
              scheduledAt: liveProject?.scheduledAt ?? Date.now(),
              imageUrl: httpsUrl ?? undefined,
            });
            if (imageId && result.post) {
              useCreative.getState().ingestIgPosts([{ ...result.post, assetIds: [imageId] }]);
            }
            if (result.graph.ok) toast.success(`已發到 ${result.graph.account}`);
            else toast.message(result.graph.message);
          } finally {
            setBusy(false);
          }
        })();
      }}
    >
      {busy ? "發布中…" : "發到 IG"}
    </Button>
  );
}
