import { createFileRoute } from "@tanstack/react-router";
import { OAuthCallback } from "@/components/oauth/oauth-callback";

export const Route = createFileRoute("/oauth/canva")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : "",
    state: typeof search.state === "string" ? search.state : "",
    error: typeof search.error === "string" ? search.error : "",
  }),
  component: CanvaOAuthPage,
});

function CanvaOAuthPage() {
  const search = Route.useSearch();
  return <OAuthCallback provider="canva" code={search.code} state={search.state} error={search.error} />;
}
