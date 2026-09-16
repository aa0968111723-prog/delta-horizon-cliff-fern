import { createFileRoute } from "@tanstack/react-router";
import { ConnectionCenter } from "@/components/connect/connection-center";

export const Route = createFileRoute("/connect")({ component: ConnectionCenter });
