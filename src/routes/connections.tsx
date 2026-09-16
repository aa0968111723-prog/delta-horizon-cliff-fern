import { createFileRoute } from "@tanstack/react-router";
import { ConnectionCenter } from "@/components/connections/connection-center";

export const Route = createFileRoute("/connections")({
  component: ConnectionCenter,
});
