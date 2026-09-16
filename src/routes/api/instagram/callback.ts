import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/instagram/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const { publicAppOriginFromRequest } = await import("@/lib/connections/provider-env.server");
        const origin = publicAppOriginFromRequest(request) ?? url.origin;
        const dest = new URL("/instagram", origin);
        const error = url.searchParams.get("error");
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (error || !code || !state) {
          dest.searchParams.set("ig", "error");
          dest.searchParams.set("reason", "denied");
          return Response.redirect(dest, 302);
        }
        try {
          const { completeInstagramOAuth } = await import("@/lib/connections/instagram-oauth.server");
          const result = await completeInstagramOAuth(code, state);
          dest.searchParams.set("ig", result.ok ? "connected" : "error");
        } catch {
          dest.searchParams.set("ig", "error");
        }
        return Response.redirect(dest, 302);
      },
    },
  },
});
