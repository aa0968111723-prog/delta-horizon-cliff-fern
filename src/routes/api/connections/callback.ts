import { createFileRoute } from "@tanstack/react-router";
import { handleOAuthCallback } from "@/lib/connections/oauth.server";

export const Route = createFileRoute("/api/connections/callback")({
  server: {
    handlers: {
      GET: ({ request }) => handleOAuthCallback(request),
    },
  },
});
