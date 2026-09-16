import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { publishToInstagram } from "@/lib/connect/oauth";
import { publicImageUrl } from "@/lib/connect/ig-publish";
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
  const markPublished = useCreative((s) => s.markPublished);
  const ingestIgPosts = useCreative((s) => s.ingestIgPosts);
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
            const live = await publishToInstagram({ data: { caption: text || title || "淡江禪學社", imageUrl: httpsUrl ?? undefined } });
            if (live.ok) {
              ingestIgPosts([
                {
                  id: `ig_${live.mediaId}`,
                  source: "instagram",
                  mediaType: liveProject?.contentKind === "carousel" ? "carousel" : liveProject?.contentKind === "reels" ? "reels" : "image",
                  caption: text,
                  takenAt: Date.now(),
                  assetIds: imageId ? [imageId] : [],
                  analysis: {
                    hook: text.split("\n").find(Boolean) ?? title ?? "",
                    visual: "已發到官方 IG，等 Insights",
                    theme: title ?? liveProject?.name ?? "",
                    captionLength: text.length,
                    cta: /來坐|留言|連結|報名/.test(text) ? "有 CTA" : "弱",
                    direction: "這篇已發到帳號，下次生成會參考。",
                    improve: ["發布後看收藏與停留"],
                  },
                },
              ]);
              toast.success(`已發到 ${live.account}`);
            } else if (live.reason === "connect" || live.reason === "need_public_url") {
              toast.message(live.message);
            } else {
              toast.message(live.message);
            }
          } catch {
            toast.message("IG 暫時發不出去，先標記進記憶。");
          } finally {
            const post = markPublished({
              campaignId: campaignId ?? liveProject?.campaignId ?? undefined,
              waveId,
              projectId: projectId ?? liveProject?.id,
              title: title ?? liveProject?.name,
              caption: text,
              kind: liveProject?.contentKind,
              assetIds: imageId ? [imageId] : undefined,
            });
            const publishId = projectId ?? liveProject?.id;
            if (publishId && studio.projects.some((item) => item.id === publishId)) {
              studio.updateProject(publishId, {
                status: "published",
                publishedAt: post?.takenAt ?? Date.now(),
              });
            }
            setBusy(false);
          }
        })();
      }}
    >
      {busy ? "發布中…" : "發到 IG"}
    </Button>
  );
}
