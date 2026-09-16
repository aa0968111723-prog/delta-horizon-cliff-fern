export const CALENDAR_DRAG_MIME = "application/x-tku-calendar";

export type CalendarMoveTarget =
  | { kind: "content"; id: string }
  | { kind: "pack"; ids: string[] }
  | { kind: "wave"; campaignId: string; waveId: string };

export function serializeCalendarDrag(target: CalendarMoveTarget): string {
  return JSON.stringify(target);
}

export function parseCalendarDragPayload(raw: string | null | undefined): CalendarMoveTarget | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const rec = parsed as Record<string, unknown>;
    if (rec.kind === "content" && typeof rec.id === "string" && rec.id) {
      return { kind: "content", id: rec.id };
    }
    if (rec.kind === "pack" && Array.isArray(rec.ids) && rec.ids.length && rec.ids.every((id) => typeof id === "string")) {
      return { kind: "pack", ids: rec.ids };
    }
    if (rec.kind === "wave" && typeof rec.campaignId === "string" && typeof rec.waveId === "string") {
      return { kind: "wave", campaignId: rec.campaignId, waveId: rec.waveId };
    }
    return null;
  } catch {
    return null;
  }
}

export function parseCalendarDrag(transfer: DataTransfer | null | undefined): CalendarMoveTarget | null {
  if (!transfer) return null;
  try {
    return parseCalendarDragPayload(transfer.getData(CALENDAR_DRAG_MIME) || transfer.getData("text/plain"));
  } catch {
    return null;
  }
}

export function writeCalendarDrag(transfer: DataTransfer | null | undefined, target: CalendarMoveTarget): void {
  if (!transfer) return;
  const payload = serializeCalendarDrag(target);
  try {
    transfer.effectAllowed = "move";
  } catch {
    // some synthetic DataTransfer objects are read-only
  }
  try {
    transfer.setData(CALENDAR_DRAG_MIME, payload);
  } catch {
    // Chromium tests sometimes only allow text/plain
  }
  try {
    transfer.setData("text/plain", payload);
  } catch {
    // ignore
  }
}
