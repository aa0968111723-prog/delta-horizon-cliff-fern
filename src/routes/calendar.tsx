import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarPage } from "@/components/calendar/calendar-page";
import { calendarSearchParams, type CalendarSearch } from "@/lib/studio/calendar-search";

export type { CalendarSearch };

export const Route = createFileRoute("/calendar")({
  validateSearch: (search: Record<string, unknown>): CalendarSearch => {
    return calendarSearchParams({
      campaign: typeof search.campaign === "string" ? search.campaign : undefined,
    });
  },
  component: CalendarPage,
});
