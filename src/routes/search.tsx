import { createFileRoute } from "@tanstack/react-router";
import { CreativeSearchPage } from "@/components/search/creative-search";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: SearchRoute,
});

function SearchRoute() {
  const search = Route.useSearch();
  return <CreativeSearchPage initialQuery={search.q} />;
}
