import { createFileRoute } from "@tanstack/react-router";
import { ConnectionsPage } from "@/components/connections/connections-page";

export const Route = createFileRoute("/connections")({
  validateSearch: (raw: Record<string, unknown>): { connected?: string; error?: string } => ({
    connected: typeof raw.connected === "string" ? raw.connected : undefined,
    error: typeof raw.error === "string" ? raw.error : undefined,
  }),
  component: ConnectionsRoute,
});

function ConnectionsRoute() {
  const search = Route.useSearch();
  return <ConnectionsPage search={search} />;
}
