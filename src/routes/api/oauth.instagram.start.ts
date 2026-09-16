import { createFileRoute } from "@tanstack/react-router";
import { publicOrigin } from "@/lib/oauth/session.server";

async function handle({ request }: { request: Request }) {
  const origin = publicOrigin(request);
  try {
    const { instagramAuthorizeUrl } = await import("@/lib/oauth/instagram.server");
    const url = await instagramAuthorizeUrl(request);
    if (!url) return Response.redirect(`${origin}/connect?error=instagram-unconfigured`, 302);
    return Response.redirect(url, 302);
  } catch {
    return Response.redirect(`${origin}/connect?error=instagram-start`, 302);
  }
}

export const Route = createFileRoute("/api/oauth/instagram/start")({
  server: { handlers: { GET: handle } },
});
