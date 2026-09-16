import { createFileRoute } from "@tanstack/react-router";
import { connectionsUrl, parseProviderId, redirectTo } from "@/lib/connections/oauth.server";

function providerFrom(request: Request, params?: { id?: string }) {
  return parseProviderId(params?.id) ?? parseProviderId(new URL(request.url).pathname.split("/")[3]);
}

export const Route = createFileRoute("/api/connections/$id/sync")({
  server: {
    handlers: {
      GET: ({ request, params }: { request: Request; params?: { id: string } }) => {
        const id = providerFrom(request, params);
        if (!id) return new Response("unknown provider", { status: 404 });
        return redirectTo(connectionsUrl(request, { focus: id, status: "synced" }));
      },
    },
  },
});
