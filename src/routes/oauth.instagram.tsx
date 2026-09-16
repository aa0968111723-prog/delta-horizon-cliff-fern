import { createFileRoute } from "@tanstack/react-router";
import { OAuthCallback } from "@/components/oauth/oauth-callback";

export const Route = createFileRoute("/oauth/instagram")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : "",
    state: typeof search.state === "string" ? search.state : "",
    error: typeof search.error === "string" ? search.error : "",
  }),
  component: InstagramOAuthPage,
});

function InstagramOAuthPage() {
  const search = Route.useSearch();
  return <OAuthCallback provider="instagram" code={search.code} state={search.state} error={search.error} />;
}
