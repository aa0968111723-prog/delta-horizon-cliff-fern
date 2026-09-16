import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/lib/studio/status";
import type { ProjectStatus } from "@/lib/studio/types";

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.tone}>{meta.label}</Badge>;
}
