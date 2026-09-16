import { createFileRoute } from "@tanstack/react-router";
import { finishOauth } from "@/lib/connections/oauth.server";
import { isProvider } from "@/lib/connections/providers";

export const Route = createFileRoute("/api/connections/$provider/callback")({
  server: {
    handlers: {
      GET: ({ request, params }) => {
        if (!isProvider(params.provider)) return new Response("unknown provider", { status: 404 });
        return finishOauth(request, params.provider);
      },
    },
  },
});
