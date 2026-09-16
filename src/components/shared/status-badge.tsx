import { Badge } from "@/components/ui/badge";
import { statusLabel, statusTone } from "@/lib/studio/status";
import type { ContentStatus, ProjectStatus } from "@/lib/studio/types";

export function StatusBadge({
  status,
  contentStatus,
}: {
  status: ProjectStatus;
  contentStatus?: ContentStatus;
}) {
  return <Badge variant={statusTone(status, contentStatus)}>{statusLabel(status, contentStatus)}</Badge>;
}
