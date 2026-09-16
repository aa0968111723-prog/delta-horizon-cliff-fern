import { createFileRoute } from "@tanstack/react-router";
import { ConnectionCenter } from "@/components/connections/connection-center";

export const Route = createFileRoute("/connections")({
  validateSearch: (search: Record<string, unknown>): { focus?: string; status?: string } => ({
    focus: typeof search.focus === "string" ? search.focus : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
  }),
  component: ConnectionsRoute,
});

function ConnectionsRoute() {
  const search = Route.useSearch();
  return <ConnectionCenter focus={search.focus} status={search.status} />;
}
