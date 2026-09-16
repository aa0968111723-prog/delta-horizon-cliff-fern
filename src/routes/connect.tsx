import { createFileRoute } from "@tanstack/react-router";
import { ConnectCenter } from "@/components/connect/connect-center";

type Search = {
  ok?: string;
  notice?: string;
};

export const Route = createFileRoute("/connect")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ok: typeof s.ok === "string" ? s.ok : undefined,
    notice: typeof s.notice === "string" ? s.notice : undefined,
  }),
  component: ConnectPage,
});

function ConnectPage() {
  const search = Route.useSearch();
  return <ConnectCenter notice={search.notice} connected={search.ok} />;
}
