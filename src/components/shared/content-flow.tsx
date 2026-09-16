import { CalendarDays, Check, Send } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { defaultScheduleAt, postingTime, suggestSchedule } from "@/lib/studio/schedule";
import { applyFlowToProject, flowActions, primaryFlowAction, statusLabel, type FlowActionId } from "@/lib/studio/status";
import type { Campaign, Project } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

function scheduleStamp(project: Project, campaigns: Campaign[]): number {
  if (project.scheduledAt) return project.scheduledAt;
  const linked = campaigns.filter((campaign) => campaign.id === project.campaignId);
  const hit = suggestSchedule([project], linked.length ? linked : campaigns)[0];
  if (hit) return hit.at;
  const campaign = linked[0];
  const { hour, minute } = postingTime(campaign);
  return defaultScheduleAt(Date.now(), hour, minute);
}

function formatWhen(ms: number | null | undefined): string {
  if (!ms) return "";
  return new Date(ms).toLocaleString("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ContentFlowBar({
  project,
  variant = "full",
  className,
}: {
  project: Project;
  variant?: "full" | "compact" | "badge";
  className?: string;
}) {
  const campaigns = useStudio((s) => s.campaigns);
  const updateProject = useStudio((s) => s.updateProject);
  const actions = flowActions(project.status);
  const primary = primaryFlowAction(project.status);

  function run(action: FlowActionId) {
    const at = action === "published" ? Date.now() : scheduleStamp(project, campaigns);
    const next = applyFlowToProject(project, action, at);
    updateProject(project.id, next);
    if (action === "done") toast.success("這則標成完成了。可以排程或直接發。");
    else if (action === "scheduled") toast.success(`已排到 ${formatWhen(next.scheduledAt)}，可在日曆改期。`);
    else if (action === "published") toast.success("已標成已發布。之後生成會把這則當成過去內容。");
    else if (action === "unschedule") toast.success("已從日曆拿下來。");
    else if (action === "unpublish") toast.success("改回還沒發。");
    else if (action === "making") toast.success("改回創作中。");
  }

  if (variant === "badge") {
    return (
      <div className={className}>
        <ContentStatusMenu project={project} onRun={run} />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <ContentStatusMenu project={project} onRun={run} />
        {primary ? (
          <Button
            size="sm"
            variant={project.status === "published" ? "ghost" : "secondary"}
            aria-label={primary.label}
            onClick={() => run(primary.id)}
          >
            {primary.id === "published" ? <Send className="size-4" /> : primary.id === "scheduled" ? <CalendarDays className="size-4" /> : <Check className="size-4" />}
            <span className="hidden sm:inline">{primary.label}</span>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <ContentStatusMenu project={project} onRun={run} />
        {project.scheduledAt ? (
          <span className="text-xs tabular-nums text-muted">排程 {formatWhen(project.scheduledAt)}</span>
        ) : null}
        {project.status === "published" && project.publishedAt ? (
          <span className="text-xs tabular-nums text-muted">已發 {formatWhen(project.publishedAt)}</span>
        ) : null}
      </div>
      <p className="text-xs text-muted">一人網宣只走這五步：想法、創作中、完成、已排程、已發布。</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            size="sm"
            variant={action.id === primary?.id ? "default" : "secondary"}
            onClick={() => run(action.id)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ContentStatusMenu({
  project,
  onRun,
}: {
  project: Project;
  onRun: (action: FlowActionId) => void;
}) {
  const actions = flowActions(project.status);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="rounded-full" aria-label={`狀態 ${statusLabel(project.status)}`}>
          <StatusBadge status={project.status} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem key={action.id} onSelect={() => onRun(action.id)}>
            <span className="flex flex-col">
              <span>{action.label}</span>
              <span className="text-xs text-muted">{action.hint}</span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>現在是{statusLabel(project.status)}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
