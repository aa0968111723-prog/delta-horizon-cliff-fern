import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/lib/studio/status";
import type { ContentStatus } from "@/lib/studio/types";

export function StatusBadge({ status }: { status: ContentStatus }) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.tone}>{meta.label}</Badge>;
}
