import { createFileRoute } from "@tanstack/react-router";
import { SearchPage } from "@/components/search/search-page";

export const Route = createFileRoute("/search")({
  validateSearch: (raw: Record<string, unknown>): { q?: string } => ({
    q: typeof raw.q === "string" ? raw.q : undefined,
  }),
  component: SearchRoute,
});

function SearchRoute() {
  const search = Route.useSearch();
  return <SearchPage initialQuery={search.q ?? ""} />;
}
