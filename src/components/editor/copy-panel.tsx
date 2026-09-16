import { ConvertBar } from "@/components/create/convert-bar";
import { ReelsTimeline } from "@/components/create/reels-timeline";
import { SourceList } from "@/components/shared/source-list";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copyFromArtboard, PAGE_ROLE_LABEL } from "@/lib/studio/carousel";
import { activeArtboard } from "@/stores/studio-store";
import type { Project } from "@/lib/studio/types";
import { useStudio } from "@/stores/studio-store";

export function CopyPanel({ project }: { project: Project }) {
  const setCopy = useStudio((s) => s.setCopy);
  const reflow = useStudio((s) => s.reflow);
  const artboard = activeArtboard(project);
  const slideCopy = artboard ? copyFromArtboard(artboard, project.copy) : project.copy;
  const roleLabel = artboard?.role ? PAGE_ROLE_LABEL[artboard.role] : null;

  return (
    <div className="space-y-4 p-4 pb-8">
      <div>
        <h2 className="text-sm font-medium">文字{roleLabel ? ` · ${roleLabel}` : ""}</h2>
        <p className="mt-1 text-xs text-muted">改這裡只影響目前這一頁，風格與品牌色不變。</p>
      </div>
      <Field label="眉題">
        <Input
          value={slideCopy.eyebrow}
          onChange={(e) => setCopy(project.id, { eyebrow: e.target.value })}
        />
      </Field>
      <Field label="畫面標題">
        <Textarea
          value={slideCopy.headline}
          onChange={(e) => setCopy(project.id, { headline: e.target.value })}
        />
      </Field>
      <Field label="副標">
        <Textarea
          value={slideCopy.subhead}
          onChange={(e) => setCopy(project.id, { subhead: e.target.value })}
        />
      </Field>
      <Field label="內文">
        <Textarea
          value={slideCopy.body}
          onChange={(e) => setCopy(project.id, { body: e.target.value })}
        />
      </Field>
      <Field label="CTA">
        <Input value={slideCopy.cta} onChange={(e) => setCopy(project.id, { cta: e.target.value })} />
      </Field>
      <Button variant="secondary" className="w-full" onClick={() => reflow(project.id)}>
        依此頁文案重排
      </Button>
      <Field label="Caption">
        <Textarea
          rows={6}
          value={project.copy.caption}
          onChange={(e) => setCopy(project.id, { caption: e.target.value })}
        />
      </Field>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(project.copy.caption);
            toast.success("已複製 Caption");
          }}
        >
          複製文案
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(project.copy.hashtags.join(" "));
            toast.success("已複製標籤");
          }}
        >
          複製標籤
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted">{project.copy.hashtags.join(" ")}</p>
      <SourceList sources={project.sources} className="pt-2" />
      <ConvertBar project={project} className="pt-2" />
      {project.reels ? (
        <div className="pt-2">
          <p className="mb-2 text-sm font-medium">Reels 腳本</p>
          <ReelsTimeline reels={project.reels} adapter={project.reels.source} projectId={project.id} />
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
