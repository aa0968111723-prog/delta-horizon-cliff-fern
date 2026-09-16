import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { migrateBrief } from "@/lib/studio/brief";
import type { FormatId } from "@/lib/studio/types";
import {
  CONVERT_TARGETS,
  briefFlagsForTarget,
  captionForTarget,
  clipboardText,
  convertFromPlan,
  planForConvertTarget,
  previewLines,
  tonightAt,
  type ConvertTargetId,
} from "@/lib/zen/convert";
import type { CreativePack } from "@/lib/zen/types";
import { uid } from "@/lib/studio/ids";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export function ConvertPanel({ pack }: { pack: CreativePack }) {
  const navigate = useNavigate();
  const brands = useStudio((s) => s.brands);
  const createProject = useStudio((s) => s.createProject);
  const applyCampaignPlan = useStudio((s) => s.applyCampaignPlan);
  const updateProject = useStudio((s) => s.updateProject);
  const upsertSchedule = useCreative((s) => s.upsertSchedule);
  const brand = brands[0];
  const converted = convertFromPlan(pack.plan);

  async function toCanvas(id: ConvertTargetId) {
    if (!brand) return;
    const target = CONVERT_TARGETS.find((row) => row.id === id)!;
    const brief = migrateBrief({
      eventName: pack.campaignName,
      audience: "淡江大學學生",
      location: "淡江大學淡水校園",
      deliverables: briefFlagsForTarget(id),
    });
    const project = createProject({
      name: `${pack.campaignName} · ${target.label}`,
      brandId: brand.id,
      formatId: target.formatId as FormatId,
      brief,
      templateId: pack.plan.templateId,
    });
    applyCampaignPlan(project.id, planForConvertTarget(pack.plan, converted, id), brief);
    updateProject(project.id, { contentKind: target.contentKind });
    toast.success(`已套進${target.label}畫布`);
    await navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
  }

  function toCalendar(id: ConvertTargetId) {
    const target = CONVERT_TARGETS.find((row) => row.id === id)!;
    upsertSchedule({
      id: uid("sch"),
      title: `${pack.copy.hook} · ${target.label}`,
      contentKind: target.contentKind,
      status: "scheduled",
      scheduledAt: tonightAt(2),
      publishedAt: null,
      projectId: null,
      campaignId: null,
      captionPreview: captionForTarget(converted, id),
    });
    toast.success(`已排進日曆（${target.label}）`);
    void navigate({ to: "/calendar" });
  }

  async function copyText(id: ConvertTargetId) {
    const text = clipboardText(converted, id);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製");
    } catch {
      toast.message(text.slice(0, 80));
    }
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {CONVERT_TARGETS.map((target) => (
        <article key={target.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs text-muted">{target.label}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {previewLines(converted, target.id)
              .slice(0, 5)
              .map((line, i) => (
                <li key={`${target.id}-${i}`} className="line-clamp-2">
                  {line}
                </li>
              ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void toCanvas(target.id)}>
              套進畫布
            </Button>
            <Button size="sm" variant="secondary" onClick={() => toCalendar(target.id)}>
              排進日曆
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void copyText(target.id)}>
              複製
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
