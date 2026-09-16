import { createFileRoute } from "@tanstack/react-router";
import { CampaignListPage } from "@/components/campaigns/campaign-list";

export const Route = createFileRoute("/campaigns/")({
  validateSearch: (search: Record<string, unknown>): { new?: string } => ({
    new: typeof search.new === "string" ? search.new : undefined,
  }),
  component: CampaignsIndex,
});

function CampaignsIndex() {
  const search = Route.useSearch();
  return <CampaignListPage openNew={search.new === "1"} />;
}
