import type { ContentKind } from "../studio/types.ts";

/** Full campaigns schedule every format. 做成限動 only writes Story rows. */
export function createsScheduleRow(scheduleKinds: ContentKind[] | undefined, kind: ContentKind) {
  if (!scheduleKinds) return true;
  return scheduleKinds.includes(kind);
}
