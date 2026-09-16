import { addDays, differenceInCalendarDays, formatISO, isSameDay, parseISO, startOfDay } from "date-fns";
import {
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Campaign, ContentItem } from "./types";

export type CalendarView = "month" | "week" | "agenda";

export type CalendarDay = {
  date: string;
  inMonth: boolean;
  items: ContentItem[];
};

export function isoDay(value: Date | string) {
  const date = typeof value === "string" ? parseISO(value) : value;
  return formatISO(startOfDay(date), { representation: "date" });
}

export function plannedDay(item: ContentItem) {
  return isoDay(item.plannedAt);
}

export function movePlannedAt(plannedAt: string, targetDay: string) {
  const time = plannedAt.match(/T(\d{2}:\d{2}(?::\d{2})?)/)?.[1] ?? "19:00:00";
  const offset = plannedAt.match(/([+-]\d{2}:\d{2}|Z)$/)?.[1] ?? "";
  return `${targetDay}T${time}${offset}`;
}

export function monthGrid(anchor: Date, items: ContentItem[]): CalendarDay[] {
  const monthStart = startOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date) => ({
    date: isoDay(date),
    inMonth: date.getMonth() === anchor.getMonth(),
    items: items.filter((item) => isSameDay(parseISO(item.plannedAt), date)),
  }));
}

export function weekGrid(anchor: Date, items: ContentItem[]): CalendarDay[] {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  const end = endOfWeek(anchor, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map((date) => ({
    date: isoDay(date),
    inMonth: true,
    items: items.filter((item) => isSameDay(parseISO(item.plannedAt), date)),
  }));
}

export function agendaDays(items: ContentItem[], from: Date, horizonDays = 21): CalendarDay[] {
  const start = startOfDay(from);
  const end = addDays(start, horizonDays);
  return eachDayOfInterval({ start, end }).map((date) => ({
    date: isoDay(date),
    inMonth: true,
    items: items
      .filter((item) => isSameDay(parseISO(item.plannedAt), date))
      .sort((a, b) => a.plannedAt.localeCompare(b.plannedAt)),
  }));
}

export function upcomingItems(items: ContentItem[], from = new Date(), limit = 5) {
  return [...items]
    .filter((item) => parseISO(item.plannedAt).getTime() >= startOfDay(from).getTime())
    .sort((a, b) => a.plannedAt.localeCompare(b.plannedAt))
    .slice(0, limit);
}

export function shiftWeek(anchor: Date, direction: -1 | 1) {
  return addWeeks(anchor, direction);
}

export function campaignNameOf(campaigns: Campaign[], campaignId: string) {
  return campaigns.find((campaign) => campaign.id === campaignId)?.name ?? "活動";
}

export const CALENDAR_DRAG_MIME = "text/zen-content";

export function writeCalendarDrag(transfer: Pick<DataTransfer, "setData" | "effectAllowed">, contentId: string) {
  transfer.setData(CALENDAR_DRAG_MIME, contentId);
  transfer.setData("text/plain", contentId);
  transfer.effectAllowed = "move";
}

export function readCalendarDrag(transfer: Pick<DataTransfer, "getData">) {
  return transfer.getData(CALENDAR_DRAG_MIME) || transfer.getData("text/plain");
}

export function daysUntil(dateIso: string, from = new Date()) {
  return differenceInCalendarDays(startOfDay(parseISO(dateIso)), startOfDay(from));
}

export function daysUntilLabel(dateIso: string, from = new Date()) {
  const days = daysUntil(dateIso, from);
  if (days < 0) return "已結束";
  if (days === 0) return "就是今天";
  return `還有 ${days} 天`;
}

export function calendarSurface(
  narrow: boolean,
  desktop: CalendarView,
  mobile: Extract<CalendarView, "agenda" | "week">,
): CalendarView {
  return narrow ? mobile : desktop;
}
