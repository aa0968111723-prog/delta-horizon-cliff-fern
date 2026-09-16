import { createFileRoute } from "@tanstack/react-router";
import { publicOrigin } from "@/lib/oauth/session.server";

async function handle({ request }: { request: Request }) {
  const origin = publicOrigin(request);
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (error || !code || !state) {
    return Response.redirect(`${origin}/connect?error=canva-denied`, 302);
  }
  try {
    const { exchangeCanvaCode } = await import("@/lib/oauth/canva.server");
    await exchangeCanvaCode(request, code, state);
    return Response.redirect(`${origin}/connect?connected=canva`, 302);
  } catch {
    return Response.redirect(`${origin}/connect?error=canva-exchange`, 302);
  }
}

export const Route = createFileRoute("/api/oauth/canva/callback")({
  server: { handlers: { GET: handle } },
});
