import { createFileRoute } from "@tanstack/react-router";
import { CreateStudio } from "@/components/create/create-studio";
import { createSearchParams, type CreateSearch } from "@/lib/studio/create-search";

export type { CreateSearch };

export const Route = createFileRoute("/create")({
  validateSearch: (search: Record<string, unknown>): CreateSearch => {
    return createSearchParams({
      mode: typeof search.mode === "string" ? search.mode : undefined,
      idea: typeof search.idea === "string" ? search.idea : undefined,
      asset: typeof search.asset === "string" ? search.asset : undefined,
      campaign: typeof search.campaign === "string" ? search.campaign : undefined,
    });
  },
  component: CreateStudio,
});
