import { createFileRoute } from "@tanstack/react-router";
import { parseProviderId, startOAuth } from "@/lib/connections/oauth.server";

function providerFrom(request: Request, params?: { id?: string }) {
  return parseProviderId(params?.id) ?? parseProviderId(new URL(request.url).pathname.split("/")[3]);
}

export const Route = createFileRoute("/api/connections/$id/start")({
  server: {
    handlers: {
      GET: ({ request, params }: { request: Request; params?: { id: string } }) => {
        const id = providerFrom(request, params);
        if (!id) return new Response("unknown provider", { status: 404 });
        return startOAuth(request, id);
      },
    },
  },
});
