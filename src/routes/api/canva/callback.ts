import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/canva/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const { publicAppOriginFromRequest } = await import("@/lib/connections/provider-env.server");
        const origin = publicAppOriginFromRequest(request) ?? url.origin;
        const dest = new URL("/connections", origin);
        const error = url.searchParams.get("error");
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (error || !code || !state) {
          dest.searchParams.set("canva", "error");
          dest.searchParams.set("reason", "denied");
          return Response.redirect(dest, 302);
        }
        try {
          const { completeCanvaOAuth } = await import("@/lib/connections/canva-oauth.server");
          const result = await completeCanvaOAuth(code, state);
          dest.searchParams.set("canva", result.ok ? "connected" : "error");
        } catch {
          dest.searchParams.set("canva", "error");
        }
        return Response.redirect(dest, 302);
      },
    },
  },
});
