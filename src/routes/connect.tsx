import { createFileRoute } from "@tanstack/react-router";
import { ConnectionCenter } from "@/components/connect/connection-center";

export type ConnectSearch = {
  ok?: string;
  error?: string;
  revoked?: string;
};

export const Route = createFileRoute("/connect")({
  validateSearch: (search: Record<string, unknown>): ConnectSearch => {
    const next: ConnectSearch = {};
    if (typeof search.ok === "string") next.ok = search.ok;
    if (typeof search.error === "string") next.error = search.error;
    if (typeof search.revoked === "string") next.revoked = search.revoked;
    return next;
  },
  component: ConnectionCenter,
});
