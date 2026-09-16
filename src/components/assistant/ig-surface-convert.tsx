import { toast } from "sonner";
import { CaptionMeter } from "@/components/assistant/caption-meter";
import { Badge } from "@/components/ui/badge";
import {
  IG_SURFACES,
  livePreviewCopy,
  reviewIgSurface,
  surfaceConversionPatch,
  type IgSurface,
} from "@/lib/studio/ig-surfaces";
import { pagesOf } from "@/lib/studio/layers";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

export function IgSurfaceConvert({
  projectId,
  onConverted,
}: {
  projectId: string;
  onConverted?: (surface: IgSurface) => void;
}) {
  const project = useStudio((state) => state.projects.find((item) => item.id === projectId));
  const patchPlan = useStudio((state) => state.patchPlan);
  const setCopy = useStudio((state) => state.setCopy);
  const adaptToFormat = useStudio((state) => state.adaptToFormat);
  const pack = project?.plan?.copyPack;

  if (!project) return null;

  function apply(surface: IgSurface) {
    if (!project) return;
    const patch = surfaceConversionPatch(project, surface);
    const converted = patch.converted;
    const pageCount = surface === "carousel" ? pagesOf(project).length : converted.overlay.length;
    const review = reviewIgSurface(surface, converted, {
      schedule: project.brief.schedule,
      location: project.brief.location,
      registrationUrl: project.brief.notes.match(/https?:\/\/\S+/)?.[0],
      pageCount,
    });
    adaptToFormat(project.id, patch.formatId);
    setCopy(project.id, patch.copy);
    if (patch.planPatch) patchPlan(project.id, patch.planPatch);
    const failed = review.filter((item) => !item.pass);
    toast.success(
      failed.length
        ? `已轉成${IG_SURFACES.find((item) => item.id === surface)?.label}，畫布已重排，還有 ${failed.length} 項學生視角要修`
        : `已轉成${IG_SURFACES.find((item) => item.id === surface)?.label}，文案與畫布尺寸已對上`,
    );
    onConverted?.(surface);
  }

  return (
    <section className="min-w-0 space-y-3" data-testid="ig-surface-convert">
      <div>
        <p className="text-sm font-medium">轉成 Feed／Story／Reels／Carousel</p>
        <p className="mt-1 text-xs leading-5 text-muted">
          會換成對應尺寸並重排畫布，文案也換成該格式。沒有輪播頁時不會假裝已經有 6 頁。
        </p>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {IG_SURFACES.map((surface) => (
          <button
            key={surface.id}
            type="button"
            data-testid={`ig-convert-${surface.id}`}
            onClick={() => apply(surface.id)}
            className="min-h-16 min-w-36 shrink-0 rounded-xl bg-surface px-3 py-2 text-left shadow-[var(--shadow-border)] hover:bg-surface-2"
          >
            <span className="block text-sm font-medium">{surface.label}</span>
            <span className="mt-1 block text-xs leading-5 text-muted">{surface.hint}</span>
          </button>
        ))}
      </div>
      {pack ? (
        <SurfaceReview projectId={project.id} />
      ) : (
        <p className="text-xs text-muted">先生成文案包，轉換才有 Story／Reels／輪播逐則。現在只會改畫布尺寸。</p>
      )}
    </section>
  );
}

function SurfaceReview({ projectId }: { projectId: string }) {
  const project = useStudio((state) => state.projects.find((item) => item.id === projectId));
  if (!project) return null;
  const pageCount = pagesOf(project).length;
  const surface = project.activeFormatId === "story"
    ? "story"
    : project.activeFormatId === "reels-cover"
      ? "reels"
      : pageCount > 1
        ? "carousel"
        : "feed";
  const converted = livePreviewCopy(project, surface, pageCount);
  const review = reviewIgSurface(surface, converted, {
    schedule: project.brief.schedule,
    location: project.brief.location,
    registrationUrl: project.brief.notes.match(/https?:\/\/\S+/)?.[0],
    pageCount,
  });

  return (
    <div className="min-w-0 rounded-xl bg-bg p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="default">目前：{IG_SURFACES.find((item) => item.id === surface)?.label}</Badge>
        <CaptionMeter caption={converted.caption} hashtags={converted.hashtags} />
      </div>
      <ul className="mt-3 space-y-2">
        {review.map((item) => (
          <li key={item.question} className="min-w-0">
            <p className={cn("text-sm", item.pass ? "text-fg" : "text-warn")}>{item.question}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted">{item.feedback}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
