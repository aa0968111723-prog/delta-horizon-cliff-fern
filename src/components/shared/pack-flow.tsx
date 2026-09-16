import { CalendarDays, Check, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { convertPackOf } from "@/lib/studio/convert-pack";
import { applyFlowToPack, packFlowActions } from "@/lib/studio/pack-flow";
import { stampForProject } from "@/lib/studio/schedule";
import type { FlowActionId } from "@/lib/studio/status";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

function formatWhen(ms: number | null | undefined): string {
  if (!ms) return "";
  return new Date(ms).toLocaleString("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** 同一則做成的全套：一次標完成、一次排進日曆、貼完一次標已發。 */
export function PackFlowBar({
  projectId,
  className,
}: {
  projectId: string;
  className?: string;
}) {
  const projects = useStudio((s) => s.projects);
  const campaigns = useStudio((s) => s.campaigns);
  const updateProject = useStudio((s) => s.updateProject);
  const pack = convertPackOf(projects, projectId);
  if (pack.length < 2) return null;
  const actions = packFlowActions(pack);
  const primary = pack[0]!;

  function run(action: FlowActionId) {
    const at = action === "published" ? Date.now() : stampForProject(primary, campaigns);
    for (const member of applyFlowToPack(pack, action, at)) {
      updateProject(member.id, {
        status: member.status,
        scheduledAt: member.scheduledAt,
        publishedAt: member.publishedAt,
      });
    }
    if (action === "done") toast.success("全套標成完成了。可以排程或直接發。");
    else if (action === "scheduled") toast.success(`全套已排到 ${formatWhen(at)}，可在日曆改期。`);
    else if (action === "published") toast.success("全套標成已發布。之後生成會把這些當成過去內容。");
    else if (action === "unpublish") toast.success("全套改回還沒發。");
    else if (action === "unschedule") toast.success("全套從日曆拿下來了。");
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {actions.map((action) => (
        <Button
          key={action.id}
          size="sm"
          variant={action.id === actions[0]?.id ? "default" : "secondary"}
          aria-label={action.label}
          onClick={() => run(action.id)}
        >
          {action.id === "published" ? (
            <Send className="size-4" aria-hidden />
          ) : action.id === "scheduled" || action.id === "unschedule" ? (
            <CalendarDays className="size-4" aria-hidden />
          ) : (
            <Check className="size-4" aria-hidden />
          )}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
