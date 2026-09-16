import { createFileRoute } from "@tanstack/react-router";
import { handleConnect } from "@/lib/connect/handlers";

export const Route = createFileRoute("/api/connect/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleConnect(request),
      POST: ({ request }) => handleConnect(request),
    },
  },
});
