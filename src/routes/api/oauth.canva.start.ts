import { createFileRoute } from "@tanstack/react-router";
import { publicOrigin } from "@/lib/oauth/session.server";

async function handle({ request }: { request: Request }) {
  const origin = publicOrigin(request);
  try {
    const { canvaAuthorizeUrl } = await import("@/lib/oauth/canva.server");
    const url = await canvaAuthorizeUrl(request);
    if (!url) return Response.redirect(`${origin}/connect?error=canva-unconfigured`, 302);
    return Response.redirect(url, 302);
  } catch {
    return Response.redirect(`${origin}/connect?error=canva-start`, 302);
  }
}

export const Route = createFileRoute("/api/oauth/canva/start")({
  server: { handlers: { GET: handle } },
});
