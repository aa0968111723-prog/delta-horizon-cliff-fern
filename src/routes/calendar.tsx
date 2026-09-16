import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/components/calendar/calendar-page";

type Search = {
  day?: string;
};

export const Route = createFileRoute("/calendar")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    day: typeof s.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.day) ? s.day : undefined,
  }),
  component: CalendarRoute,
});

function CalendarRoute() {
  const { day } = Route.useSearch();
  return <CalendarPage focusDay={day} />;
}
