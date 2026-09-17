import { StatusBadge } from "@/components/shared/status-badge";
import type { Project } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

export function ContentFlowBar({
  project,
  className,
}: {
  project: Project;
  variant?: "full" | "compact" | "badge";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <StatusBadge status={project.status} />
    </div>
  );
}
