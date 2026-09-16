import { createFileRoute } from "@tanstack/react-router";
import { CreatePage, type CreateSearch } from "@/components/create/create-page";

export const Route = createFileRoute("/create")({
  validateSearch: (search: Record<string, unknown>): CreateSearch => ({
    kind: typeof search.kind === "string" ? search.kind : undefined,
    from: typeof search.from === "string" ? search.from : undefined,
    seed: typeof search.seed === "string" ? search.seed : undefined,
    contentId: typeof search.contentId === "string" ? search.contentId : undefined,
    campaignId: typeof search.campaignId === "string" ? search.campaignId : undefined,
    step: typeof search.step === "string" ? search.step : undefined,
    asset: typeof search.asset === "string" ? search.asset : undefined,
    pack: typeof search.pack === "string" ? search.pack : undefined,
  }),
  component: CreateRoute,
});

function CreateRoute() {
  const search = Route.useSearch();
  return <CreatePage search={search} />;
}
