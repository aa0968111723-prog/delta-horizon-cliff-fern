import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createCanvaDraft } from "@/lib/ai/oauth";
import { canvaDraftNotes, canvaPresetForKind } from "@/lib/zen/canva-draft";
import type { CreativePack } from "@/lib/zen/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function PackResult({
  pack,
  compact,
  onApply,
}: {
  pack: CreativePack;
  compact?: boolean;
  onApply?: (directionId?: string) => void;
}) {
  return (
    <div className={cn("rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-border)] md:p-6", compact && "p-4")}>
      <p className="text-xs text-muted">
        找到 {pack.foundCount} 個相關素材 · 根據過去內容生成 {pack.directions?.length ?? 0} 個方向
      </p>
      <h3 className="mt-2 font-display text-2xl">{pack.copy.hook}</h3>
      <p className="mt-2 text-sm text-muted">{pack.insight}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {pack.citedSources.map((src) => (
          <Badge key={`${src.source}-${src.label}`} variant="default">
            {sourceLine(src.source, src.label)}
          </Badge>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {(pack.directions ?? []).map((dir) => (
          <article key={dir.id} className="rounded-2xl bg-bg p-4">
            <p className="text-xs text-muted">{dir.title}</p>
            <p className="mt-1 text-sm font-medium">{dir.concept}</p>
            <p className="mt-2 text-xs text-muted">{dir.palette}</p>
            {onApply ? (
              <Button className="mt-3 w-full" size="sm" onClick={() => onApply(dir.id)}>
                用這個方向
              </Button>
            ) : null}
          </article>
        ))}
      </div>
      {!compact ? (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Block title="IG Caption" body={pack.copy.body} />
            <Block title="學生視角" body={reviewText(pack)} />
            <Block title="Threads" body={pack.plan.threadsPost || ""} />
            <Block title="LINE" body={pack.plan.lineCopy || ""} />
          </div>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={async () => {
              const notes = canvaDraftNotes({
                hook: pack.copy.hook,
                body: pack.copy.body,
                cta: pack.copy.cta,
                hashtags: pack.copy.hashtags,
              });
              const result = await createCanvaDraft({
                data: {
                  title: pack.campaignName || pack.copy.hook,
                  hook: pack.copy.hook,
                  notes,
                  preset: canvaPresetForKind("event"),
                },
              });
              if (!result.ok) {
                toast.message(result.error);
                return;
              }
              if (notes) {
                try {
                  await navigator.clipboard.writeText(notes);
                  toast.success(
                    result.uploaded
                      ? "已把主視覺送進 Canva，文案已複製"
                      : "已在 Canva 開 IG 稿，文案已複製，可貼進去微調",
                  );
                } catch {
                  toast.success(result.uploaded ? "已把主視覺送進 Canva" : "已在 Canva 開 IG 稿，可繼續微調");
                }
              } else {
                toast.success(result.uploaded ? "已把主視覺送進 Canva" : "已在 Canva 開一張 IG 稿，可繼續微調");
              }
              window.open(result.editUrl, "_blank", "noopener,noreferrer");
            }}
          >
            送到 Canva 繼續編
          </Button>
        </>
      ) : null}
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-bg p-4">
      <p className="text-xs text-muted">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function reviewText(pack: CreativePack) {
  const r = pack.copy.studentReview;
  return [
    `停下？ ${r.wouldStop}`,
    `宗教？ ${r.tooReligious}`,
    `AI 味？ ${r.tooAi}`,
    `時間地點？ ${r.knowsWhenWhere}`,
    `找朋友？ ${r.wouldBringFriend}`,
  ].join("\n");
}

function sourceLine(source: string, label: string) {
  const pretty = labelSource(source);
  if (!label) return pretty;
  if (label.includes("/")) return label;
  if (label.startsWith(pretty)) return label;
  return `${pretty} / ${label}`;
}

function labelSource(source: string) {
  if (source === "drive") return "Google Drive";
  if (source === "canva") return "Canva";
  if (source === "instagram") return "Instagram";
  if (source === "generated") return "AI Generated";
  return "Brand";
}
