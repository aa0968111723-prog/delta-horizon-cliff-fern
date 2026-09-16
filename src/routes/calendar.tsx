import { createFileRoute } from "@tanstack/react-router";
import { ContentCalendar } from "@/components/calendar/content-calendar";

export const Route = createFileRoute("/calendar")({
  component: ContentCalendar,
});
